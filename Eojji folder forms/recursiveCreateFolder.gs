/**
 * function recursiveCreateFolder(email)
 *     return var aPairFolder = []; // 배열 요소: "source folder id,destination folder id"
 *
 * DriveApp.searchFolders('sharedWithMe and "' + email + '" in owners'); 
 *
 * fCreateFolderByFolder : 재귀 호출 함수
 * childDestiFolder = destiFolder.createFolder(childFolder.getName());
 */
function recursiveCreateFolder(email) {     
  var scriptProperties = PropertiesService.getScriptProperties();
  var sourceFolderName = scriptProperties.getProperty('folder');  

  var sourceFolder = null;
  var searchFolders = DriveApp.searchFolders('sharedWithMe and "' + email + '" in owners');
  while (searchFolders.hasNext()) {                 
    var folder = searchFolders.next();  
    // Logger.log('sourceFolder search.hasNext(): ' + folder.getName());    
    if ( folder.getName() == sourceFolderName) {
      sourceFolder = folder;
      break;
    } 
  }   
  if ( sourceFolder == null) {
    Logger.log('Not found: ' + sourceFolderName + ' ' + email);
    return;
  }        

  // closure 변수: [소스폴더,대상폴더]
  var aPairFolder = []; // 배열 요소: "source folder id,destination folder id"
  var fCreateFolderByFolder = ( 
    function f(sourceFolder, destiFolder) {        
      if (sourceFolder.getFiles().hasNext()) {  
        aPairFolder.push(sourceFolder.getId() + ',' + destiFolder.getId());      
      }      
      var childFolders = sourceFolder.getFolders();
      while ( childFolders.hasNext()) {
        var childFolder = childFolders.next();    
        var childDestiFolder = destiFolder.createFolder(childFolder.getName());
        f(childFolder, childDestiFolder);
      }        
    }
  );        
  
  // destination folder: email 폴더
  var emailFolder = null;
  var folders = DriveApp.getRootFolder().getFoldersByName(email);
  if (folders.hasNext()) {
    emailFolder = folders.next();
  } else {
    emailFolder = DriveApp.getRootFolder().createFolder(email);
    emailFolder.setShareableByEditors(false);
    emailFolder.addEditor(email);      
  }
  // email 폴더에 date time 폴더 만들기
  var objTime = new Date();  
  var destiFolder = emailFolder.createFolder(objTime.toLocaleDateString() + ' ' + objTime.toLocaleTimeString());        
  
  fCreateFolderByFolder(sourceFolder, destiFolder);  
  return aPairFolder;
}
