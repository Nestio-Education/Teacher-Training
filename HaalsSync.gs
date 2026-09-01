/**
 * SpaceECE HAALS - Home Visit Observation Sheet Sync
 * 
 * 1. onFormSubmitTrigger(e): Triggered automatically when a new response is submitted.
 * 2. backfillAllRows(): Backfills all existing rows from the sheet to the backend in fast batches.
 * 3. testSyncSample10Rows(): Tests the sync with just the first 10 rows for quick verification.
 */

var HAALS_BACKEND_URL = "https://nestio-preschool-website.onrender.com/api/haals/visits";
var HAALS_SYNC_SECRET = "spaceece_haals_sync_secret_token_2026";
var SHEET_TAB_NAME = "Form responses 1";
var BATCH_SIZE = 150; // Optimized batch size

function onFormSubmitTrigger(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TAB_NAME);
    if (!sheet) {
      Logger.log("Error: Tab '" + SHEET_TAB_NAME + "' not found.");
      return;
    }
    
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var rowData = {};
    
    var rowValues = e && e.values ? e.values : sheet.getActiveRange().getValues()[0];
    for (var i = 0; i < headers.length; i++) {
      rowData[headers[i]] = rowValues[i];
    }
    
    var payload = JSON.stringify(rowData);
    var options = {
      method: "post",
      contentType: "application/json",
      payload: payload,
      headers: {
        "x-sync-secret": HAALS_SYNC_SECRET
      },
      muteHttpExceptions: true
    };
    
    var response = UrlFetchApp.fetch(HAALS_BACKEND_URL, options);
    Logger.log("onFormSubmit response code: " + response.getResponseCode());
    Logger.log("onFormSubmit response: " + response.getContentText());
  } catch (err) {
    Logger.log("Error in onFormSubmitTrigger: " + err.toString());
  }
}

function backfillAllRows() {
  var startTime = new Date().getTime();
  Logger.log("=== Starting HAALS Home Visit Backfill ===");
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TAB_NAME);
  if (!sheet) {
    Logger.log("Error: Sheet tab '" + SHEET_TAB_NAME + "' not found. Please check tab name.");
    return;
  }
  
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();
  
  if (lastRow <= 1) {
    Logger.log("No data rows found to sync (lastRow = " + lastRow + ").");
    return;
  }
  
  var totalRows = lastRow - 1;
  Logger.log("Found " + totalRows + " data rows and " + lastColumn + " columns in '" + SHEET_TAB_NAME + "'.");
  
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
  Logger.log("Starting batch sync: " + payloadArray.length + " rows in " + totalBatches + " batches (Batch Size: " + BATCH_SIZE + ")...");
  
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
    try {
      var response = UrlFetchApp.fetch(HAALS_BACKEND_URL, options);
      var code = response.getResponseCode();
      var responseText = response.getContentText();
      var batchDuration = ((new Date().getTime() - batchStart) / 1000).toFixed(1);
      
      if (code === 200) {
        successCount += batch.length;
        Logger.log("✓ Batch " + batchIndex + " OK (took " + batchDuration + "s): " + responseText);
      } else {
        failedCount += batch.length;
        Logger.log("✗ Batch " + batchIndex + " Failed (HTTP " + code + " in " + batchDuration + "s): " + responseText);
      }
    } catch (fetchErr) {
      failedCount += batch.length;
      Logger.log("✗ Batch " + batchIndex + " Network Exception: " + fetchErr.toString());
    }
    
    Utilities.sleep(100);
  }
  
  var totalDuration = ((new Date().getTime() - startTime) / 1000).toFixed(1);
  Logger.log("=== Backfill Completed in " + totalDuration + "s ===");
  Logger.log("Total synced: " + successCount + " | Failed: " + failedCount + " out of " + totalRows + " rows.");
}

function testSyncSample10Rows() {
  Logger.log("=== Testing HAALS Sync with First 10 Rows ===");
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TAB_NAME);
  var lastColumn = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  var sampleRows = sheet.getRange(2, 1, Math.min(10, sheet.getLastRow() - 1), lastColumn).getValues();
  
  var payload = [];
  for (var r = 0; r < sampleRows.length; r++) {
    var row = {};
    for (var c = 0; c < headers.length; c++) {
      row[headers[c]] = sampleRows[r][c];
    }
    payload.push(row);
  }
  
  Logger.log("Sending " + payload.length + " sample rows to " + HAALS_BACKEND_URL);
  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    headers: {
      "x-sync-secret": HAALS_SYNC_SECRET
    },
    muteHttpExceptions: true
  };
  
  var res = UrlFetchApp.fetch(HAALS_BACKEND_URL, options);
  Logger.log("HTTP Status: " + res.getResponseCode());
  Logger.log("Response Body: " + res.getContentText());
}