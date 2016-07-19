/** ===========================================
 * Class ClockTriggerBuilder.everyMinutes(n)
 * https://developers.google.com/apps-script/reference/script/clock-trigger-builder
 *  
 * fileCopy 5 Minutes Clock Trigger
 */
function fileCopy5minClock() {
  Logger.log('Start fileCopy5minClock ');
  var funcName = "fileCopy5minClock";
  var fileCopyTrigger = getTriggerByFunction(funcName);
  if (fileCopyTrigger) {    
    Logger.log(fileCopyTrigger.getHandlerFunction()+' trigger running ... call deleteFileCopyTrigger'  );
    
    // https://developers.google.com/apps-script/reference/script/script-app#deletetriggertrigger
    ScriptApp.deleteTrigger(fileCopyTrigger);  
  }

  
  var userProperties = PropertiesService.getUserProperties(); 
  var emailPropKey = 'LOG_EMAILS_CONTINUATION_TOKEN';   
  var strEmails = userProperties.getProperty(emailPropKey); 
  if (!strEmails) {   
    return;
  }
  Logger.log('strEmails: ' + strEmails);
  
  var aEmail = strEmails.split(/,/);    
  
  
  var startTime = Date.now();
  
  var scriptProperties = PropertiesService.getScriptProperties(); 
  // 330,000 ms = 1000*60*(6-0.5): 6 mins Max safe time
  var maxTime = parseInt(scriptProperties.getProperty('maxTime')); 
      
  
  // 이메일 루프 
  
  var email = aEmail.shift(); // 이메일 큐: [0] 부터 꺼냄 
  
  //==============================
  // 이메일을 key로 가진 폴더쌍의 프로퍼티를 찾는다.
  // 없으면 만들고
  // 있으면 폴더 쌍을 꺼내서 파일 복사 작업을 한다.
  //
  // 파일복사 작업 후 시간이 초과하면 프로프티를 재설정하고
  // 전체 폴더의 파일 복사 작업이 끝나면 이메일 프로프티를 재 설정한다.  
  
  var aPairFolder = null; 
  // 이메일을 key로 가진 폴더쌍의 프로퍼티를 찾는다.
  // 없으면 공유받은 폴더를 통해서 만든다.
  // 폴더 쌍을 꺼내서 파일 복사 작업을 한다.    
  // [email key, pair folder value] Property 가져오기
  var strPairFolders = userProperties.getProperty(email);
  if (strPairFolders != null) {
    aPairFolder = strPairFolders.split(/,/);  
  } else {
    // Property가 없으면 공유 받은 폴더를 통해서 만든다.
    Logger.log( email + ' key, Properties.get pair Folders == null');    
    var aRtnPairFolder = recursiveCreateFolder(email);  
    if ( aRtnPairFolder.length <= 0) {
      Logger.log('aPairFolder == null, recursiveCreateFolder: ' + email);
      // 폴더가 없으면 이메일 프로퍼티에서 해당 이메일 삭제하고 프로퍼티를 재 설정한다.
      // 이메일 큐에서 이메일 제거
      if ( aEmail.length > 0) {
        userProperties.setProperty(emailPropKey, aEmail.toString()); 
      } else {
        userProperties.deleteProperty(emailPropKey);        
      }              
      //var strEmail = popPropertyValue(emailPropKey);  
      //Logger.log('popPropertyValue(email): ' + strEmail);  
      
      return;
    }     
    
    // var strConcat = aRtnPairFolder.toString().split(/,/);
    aPairFolder = aRtnPairFolder.toString().split(/,/);    
    // Property 설정 [email key, pair folder value]      
    userProperties.setProperty(email, aPairFolder.toString());
  } 
  
  // aPairFolder.toString()
  Logger.log('start while ( aPairFolder.length > 0) ' + aPairFolder.toString());  
  
  
  // 폴더 쌍을 꺼내서 파일 복사 작업을 한다.  
  while ( aPairFolder.length > 0) {    
    var folderId = aPairFolder.shift(); // 폴더 쌍: 큐[0] 부터 꺼냄
    var dstFolderId = aPairFolder.shift();  
    Logger.log('폴더 쌍[%s, %s]', folderId, dstFolderId);  
    
    // userProperties [folderId key, fileItorToken]
    var files = null;
    // Class FileIterator.getContinuationToken()
    var fileItorToken = userProperties.getProperty(folderId);      
    if (fileItorToken == null) {      
      files = DriveApp.getFolderById(folderId).getFiles();    
      if (!files.hasNext()) {        
        Logger.log('File not found = aFolder.pop() ' + folderId.getName());     
        continue;
      }    
    } else {
      files = DriveApp.continueFileIterator(fileItorToken);     
      // Logger.log('tokenKey: ' + folderId + ' -- ok fileItorToken');
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
      userProperties.setProperty(email, aPairFolder.toString());      
      
      Logger.log('폴더에 file copy 작업중 time out');      
      
      fileCopyTriggerByms(30000);                
      
      return; // time out
    }           
    //
    // Delete the userProperties [folderId key, fileItorToken]
    userProperties.deleteProperty(folderId);        
    Logger.log('폴더에 file copy 작업 완료');         
  } // while end (aPairFolder.length > 0) ----------------------------
  
  // 이메일을 key로 가진 폴더쌍의 프로퍼티를 삭제한다.  
  userProperties.deleteProperty(email);
  
  // 전체 폴더의 파일 복사 작업이 끝나면 이메일 프로프티를 재 설정한다.
  // 모든 폴더의 파일 복사가 끝났다.
  // 이메일 큐에서 이메일 제거
  if ( aEmail.length > 0) {         
    userProperties.setProperty(emailPropKey, aEmail.toString()); 
    
    fileCopyTriggerByms(30000);  
    
  } else {
    userProperties.deleteProperty(emailPropKey);            
  }         
}
