// Google Sheets as a Database ? INSERT with Apps Script using POST/GET methods (with ajax example)
// https://mashe.hawksey.info/2014/07/google-sheets-as-a-database-insert-with-apps-script-using-postget-methods-with-ajax-example/
// Martin Hawksey July 4, 2014
//
// Usage
//  1. Enter sheet name where data is to be written below
        var SHEET_NAME = "Sheet1";
        
//  2. Run > setup
//
//  3. Publish > Deploy as web app 
//    - enter Project Version name and click 'Save New Version' 
//    - set security level and enable service (most likely execute as 'me' and access 'anyone, even anonymously) 
//
//  4. Copy the 'Current web app URL' and post this in your form/script action 
//
//  5. Insert column names on your destination sheet matching the parameter names of the data you are passing in (exactly matching case)
// 
// ------------------------
//
// 1. "Eojji folder Service" Web app
// https://script.google.com/macros/s/AKfycbwR98W3A3AkZfhJGcDAHzu0vmqKKaLGqOOkXSKZP9H2z1K5zZk4/exec
//
// 2. "EOJJI Folder receive sheet"
//
// 3. "Eojji folder copy" web app
// var copyApp = SCRIPT_PROP.getProperty("copy")
//
// http://www.eojji.com/notice/eojji-folder
// Kim huysep @huysep
//
// resource > view current trigger
//     add onOpen - spreadsheet open event
//
var SCRIPT_PROP = PropertiesService.getScriptProperties(); // new property service

// If you don't want to expose either GET or POST methods you can comment out the appropriate function
function doGet(e){
  return handleResponse(e);
}

function doPost(e){
  return handleResponse(e);
}

function handleResponse(e) {
  // shortly after my original solution Google announced the LockService[1]
  // this prevents concurrent access overwritting data
  // [1] http://googleappsdeveloper.blogspot.co.uk/2011/10/concurrency-and-google-apps-script.html
  // we want a public lock, one that locks for all invocations
  var lock = LockService.getPublicLock();
  lock.waitLock(30000);  // wait 30 seconds before conceding defeat.
  
  try {
    // next set where we write the data - you could write to multiple/alternate destinations
    var doc = SpreadsheetApp.openById(SCRIPT_PROP.getProperty("key"));
    var sheet = doc.getSheetByName(SHEET_NAME);
    
    // we'll assume header is in row 1 but you can override with header_row in GET/POST data
    var headRow = e.parameter.header_row || 1;
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var nextRow = sheet.getLastRow()+1; // get next row
    var row = []; 
    // loop through the header columns
    for (i in headers){
      if (headers[i] == "Timestamp"){ // special case if you include a 'Timestamp' column
        row.push(new Date());
      } else if (e.parameter[headers[i]]) {
        var paramVal = e.parameter[headers[i]];
        row.push(paramVal);
        if (headers[i] == "email") {           
          urlFetchAppFolderCopy(paramVal); // 'Eojji folder copy' web app           
        }
      } else {
        return ContentService
        .createTextOutput(JSON.stringify({"result":"error", "error": e}))
        .setMimeType(ContentService.MimeType.JSON);
      }            
    }
    // more efficient to set values as [][] array than individually
    sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);

    // return json success results
    return ContentService
          .createTextOutput(JSON.stringify({"result":"success", "row": nextRow}))
          .setMimeType(ContentService.MimeType.JSON);
  } catch(e){
    // if error return this
    return ContentService
          .createTextOutput(JSON.stringify({"result":"error", "error": e}))
          .setMimeType(ContentService.MimeType.JSON);
  } finally { //release lock
    lock.releaseLock();
  }
}

/**
 * Gets the user's OAuth 2.0 access token so that it can be passed to Picker.
 * This technique keeps Picker from needing to show its own authorization
 * dialog, but is only possible if the OAuth scope that Picker needs is
 * available in Apps Script. In this case, the function includes an unused call
 * to a DriveApp method to ensure that Apps Script requests access to all files
 * in the user's Drive.
 *
 * @return {string} The user's OAuth 2.0 access token.
 */
function getOAuthToken() {
  DriveApp.getRootFolder();
  return ScriptApp.getOAuthToken();
} 

function testUrlFetchAppFolderCopy(){
  urlFetchAppFolderCopy('freembx@gmail.com');
}
function urlFetchAppFolderCopy(email){
  // "Eojji folder copy" web app
  var copyApp = SCRIPT_PROP.getProperty("copy")
  var copyAppExec = copyApp + '?email=' + email;  
  Logger.log('copyAppExec ' + copyAppExec);  
  var oAuthToken = getOAuthToken();
  var response = UrlFetchApp.fetch(copyAppExec, {
    headers: {
      Authorization: 'Bearer ' + oAuthToken
    }
  });   
  return response.getContentText();
}

/**
 * https://developers.google.com/apps-script/guides/html/#serve_html_as_a_google_docs_sheets_or_forms_user_interface 
 */
function onOpen() {
  // https://developers.google.com/apps-script/reference/properties/properties#getProperty(String)   
  // Gets the user property 'sendUrl'.
  var userProperties = PropertiesService.getUserProperties();
  if (userProperties.getProperty('sendUrl')) {
    return;
  }
  
  // https://developers.google.com/apps-script/reference/script/script-app#getService()  
  // Get the URL of the published web app.
  var url = ScriptApp.getService().getUrl();  
  if (!url) {
    return;
  }
  sendAppUrl(url);
  userProperties.setProperty('sendUrl', url);
  // userProperties.deleteProperty('sendUrl');
}

function sendAppUrl(url) {  
  // https://developers.google.com/apps-script/reference/base/session#getActiveUser()    
  // Log the email address of the person running the script.
  var email = Session.getActiveUser().getEmail();
  //Logger.log(email);    
  var superSheetApp = 'https://script.google.com/macros/s/AKfycbzhSSeLVz6M7u1fRS1HgGSUsdxJ-my2bXW842t1q3gE4577NFgn/exec';
  var param =  '?Manager=' + email + '&ReceiveUrl=' + url;  
  var appExec = superSheetApp + param;
  // Logger.log(appExec);
  var oAuthToken = getOAuthToken();
  var response = UrlFetchApp.fetch(appExec, {
    headers: {
      Authorization: 'Bearer ' + oAuthToken
    }
  });   
  // return response.getContentText();
}

function setup() {
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  SCRIPT_PROP.setProperty("key", doc.getId());
  SCRIPT_PROP.setProperty("copy", 'https://script.google.com/macros/s/AKfycbysTVpf6tA3kj9NFzPFCRe0efEcI1FbZ0mGxwM0lEf-yccw8kY/exec');  
}