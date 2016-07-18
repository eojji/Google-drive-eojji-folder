/** ======================================================
 *
 * Script url
 * https://script.google.com/d/1FuKuGpOQBIw86dfmblu7dZEvDNruZwMKZnU6U5oI50CB-4aozsoSDZ3k/edit?usp=sharing
 *
 * https://developers.google.com/apps-script/guides/html/communication 
 */

function eojjiFolder() {
  var scriptProperties = PropertiesService.getScriptProperties();
  var email = scriptProperties.getProperty('email');
  var strFolder = scriptProperties.getProperty('folder');  
  var root = DriveApp.getRootFolder();  
  var getFolders = root.getFoldersByName(strFolder);
  if (getFolders.hasNext()) {
    var folder = getFolders.next();  
  } else {
    var folder = root.createFolder(strFolder);
    folder.addEditor(email);
  }    
  return folder.getName();
}
 
/** ======================================================
 * HTML Service: Create and Serve HTML
 * https://developers.google.com/apps-script/guides/html/
 */
function doGet () {  
  return HtmlService.createHtmlOutputFromFile('Index')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}