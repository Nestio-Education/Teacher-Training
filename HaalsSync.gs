function onFormSubmitTrigger(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form responses 1");
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowData = {};
  
  var rowValues = e ? e.values : sheet.getActiveRange().getValues()[0];
  for (var i = 0; i < headers.length; i++) {
    rowData[headers[i]] = rowValues[i];
  }
  
  var payload = JSON.stringify(rowData);
  var url = "https://nestio-preschool-website.onrender.com/api/haals/visits";
  var options = {
    method: "post",
    contentType: "application/json",
    payload: payload,
    headers: {
      "x-sync-secret": "spaceece_haals_sync_secret_token_2026"
    },
    muteHttpExceptions: true
  };
  
  UrlFetchApp.fetch(url, options);
}

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
  
  var batchSize = 100;
  for (var i = 0; i < payloadArray.length; i += batchSize) {
    var batch = payloadArray.slice(i, i + batchSize);
    var url = "https://nestio-preschool-website.onrender.com/api/haals/visits";
    var options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(batch),
      headers: {
        "x-sync-secret": "spaceece_haals_sync_secret_token_2026"
      },
      muteHttpExceptions: true
    };
    UrlFetchApp.fetch(url, options);
  }
}