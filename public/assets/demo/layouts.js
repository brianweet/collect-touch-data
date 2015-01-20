'use strict';

(function(exports) {

var KeyboardLayouts = function(app) {
  this.app = app;

  /* The default set of layouts to enable is selected based on being able
    to show case the diversity of the feature the keyboard app
    and IMEngine provided. */
  this.enabledLayouts =
    ['en-Custom'];

  this.currentLayout = undefined;

  var layouts = this.layouts = new Map();
  layouts.set('en-Custom', 'English - Custom');
};

KeyboardLayouts.prototype.SETTINGS_MENU_ELEMENT_ID = 'settings-menu';

KeyboardLayouts.prototype.DEFAULT_LAYOUT = 'en-Custom';

KeyboardLayouts.prototype.start = function() {
  var hash = window.location.hash.substr(1);
  if (hash && this.layouts.has(hash)) {
    this.currentLayout = hash;
  } else {
    this.currentLayout = this.DEFAULT_LAYOUT;
  }

  this.settingsMenu = document.getElementById(this.SETTINGS_MENU_ELEMENT_ID);
  if(this.settingsMenu){
    this.settingsMenu.addEventListener('click', this);
  
    this._populateSettingsMenu();
  }
};

KeyboardLayouts.prototype.handleEvent = function(evt) {
  if (!('layoutId' in evt.target.dataset)) {
    return;
  }
  
  var key = evt.target.dataset.layoutId;
  var value = evt.target.checked;

  if (!value) {
    if (this.enabledLayouts.length === 1) {
      evt.target.checked = true;

      return;
    }

    var index = this.enabledLayouts.indexOf(key);
    this.enabledLayouts.splice(index, 1);

    if (this.currentLayout === key) {
      if (this.enabledLayouts.indexOf(this.DEFAULT_LAYOUT) !== -1) {
        this.currentLayout = this.DEFAULT_LAYOUT;
      } else {
        this.currentLayout = this.enabledLayouts[0];
      }

      window.location.hash = '#' + this.currentLayout;
    }
  } else {
    this.enabledLayouts = [key].concat(this.enabledLayouts).sort();
  }

  this.app.postMessage({
    api: 'inputmethodmanager',
    result: (this.enabledLayouts.length > 1)
  });
};

KeyboardLayouts.prototype.updateCurrentLayout = function(id) {
  if (!this.layouts.has(id)) {
    return false;
  }

  this.currentLayout = id;
  return true;
};

KeyboardLayouts.prototype.switchToNext = function() {
  var index = this.enabledLayouts.indexOf(this.currentLayout);
  if (index === -1) {
    index = 0;
  } else {
    index++;
  }

  if (index === this.enabledLayouts.length) {
    index = 0;
  }

  this.currentLayout = this.enabledLayouts[index];

  window.location.hash = '#' + this.currentLayout;
};

KeyboardLayouts.prototype._populateSettingsMenu = function() {
  var template = this.settingsMenu.firstElementChild;
  this.settingsMenu.textContent = '';

  this.layouts.forEach(function(label, key) {
    var entry = template.cloneNode(true);
    var input = entry.querySelector('input[data-layout-id]');
    input.dataset.layoutId = key;
    input.parentNode.appendChild(document.createTextNode(label));

    if (this.enabledLayouts.indexOf(key) !== -1) {
      input.checked = true;
    }

    this.settingsMenu.appendChild(entry);
  }, this);
};

exports.KeyboardLayouts = KeyboardLayouts;

}(window));
