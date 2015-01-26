'use strict';

// enable vibration support
navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;

var demo = new KeyboardDemoApp();
demo.start();
