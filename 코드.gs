var FOLDER = 'eojji-folder ';
var PROPERTYUSER = PropertiesService.getUserProperties();

function getEmailProperty() {    
  var email = PROPERTYUSER.getProperty('email');
  if (!email) {
    email = PropertiesService.getScriptProperties().getProperty('email');
    PROPERTYUSER.setProperty('email', email);    
  }
  return email;
}

function emailForm(formObject) {
  var formEmail = formObject.managerEmail;
  formEmail = formEmail.trim();
  if (!formEmail) {
     return 'Email을 입력해 주세요.';
  }
  var email = PROPERTYUSER.getProperty('email');
  if (formEmail == email) {
    return formEmail + '은 등록된 Email과 같습니다.';
  } else {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (re.test(formEmail)) {
      PROPERTYUSER.setProperty('email', formEmail);
      return formEmail + ' Email을 등록했습니다.';
    } else {
      return formEmail + ' Email 형식이 잘못되었습니다.<br /> 다시 입력하세요.';      
    }
  }
}

function eojjiFolder() {
  var email = PROPERTYUSER.getProperty('email');
  var root = DriveApp.getRootFolder();  
  var getFolders = root.getFoldersByName(FOLDER+email);
  if (getFolders.hasNext()) {
    var folder = getFolders.next();  
  } else {
    var folder = root.createFolder(FOLDER+email);
    folder.addEditor(email);
  }    
  return folder.getName();
}

function getUrlFromSuperSheet() {
  var email = PROPERTYUSER.getProperty('email');
  // EOJJI Folder Super Sheet
  var ssId = PropertiesService.getScriptProperties().getProperty('sheet');    
  var ss = SpreadsheetApp.openById(ssId);
  var sheet = ss.getSheetByName('Sheet1');  
  var range = sheet.getDataRange();
  var values = range.getValues();
  var url = "";
  for (var i = values.length-1; i > 0 ; i--) {
    if (values[i][1] == email ) {
      url = values[i][2];
      break;      
    }
  }
  // Logger.log(url); ?email=a@eojji.com&state=0
  if (url) {
    url = url + '?email=' + Session.getActiveUser().getEmail() + '&state=0';
  } else {
    var email = PropertiesService.getScriptProperties().getProperty('email');
    for (var i = values.length-1; i > 0 ; i--) {
      if (values[i][1] == email) {
        url = values[i][2];
        break;      
      }
    }    
  }
  // Logger.log(url);
  return url;   
}
/** ======================================================
 * HTML Service: Create and Serve HTML
 * https://developers.google.com/apps-script/guides/html/
 */
function doGet () {  
  return HtmlService.createHtmlOutputFromFile('Index')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

function copyFolderButton() {
  // EOJJI Folder receive sheet
  var url = getUrlFromSuperSheet();  
  // Logger.log('url '+ url);
  var oAuthToken = getOAuthToken();
  var response = UrlFetchApp.fetch(url, {
    headers: {
      Authorization: 'Bearer ' + oAuthToken
    }
  });   
  return response.getContentText();
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