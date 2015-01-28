'use strict';

(function(exports) {

var TypeTestScoreHandler = function() {
  this.countTotalTime = 0;
  this.countTotalChar = 0;
  this.countTotalWrongChar = 0;
};

TypeTestScoreHandler.prototype.LAST_CORRECT_CPM_ELEMENT_ID = 'correct-cpm';
TypeTestScoreHandler.prototype.LAST_WRONG_CPM_ELEMENT_ID = 'wrong-cpm';
TypeTestScoreHandler.prototype.TOTAL_CORRECT_CPM_ELEMENT_ID = 'correct-cpm-total';
TypeTestScoreHandler.prototype.TOTAL_WRONG_CPM_ELEMENT_ID = 'wrong-cpm-total';

TypeTestScoreHandler.prototype.LAST_CORRECT_CHAR_ELEMENT_ID = 'correct-char';
TypeTestScoreHandler.prototype.LAST_WRONG_CHAR_ELEMENT_ID = 'wrong-char';
TypeTestScoreHandler.prototype.TOTAL_CORRECT_CHAR_ELEMENT_ID = 'correct-char-total';
TypeTestScoreHandler.prototype.TOTAL_WRONG_CHAR_ELEMENT_ID = 'wrong-char-total';

TypeTestScoreHandler.prototype.start = function() {
  this.correctCpm = document.getElementById(this.LAST_CORRECT_CPM_ELEMENT_ID);
  this.wrongCpm = document.getElementById(this.LAST_WRONG_CPM_ELEMENT_ID);
  this.totalCorrectCpm = document.getElementById(this.TOTAL_CORRECT_CPM_ELEMENT_ID);
  this.totalWrongCpm = document.getElementById(this.TOTAL_WRONG_CPM_ELEMENT_ID);

  this.correctChar = document.getElementById(this.LAST_CORRECT_CHAR_ELEMENT_ID);
  this.wrongChar = document.getElementById(this.LAST_WRONG_CHAR_ELEMENT_ID);
  this.totalCorrectChar = document.getElementById(this.TOTAL_CORRECT_CHAR_ELEMENT_ID);
  this.totalWrongChar = document.getElementById(this.TOTAL_WRONG_CHAR_ELEMENT_ID);
}

TypeTestScoreHandler.prototype.stop = function() {
  this.countTotalTime = 0;
  this.countTotalChar = 0;
  this.countTotalWrongChar = 0;

  this.correctCpm = null;
  this.wrongCpm = null;
  this.totalCorrectCpm = null;
  this.totalWrongCpm = null;

  this.correctChar = null;
  this.wrongChar = null;
  this.totalCorrectChar = null;
  this.totalWrongChar = null;
};

TypeTestScoreHandler.prototype.addSentence = function(res) {
  var lastTouch = res.data[res.data.length -1];
  this.countTotalTime += lastTouch.time;
  this.countTotalChar += res.sentence.s.length;
  this.countTotalWrongChar += res.wrongCharCount;
  
  //current cpm
  var tm = 60000 / lastTouch.time;
  this.correctCpm.innerHTML = 
    Math.floor(tm * res.sentence.s.length);
  this.wrongCpm.innerHTML = 
    Math.floor(tm * res.wrongCharCount);

  //total cpm
  var tmTotal = 60000 / this.countTotalTime;
  this.totalCorrectCpm.innerHTML = 
    Math.floor(tmTotal * this.countTotalChar);
  this.totalWrongCpm.innerHTML = 
    Math.floor(tmTotal * this.countTotalWrongChar);

  //current char count
  this.correctChar.innerHTML = res.sentence.s.length;
  this.wrongChar.innerHTML = res.wrongCharCount;

  //total char count
  this.totalCorrectChar.innerHTML = this.countTotalChar;
  this.totalWrongChar.innerHTML = this.countTotalWrongChar;
};

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
TypeTestHandler.prototype.CURRENT_SENTENCE_ELEMENT_ID = 'type-test-current-sentence';
TypeTestHandler.prototype.PROGRESS_BAR_ELEMENT_ID = 'progress-bar';

TypeTestHandler.prototype.start = function(resizeArgs, screenDimensions) {
  this._starting = true;
  this.currentSentenceSpan = document.getElementById(this.CURRENT_SENTENCE_ELEMENT_ID);
  this.statusSpan = document.getElementById(this.STATUS_ELEMENT_ID);
  this.progressBar = document.getElementById(this.PROGRESS_BAR_ELEMENT_ID);
  this.scoreHandler = new TypeTestScoreHandler();
  this.scoreHandler.start();

  this.register(resizeArgs, screenDimensions)
    .then(function(resp){
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

function doXHR(url, dataObject){
  return new Promise(function(resolve, reject) {
    var jsonString = JSON.stringify(dataObject);
    var xhr = new window.XMLHttpRequest({mozSystem: true});
    xhr.open('post', url, true);
    xhr.setRequestHeader('Content-type', 'application/json;charset=UTF-8');
    xhr.setRequestHeader('Content-length', jsonString.length);
    xhr.addEventListener('load', transferDone, false);
    xhr.addEventListener('error', transferDone, false);
    xhr.addEventListener('abort', transferDone, false);

    function transferDone(ev) {
      if(xhr.status === 200){
          resolve(xhr.response);
      } else {
          reject(xhr.response);
      }
    }

    try {
        xhr.send(jsonString);
      } catch (e) {
        reject(e);
        return;
      }
  }.bind(this));
}

TypeTestHandler.prototype.register = function(resizeArgs, screenDimensions) {
  //TODO validate data

  //send data to server
  return doXHR('/api/register/', { resizeArgs : resizeArgs, screenDimensions: screenDimensions });
};

TypeTestHandler.prototype.sendResultToServer = function(resultSentenceObj) {
  //TODO validate data

  //send data to server
  return doXHR('/api/sentence/' + this._typeTestSessionId, resultSentenceObj);
};

TypeTestHandler.prototype.processLog = function(logMessage) {
  var logData = logMessage.logData;
  var currentResultObject = results[logMessage.data.id];
  if(!currentResultObject || !logData || !logData.length)
    return;

  //log and save data
  currentResultObject.data = logData;
  console.log(currentResultObject);
  this.sendResultToServer(currentResultObject)
    .then(function success(response) {
        currentResultObject.uploaded = true;
    },function error(e) {
        //try again? 
    });

  //show some feedback to ui
  this.statusSpan.innerHTML = "Well done, lets find you a new sentence!";

  //calculate score
  this.scoreHandler.addSentence(currentResultObject);

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
  
  //get key logs and prepare for next sentence?
  this.app.postMessage({
    api: 'touchTrack',
    method: 'getLogAndClear',
    id: this.currentResultId
  });

  //reset keyboard context info
  this.app.postMessage({
    api: 'inputmethod',
    method: 'setInputContext',
    ctx: true,
    selectionStart: 0,
    selectionEnd: 0,
    textBeforeCursor: '',
    textAfterCursor: ''
  });
  
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