function setScriptProperties() {  
  var scriptProperties = PropertiesService.getScriptProperties(); 
  // 330,000 ms = 1000*60*(6-0.5): 6 mins Max safe time
  scriptProperties.setProperty('maxTime', '330000');
  scriptProperties.setProperty('folder', 'eojji-backup');
}

function getFormId() {  
  var form = FormApp.getActiveForm();
  var strGetFormId = form.getId();
  Logger.log('form.getId() '+strGetFormId);
  // [16-07-01 16:16:18:287 JST] form.getId()1bvdoLliOjyjuayFyrMm38550OF4ZhQuvW9i8iQi-8DU
  var formResponses = form.getResponses();
  // Open a form by ID.
  //var form = FormApp.openById('1234567890abcdefghijklmnopqrstuvwxyz');
  /*
  Class Form getId()
  
  Gets the ID of the form.
  
  Return
  String — the ID of the form
  */
}

function test() {  
  var folderId = '0ByvFog45Yi_RMjVPUVZueTdDbE0';
  var files = DriveApp.getFolderById(folderId).getFiles(); 
  while ( files.hasNext()) {
    var file = files.next();
    Logger.log(file.getName());
  }
}

function getFormStrEmails() {  
  var formEmailKey = 'LOG_EMAILS_CONTINUATION_TOKEN';   
  var userProperties = PropertiesService.getUserProperties(); 
  return userProperties.getProperty(formEmailKey); 
}


function checkEmail(email) {   
  // email 검사
  // http://stackoverflow.com/questions/46155/validate-email-address-in-javascript  
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (! re.test(email)) {
    Logger.log('false reg exp validateEmail: ' + email);
    return false;
  }
  
  /*
  var atMarkPos = email.indexOf('@');
  if (atMarkPos <= 0) {
    return false;
  }
  // Logger.log('email.indexOf @: ' + atMarkPos);
  */


  //var email = 'backup@gmail.com';
  //var email = 'backupeojji.net';  
  var strDomain = email.split(/@/);
  // Logger.log(strDomain[1]);

  var aMailDomain = "gmail.com, eojji.net, eojji.com, eojji.kr";  
  var searchPos = aMailDomain.search(strDomain[1]);
  // Logger.log(strDomain[1] + 'email.indexOf @: ' + searchPos);  
  if (searchPos < 0) {
    return false;
  } 
  return true;
}

// http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function addPropertyValue(properties, propKey, propValue) {  
  var property = properties.getProperty(propKey); 
  if (property == null) {    
    property = propValue;
  } else {
    if (property.search(propValue) >= 0) {
      return properties;
    }
    property = property + ',' + propValue;
  }  
  return properties.setProperty(propKey, property);  
}


/*
 * propKey의 property csv 문자열에서 처음 항목 삭제 
 */
function shiftPropertyValue(propKey) {  
  var userProperties = PropertiesService.getUserProperties();    
  var property = userProperties.getProperty(propKey); 
  if (property == null) {    
    return;
  }   
  var arStr = property.split(/,/);      
  var str = arStr.shift();
  if ( arStr.length == 0) {    
    // 삭제
    userProperties.deleteProperty(propKey);             
  } else {
    userProperties.setProperty(propKey, arStr.toString());              
  }
  return str;  
}
