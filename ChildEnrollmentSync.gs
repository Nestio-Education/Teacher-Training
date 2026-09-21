/**
 * ============================================================================
 * SpaceECE HAALS - Child Enrollment Google Sheet to Database Auto-Sync
 * ============================================================================
 * 
 * Instructions to Install:
 * 1. Open your Google Sheet: 
 *    https://docs.google.com/spreadsheets/d/1sjXMeCrP-9M6neyHPEVSbbB-wl3X4S4EnVT8AETL26k/edit
 * 2. In top menu, click 'Extensions' -> 'Apps Script'.
 * 3. Replace/Paste this complete script into Code.gs (or ChildEnrollmentSync.gs).
 * 4. Click 'Project Settings' (gear icon on left) -> 'Script Properties' -> 'Add script property':
 *    Property: HAALS_SYNC_SECRET
 *    Value: 62088284c5af1efe970f1eb7789a2063b41814765e81f6fe6ff3c08307b40477
 * 5. Set Automatic Trigger:
 *    - Click 'Triggers' (clock icon on the left menu).
 *    - Click '+ Add Trigger' (bottom right).
 *    - Choose function: 'onFormSubmitTrigger'
 *    - Event source: 'From spreadsheet'
 *    - Event type: 'On form submit'
 *    - Failure notification: 'Immediately'
 *    - Click 'Save' and authorize permissions.
 * 6. (Optional) Run 'backfillAllEnrollmentRows' once to sync all past records.
 * ============================================================================
 */

var HAALS_ENROLLMENT_BACKEND_URL = "https://nestio-preschool-website.onrender.com/api/haals/children/sync";

// Securely read secret from Script Properties or fallback
var HAALS_SYNC_SECRET = PropertiesService.getScriptProperties().getProperty("HAALS_SYNC_SECRET") || "62088284c5af1efe970f1eb7789a2063b41814765e81f6fe6ff3c08307b40477";
var SHEET_TAB_NAME = "Form responses 1";
var BATCH_SIZE = 100;

/**
 * Triggered automatically when a new response is submitted to the Google Form.
 */
function onFormSubmitTrigger(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TAB_NAME) || SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (!sheet) {
      Logger.log("Error: Target sheet tab not found.");
      return;
    }

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var rowData = {};

    var rowValues = e && e.values ? e.values : sheet.getActiveRange().getValues()[0];
    for (var i = 0; i < headers.length; i++) {
      rowData[headers[i]] = rowValues[i];
    }

    var payload = JSON.stringify([rowData]);
    var options = {
      method: "post",
      contentType: "application/json",
      payload: payload,
      headers: {
        "x-sync-secret": HAALS_SYNC_SECRET
      },
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(HAALS_ENROLLMENT_BACKEND_URL, options);
    Logger.log("Child Enrollment onFormSubmit response code: " + response.getResponseCode());
    Logger.log("Child Enrollment response text: " + response.getContentText());
  } catch (err) {
    Logger.log("Error in onFormSubmitTrigger: " + err.toString());
  }
}

/**
 * Backfills all existing enrolled children rows from the Google Sheet into the MongoDB database.
 */
function backfillAllEnrollmentRows() {
  var startTime = new Date().getTime();
  Logger.log("=== Starting HAALS Child Enrollment Backfill ===");

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TAB_NAME) || SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (!sheet) {
    Logger.log("Error: Sheet not found.");
    return;
  }

  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();

  if (lastRow <= 1) {
    Logger.log("No child enrollment data rows found (lastRow = " + lastRow + ").");
    return;
  }

  var totalRows = lastRow - 1;
  Logger.log("Found " + totalRows + " enrolled child rows and " + lastColumn + " columns in '" + sheet.getName() + "'.");

  var headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  var dataRange = sheet.getRange(2, 1, totalRows, lastColumn).getValues();

  var payloadArray = [];
  for (var r = 0; r < dataRange.length; r++) {
    var rowValues = dataRange[r];
    var rowData = {};
    for (var c = 0; c < headers.length; c++) {
      rowData[headers[c]] = rowValues[c];
    }
    payloadArray.push(rowData);
  }

  var totalBatches = Math.ceil(payloadArray.length / BATCH_SIZE);
  Logger.log("Syncing " + payloadArray.length + " child records in " + totalBatches + " batches (Batch Size: " + BATCH_SIZE + ")...");

  var successCount = 0;
  var failedCount = 0;

  for (var i = 0; i < payloadArray.length; i += BATCH_SIZE) {
    var batchIndex = Math.floor(i / BATCH_SIZE) + 1;
    var batch = payloadArray.slice(i, i + BATCH_SIZE);
    var rowStart = i + 1;
    var rowEnd = i + batch.length;

    Logger.log("[" + batchIndex + "/" + totalBatches + "] Sending rows " + rowStart + " to " + rowEnd + " (" + batch.length + " rows)...");

    var options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(batch),
      headers: {
        "x-sync-secret": HAALS_SYNC_SECRET
      },
      muteHttpExceptions: true
    };

    var batchStart = new Date().getTime();
    var success = false;
    var maxRetries = 2;

    for (var attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        var response = UrlFetchApp.fetch(HAALS_ENROLLMENT_BACKEND_URL, options);
        var code = response.getResponseCode();
        var batchDuration = ((new Date().getTime() - batchStart) / 1000).toFixed(1);

        if (code === 200) {
          successCount += batch.length;
          Logger.log("✓ Batch " + batchIndex + " OK (" + batch.length + " children synced in " + batchDuration + "s)");
          success = true;
          break;
        } else {
          var responseText = response.getContentText();
          Logger.log("✗ Batch " + batchIndex + " Failed (HTTP " + code + " in " + batchDuration + "s): " + responseText);
          break;
        }
      } catch (fetchErr) {
        if (attempt < maxRetries) {
          Logger.log("⚠️ Batch " + batchIndex + " attempt " + attempt + " failed / server waking up. Retrying in 2s...");
          Utilities.sleep(2000);
        } else {
          Logger.log("✗ Batch " + batchIndex + " Exception: " + fetchErr.toString());
        }
      }
    }

    if (!success) {
      failedCount += batch.length;
    }

    Utilities.sleep(150);
  }

  var totalDuration = ((new Date().getTime() - startTime) / 1000).toFixed(1);
  Logger.log("=== Child Enrollment Backfill Completed in " + totalDuration + "s ===");
  Logger.log("Total children synced: " + successCount + " | Failed: " + failedCount + " out of " + totalRows + " rows.");
}

/**
 * Quick Test Function: Syncs only first 5 rows for immediate verification.
 */
function testEnrollmentSyncSample5() {
  Logger.log("=== Testing Child Enrollment Sync with First 5 Rows ===");
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TAB_NAME) || SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var lastColumn = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  var sampleRows = sheet.getRange(2, 1, Math.min(5, sheet.getLastRow() - 1), lastColumn).getValues();

  var payload = [];
  for (var r = 0; r < sampleRows.length; r++) {
    var row = {};
    for (var c = 0; c < headers.length; c++) {
      row[headers[c]] = sampleRows[r][c];
    }
    payload.push(row);
  }

  Logger.log("Sending " + payload.length + " sample rows to " + HAALS_ENROLLMENT_BACKEND_URL);
  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    headers: {
      "x-sync-secret": HAALS_SYNC_SECRET
    },
    muteHttpExceptions: true
  };

  var res = UrlFetchApp.fetch(HAALS_ENROLLMENT_BACKEND_URL, options);
  Logger.log("HTTP Status: " + res.getResponseCode());
  Logger.log("Response Body: " + res.getContentText());
}
