'use strict';

(function(exports) {


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
  return;
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

      if(!this.typeTestHandler._starting){
        this.typeTestHandler
          .start({ width:data.args[0],height:data.args[1],keys:data.args[2] }, 
                  { width: window.innerWidth || document.body.clientWidth, 
                    height: window.innerHeight || document.body.clientHeight });
      } else {
        //TODO do something with new size (if it actually changed)
        //this.typeTestHandler.handleNewSize(data.args[2]);
      }

      break;

    case 'touchTrack':
      console.log('KeyboardDemoApp: handle touchTrack event');
      this.typeTestHandler.processLog(data);
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
