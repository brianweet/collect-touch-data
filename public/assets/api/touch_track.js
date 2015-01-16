'use strict';

(function(exports) {

  var trackedTouches, startTime;

  var TouchTrack = function(app) {
    this._started = false;
    this.app = app;
    trackedTouches = new Array;
    
    this.clear = function(){
      trackedTouches.length = 0;
    }
  };

  TouchTrack.prototype.start = function(){
    debugger;
    console.log('TouchTrack.start()');
    if (this._started) {
      throw new Error('TouchTrack: ' +
        'Instance should not be start()\'ed twice.');
    }
    this._started = true;

    this._container = this.app.getContainer();

    this._container.addEventListener('touchstart', this);
    this._container.addEventListener('touchmove', this);
    this._container.addEventListener('touchend', this);

    window.addEventListener('message', this);
  }

  TouchTrack.prototype.stop = function(){
    console.log('TouchTrack.stop()');
    if (!this._started) {
      throw new Error('TouchTrack: ' +
        'Instance was never start()\'ed but stop() is called.');
    }
    this._started = false;

    this._container.removeEventListener('touchstart', this);
    this._container.removeEventListener('touchmove', this);
    this._container.removeEventListener('touchend', this);

    window.removeEventListener('message', this);
  }

  TouchTrack.prototype.handleEvent = function(evt) {
      for (var i = 0; i < evt.changedTouches.length; i++) {
        console.info(
          'TouchEvent:' + evt.type
          + ' ' + Object.getPrototypeOf(this.app.layoutRenderingManager.getTargetObject(evt.changedTouches[i].target)).value
          + ' ' + evt.changedTouches[i].screenX
          + ' ' + evt.changedTouches[i].screenY 
          + ' ' + evt.changedTouches[i].target.offsetHeight 
          + ' ' + evt.changedTouches[i].target.offsetWidth 
          + ' ' + evt.changedTouches[i].target.offsetTop
          + ' ' + evt.changedTouches[i].target.offsetLeft
          + ' ' + evt.changedTouches[i].target.offsetParent.offsetHeight 
          + ' ' + evt.changedTouches[i].target.offsetParent.offsetWidth 
          + ' ' + evt.changedTouches[i].target.offsetParent.offsetTop
          + ' ' + evt.changedTouches[i].target.offsetParent.offsetLeft);
      }
      var eventTime = Date.now();
      if(trackedTouches.length === 0){
        startTime = eventTime;
      }
      var time = eventTime - startTime;
      trackedTouches.push({time, evt});
  };

  exports.TouchTrack = TouchTrack;
})(window);