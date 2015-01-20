'use strict';

(function(exports) {

  var trackedTouches, startTime;

  var TouchTrack = function(app) {
    this._started = false;
    this._isTracking = false;
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

    this._container = this.app.getContainer();

    this._container.addEventListener('touchstart', this);
    this._container.addEventListener('touchmove', this);
    this._container.addEventListener('touchend', this);
    this._container.addEventListener('touchcancel', this);
    this._container.addEventListener('mousedown', this);
    this._container.addEventListener('mouseup', this);

    window.addEventListener('message', this);

    this._started = this._isTracking = true;
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
    this._container.removeEventListener('mousedown', this);
    this._container.removeEventListener('mouseup', this);

    window.removeEventListener('message', this);
  }

  TouchTrack.prototype.handleEvent = function(evt) {
    switch (evt.type) {
      case 'message':
        var data = evt.data;
        if (!data || !data.api || data.api !== 'touchTrack')
          break;

        switch(data.method){
          case 'startTracking':
            this._isTracking = true;
            break;
          case 'stopTracking':
            this._isTracking = false;
            break;
          case 'getLogAndStop':
            this._isTracking = false;
            evt.source.postMessage({
              api: data.api,
              logData: trackedTouches
            }, evt.origin);
            break;
        }
        
//        if (data && data.api && data.api === 'api' && data.method === 'tt_test') {
//          //TODO: post touches to api?
//
//          //for now write to console
//          console.log(['TouchTrack: writing log to console']);
//          if(trackedTouches.length)
//            for(var i = 0; i < trackedTouches.length; i++)
//              console.log(trackedTouches[i]);
//          console.log(['TouchTrack: wrote log to console']);
//          this.clear();
//        }
        break;
      case 'touchstart':
      case 'touchmove':
      case 'touchend':
      case 'touchcancel':
      case 'mousedown':
      case 'mouseup':
        if(!this._isTracking)
          return;

        var eventTime = Date.now();
        if(trackedTouches.length === 0){
          startTime = eventTime;
        }
        var time = eventTime - startTime;



        if(evt instanceof MouseEvent){
          this.add(evt, time);
        }else{
          for (var i = 0; i < evt.changedTouches.length; i++) {
          this.add(evt.changedTouches[i], time);
          }
        }
        break;
    }
  };

  TouchTrack.prototype.add = function(evt, time) {
    var log = evt.type
            //TODO: check if we actually need to get the value
            + ';' + Object.getPrototypeOf(this.app.layoutRenderingManager.getTargetObject(evt.target)).value
            + ';' + evt.screenX
            + ';' + evt.screenY 
            + ';' + time
            //TODO: remove code related to the offset
            + ';' + evt.target.offsetHeight 
            + ';' + evt.target.offsetWidth 
            + ';' + evt.target.offsetTop
            + ';' + evt.target.offsetLeft
            + ';' + evt.target.offsetParent.offsetHeight 
            + ';' + evt.target.offsetParent.offsetWidth 
            + ';' + evt.target.offsetParent.offsetTop
            + ';' + evt.target.offsetParent.offsetLeft;
          trackedTouches.push(log);
  };

  exports.TouchTrack = TouchTrack;
})(window);