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

    return true;
};

var KeyboardDemoApp = function() {
  this.container = null;
};

KeyboardDemoApp.prototype.INPUTAREA_ELEMENT_ID = 'inputarea';
KeyboardDemoApp.prototype.GAIA_APP_DIR = './gaia/apps/keyboard';
KeyboardDemoApp.prototype.CONTAINER_ID = 'keyboard-app-container';

KeyboardDemoApp.prototype.start = function() {
  this.container = document.getElementById(this.CONTAINER_ID);

  this.settingsHandler = new SettingsHandler(this);
  this.settingsHandler.start();

  this.inputMethodHandler = new InputMethodHandler(this);
  this.inputMethodHandler.start();

  this.typeTestHandler = new TypeTestHandler(this);
  this.typeTestHandler.start();

  this.layouts = new KeyboardLayouts(this);
  this.layouts.start();

  window.addEventListener('message', this);
  window.addEventListener('hashchange', this);

  this.inputarea = document.getElementById(this.INPUTAREA_ELEMENT_ID);
  this.inputarea.addEventListener('mousedown', this);

  var hash = this.layouts.currentLayout;
  this.container.src =
    'app.html#' + this.GAIA_APP_DIR + '/index.html#' + hash;

  this.focused = true;
};

KeyboardDemoApp.prototype.getFocus = function() {
  if (this.focused) {
    return;
  }

  var info = this.inputMethodHandler.getSelectionInfo();

  this.postMessage({
    api: 'inputmethod',
    method: 'setInputContext',
    ctx: true,
    selectionStart: info.selectionStart,
    selectionEnd: info.selectionEnd,
    textBeforeCursor: info.textBeforeCursor,
    textAfterCursor: info.textAfterCursor
  });
  this.focused = true;
  this.inputarea.classList.add('focused');

  // We rely on app to tell us when it will be ready to be visible.
  // this.container.classList.remove('transitioned-out');
};

KeyboardDemoApp.prototype.removeFocus = function() {
  if (!this.focused) {
    return;
  }

  this.postMessage({
    api: 'inputmethod',
    method: 'setInputContext',
    ctx: false
  });
  this.focused = false;
  window.requestAnimationFrame(function() {
    document.body.style.paddingBottom = '';
    this.container.classList.add('transitioned-out');
    this.inputarea.classList.remove('focused');
  }.bind(this));
};

KeyboardDemoApp.prototype.postMessage = function(data) {
  this.container.contentWindow.postMessage(data, '*');
};

KeyboardDemoApp.prototype.handleEvent = function(evt) {
  switch (evt.type) {
    case 'hashchange':
      var hash = window.location.hash.substr(1);
      var changed = this.layouts.updateCurrentLayout(hash);
      if (!changed) {
        break;
      }

      this.postMessage({
        api: 'api',
        method: 'updateHash',
        result: hash
      });

      break;

    case 'message':
      this.handleMessage(evt.data);

      break;

    case 'mousedown':
      this.getFocus();

      break;
  }
};

KeyboardDemoApp.prototype.handleMessage = function(data) {
  switch (data.api) {
    case 'settings':
      this.settingsHandler.handleMessage(data);

      break;

    case 'inputmethod':
    case 'inputcontext':
    case 'inputmethodmanager':
      this.inputMethodHandler.handleMessage(data);

      break;

    case 'resizeTo':
      if (!this.focused) {
        return;
      }
      window.requestAnimationFrame(function() {
        document.body.style.paddingBottom = data.args[1] + 'px';
        this.container.classList.remove('transitioned-out');

        this.inputMethodHandler.composition.scrollIntoView();
      }.bind(this));

      break;

    default:
      throw new Error('KeyboardDemoApp: Unknown message.');

      break;
  }
};

KeyboardDemoApp.prototype.getContainer = function() {
  return this.container;
}

exports.KeyboardDemoApp = KeyboardDemoApp;

}(window));
