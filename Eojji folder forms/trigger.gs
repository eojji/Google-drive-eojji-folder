/*
 * 
 * [16-06-29 10:20:11:709 JST] fileCopy5minClock function running trigger
 * [16-06-29 10:20:11:710 JST] trigger delete fileCopy5minClock
 */ 
function fileCopyTrigger() {  
  var rtn = fileCopy5minClock();
  if (!rtn) {
    ScriptApp.newTrigger("fileCopy5minClock")
    .timeBased()
    .after(1)
    .create();
  }  
}

function backupTrigger(ms) {  
  var rtnTrigger = ScriptApp.newTrigger('emailLoop')
    .timeBased()
    .after(ms)
    .create();
  if ( rtnTrigger) {
    Logger.log(ms +' ms return New After Trigger: ' + rtnTrigger.getHandlerFunction());
  } else {
    Logger.log(ms +' ms return false !! New After Trigger');
  }
}

function fileCopyTriggerByms(ms) {  
  var rtnTrigger = ScriptApp.newTrigger('fileCopy5minClock')
    .timeBased()
    .after(ms)
    .create();
  if ( rtnTrigger) {
    Logger.log(ms +' ms return createTriggerFileCopy: ' + rtnTrigger.getHandlerFunction());
  } else {
    Logger.log(ms +' ms return false !!!! createTriggerFileCopy');
  }
}

function toggleTrigger() {
  var funcName = "fileCopy5minClock";
  var fileCopyTrigger = getTriggerByFunction(funcName);
  if (fileCopyTrigger) {    
    Logger.log(fileCopyTrigger.getHandlerFunction()+' trigger running ... call deleteFileCopyTrigger'  );
    
    // https://developers.google.com/apps-script/reference/script/script-app#deletetriggertrigger
    ScriptApp.deleteTrigger(fileCopyTrigger);        
    
  } else {
    
    var rtnTrigger = ScriptApp.newTrigger(funcName)
    .timeBased()
    .after(1)
    .create();
    Logger.log('return createTriggerFileCopy: ' + rtnTrigger.getHandlerFunction());
  }  
}

/*
https://developers.google.com/apps-script/reference/script/clock-trigger-builder#afterdurationmilliseconds
after(durationMilliseconds)

Specifies the duration (in milliseconds) after the current time that the trigger will run. (plus or minus 15 minutes).

 */
function testafterTrigger() {
  var funcName = "fileCopy5minClock";  
  // Creates a trigger that will run 10 minutes later
  return ScriptApp.newTrigger(funcName)
  .timeBased()
  .after(1)
  .create();
}


function getTriggerByFunction(funcName) {  
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() == funcName) {
      return triggers[i];       
    }        
  }  
}

/*
 * https://developers.google.com/apps-script/reference/script/clock-trigger-builder#everyminutesn
 */
function createTriggerFileCopy() {
  return ScriptApp.newTrigger("fileCopy5minClock")
   .timeBased()
   .everyMinutes(5)
   .create();   
}


function blGetTrigger(funcName) {  
 var triggers = ScriptApp.getProjectTriggers();
 for (var i = 0; i < triggers.length; i++) {
   if (triggers[i].getEventType() == ScriptApp.EventType.CLOCK) { 
     if (triggers[i].getHandlerFunction() == funcName) {
       Logger.log(funcName + " function running trigger");
       return true;       
     }
   }
 }
  return false;
}
