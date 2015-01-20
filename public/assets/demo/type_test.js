'use strict';

(function(exports) {

  var dataset = [
  { "id" : "mobile20",  "s":"are you going to join us for lunch?" },
  { "id" : "mobile89",  "s":"is she done yet?" }
  ];

var TypeTestHandler = function(app) {
  this.app = app;
  this.currentSentenceObj = dataset[0];
  this.currentCharPos = 0;
};

TypeTestHandler.prototype.MANUAL_LOG_ELEMENT_ID = 'type-test-manual-log-btn';
TypeTestHandler.prototype.CURRENT_SENTENCE_ELEMENT_ID = 'type-test-current-sentence';

TypeTestHandler.prototype.start = function() {
  this.currentSentenceSpan = document.getElementById(this.CURRENT_SENTENCE_ELEMENT_ID);

  if(dataset && dataset.length)
    this.currentSentenceSpan.innerHTML = dataset[0].s;
};

TypeTestHandler.prototype.log = function() {
  this.app.postMessage({
    api: 'api',
    method: 'tt_test'
  });
};

TypeTestHandler.prototype.checkInputChar = function(char){
    if(!this.currentSentenceObj || !this.currentSentenceObj.s || !this.currentSentenceObj.s.length)
      return true;

    //check input
    if(this.currentSentenceObj.s[this.currentCharPos] !== char){
      console.log('Wrong char');
      if(window.navigator.vibrate)
        window.navigator.vibrate(50);

      return false;
    }

    //move to next letter if possible
    if(this.currentSentenceObj.s.length <= ++this.currentCharPos){
      console.log('end of sentence');

      if(window.navigator.vibrate)
        window.navigator.vibrate(400);
    }

    this.currentSentenceSpan.innerHTML = 
      '<strong>' + this.currentSentenceObj.s.slice(0,this.currentCharPos) + '</strong>' + 
      this.currentSentenceObj.s.slice(this.currentCharPos, this.currentSentenceObj.s.length);
    return true;
};

exports.TypeTestHandler = TypeTestHandler;

}(window));