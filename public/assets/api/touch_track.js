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

    this.getTrackedTouches = function(){
      return trackedTouches.slice();
    }
  };

  TouchTrack.prototype.start = function(){
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
    this._container.addEventListener('touchcancel', this);
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
    this._container.removeEventListener('touchcancel', this);

    window.removeEventListener('message', this);
  }

  TouchTrack.prototype.handleEvent = function(evt) {
    switch (evt.type) {
      case 'touchstart':
      case 'touchmove':
      case 'touchend':
      case 'touchcancel':
        var eventTime = Date.now();
        if(trackedTouches.length === 0){
          startTime = eventTime;
        }
        var time = eventTime - startTime;
    
        for (var i = 0; i < evt.changedTouches.length; i++) {
          var log = evt.type
            //TODO: check if we actually need to get the value
            + ';' + Object.getPrototypeOf(this.app.layoutRenderingManager.getTargetObject(evt.changedTouches[i].target)).value
            + ';' + evt.changedTouches[i].screenX
            + ';' + evt.changedTouches[i].screenY 
            + ';' + time
            //TODO: remove code related to the offset
            + ';' + evt.changedTouches[i].target.offsetHeight 
            + ';' + evt.changedTouches[i].target.offsetWidth 
            + ';' + evt.changedTouches[i].target.offsetTop
            + ';' + evt.changedTouches[i].target.offsetLeft
            + ';' + evt.changedTouches[i].target.offsetParent.offsetHeight 
            + ';' + evt.changedTouches[i].target.offsetParent.offsetWidth 
            + ';' + evt.changedTouches[i].target.offsetParent.offsetTop
            + ';' + evt.changedTouches[i].target.offsetParent.offsetLeft;
          console.info(log);
          trackedTouches.push(log);
        }
        //trackedTouches.push({"t" : time,"e" : evt});
    }

    
  };

  exports.TouchTrack = TouchTrack;
})(window);