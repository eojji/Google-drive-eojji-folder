/*
 * return: files 작업완료 
 */
function copyFilesByPairFolders(aPairFolder, startTime, maxTime) {
  var userProperties = PropertiesService.getUserProperties();  
  var folderId = aPairFolder[0];
  var dstFolderId = aPairFolder[1];
  Logger.log('폴더 쌍[%s, %s]', folderId, dstFolderId);    
  
  var fileItorToken = userProperties.getProperty(folderId);      
  if (fileItorToken) {      
    var files = DriveApp.continueFileIterator(fileItorToken);           
    // file.makeCopy
    while (files.hasNext() && Date.now() - startTime <= maxTime) {
      var file = files.next();
      file.makeCopy(DriveApp.getFolderById(dstFolderId));              
      // Logger.log('file copy .getName: ' + file.getName());                    
    }    
    
    // 폴더에 복사할 파일이 남아 있는가?
    if ( files.hasNext()) {       
      // https://developers.google.com/apps-script/reference/drive/file-iterator#getcontinuationtoken
      // Class FileIterator.getContinuationToken()
      var fileItorToken = files.getContinuationToken();
      userProperties.setProperty(folderId, fileItorToken);              
      return fileItorToken;
    }           
    
    // 파일 복사 완료
    aPairFolder.splice(0, 2); // 폴더 쌍: 큐 [0]부터 2개 꺼냄      
    // Delete the userProperties [folderId key]
    userProperties.deleteProperty(folderId);            
    
    if (aPairFolder.length < 2) {
      return;
    }
  }
  
  // ==================
  // 폴더 쌍 배열 인자로 파일 복사 함수 호출
  /**
  * 폴더의 파일을 복사한다.
  * 주어진 시간에 끝내지 못하면 남은 폴더를 반환한다.
  * 처음하는 파일 복사
  * aPairFolder
  */
  //var files, aPairFolder, startTime, maxTime;
  
  var fCopyFiles = 
      function copyFilesFirst() {
        while ( aPairFolder.length >= 2) {    
          var folderId = aPairFolder[0];
          var dstFolderId = aPairFolder[1];
          Logger.log('폴더 쌍[%s, %s]', folderId, dstFolderId);  
          
          var files = DriveApp.getFolderById(folderId).getFiles();    
          if (!files.hasNext()) {        
            // Logger.log('File not found = aFolder.pop() ' + folderId.getName());     
            aPairFolder.splice(0, 2); // 폴더 쌍: 큐 [0]부터 2개 꺼냄      
            continue;
          }    
          while (files.hasNext() && Date.now() - startTime <= maxTime) {
            var file = files.next();
            file.makeCopy(file.getName(), DriveApp.getFolderById(dstFolderId));              
            Logger.log('file copy .getName: ' + file.getName());                    
          }    
          
          // 폴더에 복사할 파일이 남아 있는가?
          if ( files.hasNext()) {       
            return files;
          }               
          aPairFolder.splice(0, 2); // 폴더 쌍: 큐 [0]부터 2개 꺼냄      
        }   
      };  
  
  var rtnFiles = fCopyFiles(); 
  if (rtnFiles) {    
    Logger.log('Time over 실행 경과 시간: ' + (Date.now() - startTime));
    
    var fileItorToken = rtnFiles.getContinuationToken();
    userProperties.setProperty(aPairFolder[0], fileItorToken);      
    
    // userProperties.setProperty(email, aPairFolder.toString());          
    
    
    // fileCopyTriggerByms(30000);
    
    return fileItorToken;  
  } 
}




