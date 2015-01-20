'use strict';

(function(exports) {

  var dataset = [
  { "id" : "x",  "s":"Are y" },
  { "id" : "mobile20",  "s":"Are you going to join us for lunch?" },
  { "id" : "mobile89",  "s":"Is she done yet?" }
  ];

var TypeTestHandler = function(app) {
  this.app = app;
  this._started = false;
  this.currentSentenceObj = null;
  this.currentCharPos = 0;
};

TypeTestHandler.prototype.STATUS_ELEMENT_ID = 'type-test-status';
TypeTestHandler.prototype.LAST_RESULT_ELEMENT_ID = 'type-test-last-result';
TypeTestHandler.prototype.CURRENT_SENTENCE_ELEMENT_ID = 'type-test-current-sentence';

TypeTestHandler.prototype.start = function() {
  this.currentSentenceSpan = document.getElementById(this.CURRENT_SENTENCE_ELEMENT_ID);
  this.statusSpan = document.getElementById(this.STATUS_ELEMENT_ID);
  this.lastResultSpan = document.getElementById(this.LAST_RESULT_ELEMENT_ID);

  if(dataset && dataset.length){
    this._setNewSentence(dataset[0]);
  }

  this._started = true;
};

TypeTestHandler.prototype.processLog = function(logMessage) {
  var data = logMessage.logData;
  if(data.length)
    for(var i = 0; i < data.length; i++)
      console.log(data[i]);

    this.statusSpan.innerHTML = "Well done, lets find you a new sentence!";
    this.lastResultSpan.innerHTML = "Your result is 999 correct characters per minute";

    setTimeout(function(){
      var idx = dataset.indexOf(this.currentSentenceObj);
      if(dataset.length <= ++idx)
        this.statusSpan.innerHTML = "You are done woohooo!";
      else
        this._setNewSentence(dataset[idx]);
    }.bind(this),200);
}

TypeTestHandler.prototype._sentenceDone = function() {
  return this.currentSentenceObj.s.length <= this.currentCharPos;
};

TypeTestHandler.prototype._setNewSentence = function(newSentenceObj) {
  //TODO: create sentence object
  if(typeof newSentenceObj === "string")
    throw new Error('Expect sentence object');

  this.currentSentenceObj = newSentenceObj;
  this.currentSentenceSpan.innerHTML = newSentenceObj.s;
  this.currentCharPos = 0;
  this.statusSpan.innerHTML = "You can start typing!";
};

TypeTestHandler.prototype._endCurrentSentence = function() {
  console.log('TypeTestHandler: End current sentence');

  if(window.navigator.vibrate)
    window.navigator.vibrate(400);

  //get key logs and prepare for next sentence?
  this.app.postMessage({
    api: 'touchTrack',
    method: 'getLogAndStop'
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
      console.log('Wrong char');
      if(window.navigator.vibrate)
        window.navigator.vibrate(50);

      return false;
    }

    if(sentence.length <= ++this.currentCharPos){
      this._endCurrentSentence();
    }

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