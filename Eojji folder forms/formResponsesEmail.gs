/** ==================================
 * function formResponsesEmail()
 * 
 * 어찌 폴더 복사 신청 (구글 설문지) 
 *    http://goo.gl/forms/pwa6glHX7fjZw1G13
 *
 * 어찌 폴더 서비스 구글 문서 주소: 
 *    https://goo.gl/vDnMoZ  
 *
 */
function formResponsesEmail() {
  var startTime = Date.now();
  var scriptProperties = PropertiesService.getScriptProperties(); 
  // 330,000 ms = 1000*60*(6-0.5): 6 mins Max safe time
  var maxTime = parseInt(scriptProperties.getProperty('maxTime'));     
  Logger.log('formResponsesEmail maxTime 330,000 ms ? ' + maxTime);
    
  var form = FormApp.getActiveForm();
  var formResponses = form.getResponses();
  var email = formResponses[formResponses.length - 1].getItemResponses()[0].getResponse();
  email = email.trim();
  // email 검사
  if (! checkEmail(email)) {
    Logger.log('checkEmail false !, input Email: ' + email);
    return;
  } 
  var formEmailKey = 'LOG_EMAILS_CONTINUATION_TOKEN';  
  var userProperties = PropertiesService.getUserProperties();  
  var property = userProperties.getProperty(formEmailKey); 
  if (property) {    
    // 이미 있을 때
    if (property.search(email) >= 0) {          
      return;
    }
    property = property + ',' + email;          
    userProperties.setProperty(formEmailKey, property);
    return;
  }            
  
  // 최초 작업이면 공유 문서함에 있는 백업폴더 중 소유자가 이메일인 폴더의 복사본을 만든다.    
  var aRtnPairFolder = recursiveCreateFolder(email);  
  if ( aRtnPairFolder.length <= 0) {    
    return;
  }    

  var aPairFolder = aRtnPairFolder.toString().split(/,/);    
  // Property 설정 [email key, pair folder value]      
  // userProperties.setProperty(email, aPairFolder.toString());      
  
  // ==================
  // 폴더 쌍 배열 인자로 파일 복사 함수 호출
  /**
  * 폴더의 파일을 복사한다.
  * 주어진 시간에 끝내지 못하면 남은 폴더를 반환한다.
  * 처음하는 파일 복사
  * aPairFolder
  */
  //var files, aPairFolder, startTime, maxTime;
  
  var fCopyFiles = function copyFilesFirst() {
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

    userProperties.setProperty(email, aPairFolder.toString());          
    
    userProperties.setProperty(formEmailKey, email);       
    
    backupTrigger(60000);     
  } 
  
  Logger.log('실행 경과 시간 ms ' + (Date.now() - startTime));
}