function testcopyFilesByPairFolders() {  
  var formEmailKey = 'LOG_EMAILS_CONTINUATION_TOKEN';   
  var userProperties = PropertiesService.getUserProperties(); 
  var strEmails =  getFormStrEmails(); // 'a@eojji.com'; //
  if (!strEmails) {   
      Logger.log('! strEmails');
    return;
  } else {
    Logger.log('strEmails: ' + strEmails);
  }    
  // return;
  
  
  
  var aEmail = strEmails.split(/,/);     
  var email = aEmail.shift();
  Logger.log('aEmail[0]: ' + email);
  
  // 최초 작업이면 공유 문서함에 있는 백업폴더 중 소유자가 이메일인 폴더의 복사본을 만든다.    
  var aRtnPairFolder = recursiveCreateFolder(email);  
  if ( aRtnPairFolder.length <= 0) {    
    return;
  }    
  // LOG_EMAILS 키로 이메일 큐 프로퍼티를 저장한다.  
  userProperties.setProperty(formEmailKey, email);    
  
  // var strConcat = aRtnPairFolder.toString().split(/,/);
  var aPairFolder = aRtnPairFolder.toString().split(/,/);    
  
  
  // 폴더쌍의 배열 property 설정 [email key, pair folder value]      
  userProperties.setProperty(email, aPairFolder.toString());      
  
  // ==================
  // 폴더 쌍 배열 인자로 파일 복사 함수 호출
  var startTime = Date.now(); 
  // recursiveCreateFolder 작업시간 1분 예상하여 시간 줄이기
  var maxTime = 210000; // 210,000 = 1000*60*3.5 Max safe time, 4.5 mins
  // var maxTime =  270000; // 270,000 = 1000*60*4.5 Max safe time, 4.5 mins;
  
  
  
  // *********************************************** test
  // 이미 폴더쌍이 있다.
  // 시간 초과로 다시 돌아왔다.
  /*
userProperties.setProperty(aPairFolder[0], fileItorToken);      

    userProperties.setProperty(email, aPairFolder.toString());          
    
    userProperties.setProperty(formEmailKey, email);      
   */
  
  
  var aRtn = copyFilesByPairFolders(aPairFolder, startTime, maxTime); 
  if (aRtn) {    
    userProperties.setProperty(email, aRtn.toString());      
  }     
  
  return;
}


  /*
  // userProperties.setProperty(formEmailKey, email);       



  
  
  
  
  
  
  
  var boolFileToken = false; // 파일작업 중
  
  // 폴더 쌍을 꺼내서 파일 복사 작업을 한다.  
  while ( aPairFolder.length > 0) {    
    var folderId = aPairFolder[0]; //.shift(); // 폴더 쌍: 큐[0] 부터 꺼냄
    var dstFolderId = aPairFolder[1]; //.shift();  
    Logger.log('폴더 쌍[%s, %s]', folderId, dstFolderId);  
    
    // userProperties [folderId key, fileItorToken]
    var files = null;
    // Class FileIterator.getContinuationToken()
    var fileItorToken = userProperties.getProperty(folderId);      
    if (fileItorToken) {      
      files = DriveApp.continueFileIterator(fileItorToken);   
      boolFileToken = true;
    } else {
      
      files = DriveApp.getFolderById(folderId).getFiles();    
      if (!files.hasNext()) {        
        Logger.log('File not found = aFolder.pop() ' + folderId.getName());     
        continue;
      }    
      
      
    }        
    
    // file.makeCopy
    while (files.hasNext() && Date.now() - startTime <= maxTime) {
      var file = files.next();
      file.makeCopy(file.getName(), DriveApp.getFolderById(dstFolderId));              
      // Logger.log('file copy .getName: ' + file.getName());                    
    }    
    
    // 폴더에 복사할 파일이 남아 있는가?
    if ( files.hasNext()) {       
      // https://developers.google.com/apps-script/reference/drive/file-iterator#getcontinuationtoken
      // Class FileIterator.getContinuationToken()
      var fileItorToken = files.getContinuationToken();
      userProperties.setProperty(folderId, fileItorToken);      
      
      aPairFolder.unshift(dstFolderId); // 폴더쌍 큐: [0] 부터 삽입
      aPairFolder.unshift(folderId);     
      return files;
    }           
    // 파일 복사 완료
    // Delete the userProperties [folderId key]
    userProperties.deleteProperty(folderId);        
    
    aPairFolder.shift(); // 폴더 쌍: 큐[0] 부터 꺼냄
    aPairFolder.shift();  
  } 
  */
