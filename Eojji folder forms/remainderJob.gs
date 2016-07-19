// 남은 복사 작업이 있으면 처리
// (email, Pair folders)
//         ( folder ID, files)
//
// return: 남은 작업이 있으면 true

function remainderJob(email, aPairFolder, startTime, maxTime) {  
  var userProperties = PropertiesService.getUserProperties();   
  var folderId = aPairFolder[0];
  var dstFolderId = aPairFolder[1];        
  var fileItorToken = userProperties.getProperty(folderId);      
  if (fileItorToken) {                        
    // 폴더 키 프로퍼티를 삭제한다.
    userProperties.deleteProperty(folderId);             

    var files = DriveApp.continueFileIterator(fileItorToken);                
    while (files.hasNext() && Date.now() - startTime <= maxTime) {
      var file = files.next();
      file.makeCopy(DriveApp.getFolderById(dstFolderId));                    
    }          
    // 폴더에 복사할 파일이 남아 있는가?
    if ( files.hasNext()) {       
      var fileItorToken = files.getContinuationToken();
      userProperties.setProperty(folderId, fileItorToken);               
      return aPairFolder;      
    }   
    // 폴더의 파일 복사 완료
    aPairFolder.splice(0, 2); // 폴더 쌍: 큐 [0]부터 2개 꺼냄    
  }    
  
  // ====================================== start 폴더쌍 루프 
  while( aPairFolder.length >= 2) {
    var folderId = aPairFolder[0];
    var dstFolderId = aPairFolder[1];
    Logger.log('폴더 쌍[%s, %s]', folderId, dstFolderId);    
    var files =  DriveApp.getFolderById(folderId).getFiles();            
    while (files.hasNext() && Date.now() - startTime <= maxTime) {
      var file = files.next();
      file.makeCopy(DriveApp.getFolderById(dstFolderId));              
      // Logger.log('file copy .getName: ' + file.getName());                    
    }          
    if ( files.hasNext()) {       
      var fileItorToken = files.getContinuationToken();
      userProperties.setProperty(folderId, fileItorToken);               
      return aPairFolder;
    }    
    aPairFolder.splice(0, 2); // 폴더 쌍: 큐 [0]부터 2개 꺼냄          
  }
  // ====================================== end 폴더 쌍 루프  
  return aPairFolder;
} 
