'use strict';

(function(exports) {

  var dataset = [
  { id : "x",         s : "Are y" },
  { id : "mobile20",  s : "Are you going to join us for lunch?" },
  { id : "mobile89",  s : "Is she done yet?" }
  ];

  var results = [];

var TypeTestHandler = function(app) {
  this.app = app;
  this._typeTestSessionId = null;
  this._started = this._starting = false;
  this.currentSentenceObj = null;
  this.currentCharPos = 0;
};

TypeTestHandler.prototype.STATUS_ELEMENT_ID = 'type-test-status';
TypeTestHandler.prototype.LAST_RESULT_ELEMENT_ID = 'type-test-last-result';
TypeTestHandler.prototype.CURRENT_SENTENCE_ELEMENT_ID = 'type-test-current-sentence';
TypeTestHandler.prototype.PROGRESS_BAR_ELEMENT_ID = 'progress-bar';

TypeTestHandler.prototype.start = function(keyArray) {
  this._starting = true;
  this.currentSentenceSpan = document.getElementById(this.CURRENT_SENTENCE_ELEMENT_ID);
  this.statusSpan = document.getElementById(this.STATUS_ELEMENT_ID);
  this.lastResultSpan = document.getElementById(this.LAST_RESULT_ELEMENT_ID);
  this.progressBar = document.getElementById(this.PROGRESS_BAR_ELEMENT_ID);
  
  this.register(keyArray)
    .then(function(resp){
      debugger;

      //TODO: check response

      this._typeTestSessionId = resp;

      //tell touchtrack to start tracking keys
      this.app.postMessage({
        api: 'touchTrack',
        method: 'startTracking'
      });

      //init first sentence
      if(dataset && dataset.length){
        this._setNewSentence(dataset[0]);
      }

      this._started = true;
    }.bind(this)).catch(function (e) {
      //TODO: do something with the error?
      this.statusSpan.innerHTML = e;
      this._starting = false;
    }.bind(this));
};

TypeTestHandler.prototype.register = function(keyArray) {
  return new Promise(function(resolve, reject) {
    var jsonString = JSON.stringify(keyArray);
    var xhr = new window.XMLHttpRequest({mozSystem: true});
    xhr.open("post", "/api/register/", true);
    xhr.setRequestHeader("Content-type", "application/json;charset=UTF-8");
    xhr.setRequestHeader("Content-length", jsonString.length);
    xhr.addEventListener("load", transferDone, false);
    xhr.addEventListener("error", transferDone, false);
    xhr.addEventListener("abort", transferDone, false);

    function transferDone(ev) {
      if(xhr.status == 200){
          resolve(xhr.response);
      } else {
          reject(ev);
      }
    }
    xhr.send(jsonString);
  }.bind(this));
};

TypeTestHandler.prototype.sendToServer = function(obj) {
  //send data to server
  var jsonString = JSON.stringify(obj);
  var xhr = new window.XMLHttpRequest({mozSystem: true});
  xhr.open("post", "/api/sentence/" + this._typeTestSessionId, true);
  xhr.setRequestHeader("Content-type", "application/json;charset=UTF-8");
  xhr.setRequestHeader("Content-length", jsonString.length);
  xhr.addEventListener("load", transferDone, false);
  xhr.addEventListener("error", transferDone, false);
  xhr.addEventListener("abort", transferDone, false);

  function transferDone(ev) {
    if(xhr.status == 200){
        obj.uploaded = true;
    } else {
        //try again? 
    }
  }
  xhr.send(jsonString);
};

TypeTestHandler.prototype.processLog = function(logMessage) {
  debugger;
  var logData = logMessage.logData;
  var currentResultObject = results[logMessage.data.id];
  if(!currentResultObject)
    return;

  //log and save data
  currentResultObject.data = logData;
  console.log(currentResultObject);
  this.sendToServer(currentResultObject);

  //show some feedback to ui
  this.statusSpan.innerHTML = "Well done, lets find you a new sentence!";
  this.lastResultSpan.innerHTML = "999 char p/m";

  //fetch new sentence
  setTimeout(function(){
    var idx = dataset.indexOf(this.currentSentenceObj);
    if(dataset.length <= ++idx)
      this.statusSpan.innerHTML = "You are done woohooo!";
    else
      this._setNewSentence(dataset[idx]);
  }.bind(this), 200);
}

TypeTestHandler.prototype._sentenceDone = function() {
  return this.currentSentenceObj.s.length <= this.currentCharPos;
};

TypeTestHandler.prototype._setNewSentence = function(newSentenceObj) {
  //TODO: create sentence object
  if(typeof newSentenceObj === "string")
    throw new Error('Expect sentence object');

  var resultId = Math.random().toString(32).substr(2, 8);
  results[resultId] = { id: Math.random().toString(32).substr(2, 8), 
                        sentence: newSentenceObj, 
                        wrongCharCount: 0,
                        data:'', 
                        done: false, 
                        uploaded: false };

  this.currentResultId = resultId;
  this.currentSentenceObj = newSentenceObj;
  this.currentSentenceSpan.innerHTML = newSentenceObj.s;
  this.currentCharPos = 0;
  this.progressBar.style.width = 0;
  this.statusSpan.innerHTML = "You can start typing!";
};

TypeTestHandler.prototype._endCurrentSentence = function() {
  console.log('TypeTestHandler: End current sentence');

  if(window.navigator.vibrate)
    window.navigator.vibrate(400);
  debugger;
  //get key logs and prepare for next sentence?
  this.app.postMessage({
    api: 'touchTrack',
    method: 'getLogAndStop',
    id: this.currentResultId
  });

  //reset keyboard context info
  //this.postMessage({
  //  api: 'inputmethod',
  //  method: 'setInputContext',
  //  ctx: true,
  //  selectionStart: 0,
  //  selectionEnd: 0,
  //  textBeforeCursor: '',
  //  textAfterCursor: ''
  //});

  this.statusSpan.innerHTML = "Waiting for score";
};

TypeTestHandler.prototype.checkInputChar = function(char){
    if(!this._started || this._sentenceDone())
      return false;

    if(!this.currentSentenceObj || !this.currentSentenceObj.s || !this.currentSentenceObj.s.length)
      throw new Error('TypeTest: Can\'t check input if we don\'t have a an active sentence.');
    
    if(this.currentCharPos === 0)
      this.statusSpan.innerHTML = "Go go go!";
    

    var sentence = this.currentSentenceObj.s;
    var spanEl = this.currentSentenceSpan;

    //check input
    if(sentence[this.currentCharPos] !== char){
      
      if(results[this.currentResultId]){
        results[this.currentResultId].wrongCharCount++;
      }

      console.log('Wrong char');
      if(window.navigator.vibrate)
        window.navigator.vibrate(50);

      return false;
    }

    if(sentence.length <= ++this.currentCharPos){
      this._endCurrentSentence();
    }
    
    this.progressBar.style.width = (this.currentCharPos / sentence.length) * 100 + '%';

    window.requestAnimationFrame(function() {
      //remove current text
      while(spanEl.lastChild){
        spanEl.removeChild(spanEl.lastChild);
      }

      //add new text with already typed part as strong
      var strEl = document.createElement('strong');
      strEl.appendChild(document.createTextNode(sentence.slice(0, this.currentCharPos)))
      spanEl.appendChild(strEl);
      spanEl.appendChild(document.createTextNode(sentence.slice(this.currentCharPos)));
    }.bind(this));

    return true;
};

exports.TypeTestHandler = TypeTestHandler;

}(window));