# HAALS Home Visit Observation Sync — Implementation Notes

This document logs design decisions, assumptions, and mappings implemented for the Home Visit Observation (HAALS) feature.

---

## 1. Sync Strategy & Webhook (Section 4)
* **Approach Chosen:** Google Apps Script Webhook (`POST /api/haals/visits`).
* **Reasoning:** Near real-time sync, lightweight, zero polling overhead on the backend.
* **Idempotency & Backfill:** The sync endpoint handles both a single row (real-time trigger) and an array of rows (one-time backfill). Duplicates are prevented via an upsert query based on a composite key: `visitDate` + `childName` + `facilitatorNameRaw`.

### Google Apps Script Trigger Blueprint
Install this script on the target Google Sheet containing the form responses:

```javascript
function onFormSubmitTrigger(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form responses 1");
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowData = {};
  
  // Map values from submit event or active row
  var rowValues = e ? e.values : sheet.getActiveRange().getValues()[0];
  for (var i = 0; i < headers.length; i++) {
    rowData[headers[i]] = rowValues[i];
  }
  
  var payload = JSON.stringify(rowData);
  var url = "http://YOUR_PORTAL_DOMAIN/api/haals/visits";
  var options = {
    method: "post",
    contentType: "application/json",
    payload: payload,
    headers: {
      "x-sync-secret": "YOUR_OPTIONAL_HAALS_SYNC_SECRET"
    },
    muteHttpExceptions: true
  };
  
  UrlFetchApp.fetch(url, options);
}

// For backfill
function backfillAllRows() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form responses 1");
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  var dataRange = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();
  
  var payloadArray = [];
  for (var r = 0; r < dataRange.length; r++) {
    var rowValues = dataRange[r];
    var rowData = {};
    for (var c = 0; c < headers.length; c++) {
      rowData[headers[c]] = rowValues[c];
    }
    payloadArray.push(rowData);
  }
  
  // Send in batches of 100 to prevent timeout
  var batchSize = 100;
  for (var i = 0; i < payloadArray.length; i += batchSize) {
    var batch = payloadArray.slice(i, i + batchSize);
    var url = "http://YOUR_PORTAL_DOMAIN/api/haals/visits";
    var options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(batch),
      headers: {
        "x-sync-secret": "YOUR_OPTIONAL_HAALS_SYNC_SECRET"
      },
      muteHttpExceptions: true
    };
    UrlFetchApp.fetch(url, options);
  }
}
```

---

## 2. Spreadsheet Mapping Assumptions (Section 4)
Because real headers differ from the clean database fields, the parser normalizes header strings (lowercased, whitespace and special characters stripped) and tries multiple variants to match:

* **Visit Date:** Matched against `dateofvisit`, `visitdate`, `timestamp`, or `date`.
* **Facilitator Name:** Matched against `nameoffieldfacilitator`, `facilitatorname`, `facilitator`, `fieldfacilitatorname`.
* **Village:** Matched against `villagearea`, `village`, `area`, or `address`.
* **Child Name:** Matched against `childsname` or `childname`.
* **Age Group:** Matched against `childsage` or `agegroup`.
* **Program:** Matched against `programenrolled` or `program`.
* **Willingness / Presence / Caregiver Availability:** Boolean conversions checking for "yes", "true", or "1".
* **Activities (1 & 2):** Parses nested array inputs of Activity `1` and `2` fields (e.g. `activityname1`, `domain1`, `milestonestatus1` / `milestonescore1`).

---

## 3. Name Normalization & Matching Strategies
Since records in the sheet only have names instead of Mongo ObjectIDs, we use the following strategy:

### Facilitator (Fellow) Match
* Case-insensitive, trimmed lookup against the `User` model where the role is `fellow` or `teacher`.
* **If matched:** Sets `facilitatorId` to the `User._id`.
* **If not matched:** Sets `facilitatorId` to `null` and logs `facilitatorNameRaw` to retain accountability.

### Child Match
* Scoped matching: If a facilitator is successfully matched, we query the `Child` collection first, matching `fullName` case-insensitively and scoping to the facilitator's assigned `classes` or `center`.
* Global matching: If scoped matching yields nothing, we perform a global case-insensitive search for a child with the matching name.
* **If matched:** Sets `childId` to the `Child._id`.
* **If not matched:** Sets `childId` to `null` and stores the raw text in `childName` to ensure the sync pipeline does not halt.
* **Limitations:** Homonymous children in different classes will match correctly *only* if their respective facilitators match successfully first to scope the lookup.

---

## 4. Authoritative Spreadsheet Tab
* **Default Tab:** `"Form responses 1"` is assumed to be the raw, authoritative source of truth.
* **Fallback:** The parser will handle any tab matching that matches common headers.

---

## 5. Metric Rollups (Section 5)
All metrics calculations are performed dynamically in-memory during request handling on the backend. This guarantees real-time metrics feedback without requiring scheduled cron jobs or database seeding steps.

---

## 6. AI Report Extension Point (Section 7 Stub)
* **Backend Endpoint:** `/api/haals/reports/generate-stub`
* **Trigger:** Click the **Draft AI Report** button on the Mentor comparison table. It fires a request to the stub endpoint, which responds with confirmation of the extension point structure, showing a success message to the mentor.
