/** ===========================================
 *  
 */
function emailLoop() {
  var startTime = Date.now();
  // Logger.log('Start email Loop ===========');    
  var emailLoopTrigger = getTriggerByFunction('emailLoop');
  if (emailLoopTrigger) {    
    // Logger.log(emailLoopTrigger.getHandlerFunction()+' trigger running ... call delete Trigger'  );    
    ScriptApp.deleteTrigger(emailLoopTrigger);  
  }
  
  var userProperties = PropertiesService.getUserProperties(); 
  var emailPropKey = 'LOG_EMAILS_CONTINUATION_TOKEN';   
  var strEmails = userProperties.getProperty(emailPropKey); 
  if (!strEmails) {   
    return;
  }
  
  // 330,000 ms = 1000*60*(6-0.5): 6 mins Max safe time
  var scriptProperties = PropertiesService.getScriptProperties(); 
  var maxTime = parseInt(scriptProperties.getProperty('maxTime'));     
  
  // 이메일 큐 준비
  var aEmail = strEmails.split(/,/);    
  var constEmails = aEmail.length;
  // Logger.log(constEmails + ' email Loop Emails: ' + strEmails);    
  
  var email = aEmail[0]; // 이메일 큐: [0] 부터 꺼냄     
  
  // get Property 이메일 키로 작업 중인 폴더가 있을 때 처리
  var strPairFolders = userProperties.getProperty(email);
  if (strPairFolders) {
    // 이메일 키, 폴더s 프로퍼티를 삭제한다. 
    // 폴더 복사를 완료하지 못했으면 다시 만든다.
    userProperties.deleteProperty(email);  
    
    var aPairFolder = strPairFolders.split(/,/);
    if ( aPairFolder.length >= 2) {
      var rtnAPairFolder = remainderJob(email, aPairFolder, startTime, maxTime);       
      if ( rtnAPairFolder.length >= 2) {
        userProperties.setProperty(email, rtnAPairFolder.toString());  
        backupTrigger(60000);  
        return;
      } else {
        aEmail.shift();
      }
    } else {
      aEmail.shift();
    }      
  }
  
  // ====================================== start 이메일 루프   
  while (aEmail.length > 0 && Date.now() - startTime <= maxTime)  {
    var email = aEmail[0]; // 이메일 큐: [0] 부터 꺼냄    
    var strPairFolders = null;
    var aRtnPairFolder = recursiveCreateFolder(email);  
    if (aRtnPairFolder) {
      strPairFolders = aRtnPairFolder.toString();
    }
    if ( !strPairFolders) {
      aEmail.shift();                
      
      if (aEmail.length > 0 ) {             
        continue;
      } else {
        break;
      }
    }
    
    var aPairFolder = strPairFolders.split(/,/);
    // ====================================== start 폴더쌍 루프 
    while (aPairFolder.length >= 2) {
      var folderId = aPairFolder[0];
      var dstFolderId = aPairFolder[1];
      Logger.log('폴더 쌍[%s, %s]', folderId, dstFolderId);          
      var files =  DriveApp.getFolderById(folderId).getFiles();            
      if ( !files) {
        aPairFolder.splice(0, 2); // 폴더 쌍: 큐 [0]부터 2개 꺼냄      
        if (aPairFolder.length >= 2) {
          continue;        
        } else {
          // 이메일 키, 폴더쌍 작업 끝
          break;
        }        
      } 
      
      while (files.hasNext() && Date.now() - startTime <= maxTime) {
        var file = files.next();
        file.makeCopy(DriveApp.getFolderById(dstFolderId));              
        // Logger.log('file copy .getName: ' + file.getName());                    
      }          
      // 폴더에 복사할 파일이 남아 있는가?
      if ( files.hasNext()) {       
        var fileItorToken = files.getContinuationToken();
        userProperties.setProperty(folderId, fileItorToken);               
        break;
      }    
      // 폴더의 파일 복사 완료
      aPairFolder.splice(0, 2); // 폴더 쌍: 큐 [0]부터 2개 꺼냄      
      
    } // while(aPairFolder.length >= 2);
    // ====================================== end 폴더 쌍 루프     
    
    // 폴더에 복사할 파일이 남아 있는가?
    if ( files.hasNext()) {                 
      // 이메일 키, 폴더쌍 배열 property 설정 [email key, pair folder value]      
      userProperties.setProperty(email, aPairFolder.toString());   
      break;
    }    
    
    aEmail.shift();      
    
  } // while(aEmail.length > 0 && Date.now() - startTime <= maxTime);     
  // ====================================== end 이메일 루프     
  
  // 처리한 이메일의 갯수
  var eojEmail = constEmails - aEmail.length;  
  Logger.log('처리한 이메일의 갯수: '+eojEmail);
  if (!eojEmail) {
    backupTrigger(60000);  
    return;
  }
  
  // 다른 곳에서 큐에 추가 할 수도 있다.
  // 따라서 이메일 큐를 다시 읽어서 저장한다.
  var strEmails = userProperties.getProperty(emailPropKey); 
  var aReEmail = strEmails.split(/,/);    
  if (aReEmail.length > constEmails) {
    // 이메일이 추가되었으면 작업한 이메일 제거 후 프로퍼티 저장
    aReEmail.splice(0, eojEmail);
    userProperties.setProperty(emailPropKey, aReEmail.toString()); 
    backupTrigger(60000);  
  } else {
    if (aEmail.length <= 0) {
      userProperties.deleteProperty(emailPropKey); 
    } else {
      userProperties.setProperty(emailPropKey, aEmail.toString()); 
      backupTrigger(60000);  
    }
  }    
}
