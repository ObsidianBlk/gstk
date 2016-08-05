(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'kit/Emitter',
    ], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
	require('../Emitter')
      );
    }
  } else {
    /* -------------------------------------------------
       Standard Browser style connection.
       ------------------------------------------------- */
    if (typeof(root.GSTK) === 'undefined'){
      throw new Error("Missing GSTK initilization.");
    } else if (typeof(root.GSTK.$) === 'undefined'){
      throw new Error("GSTK improperly initialized.");
    }

    if (root.GSTK.$.exists(root, ["GSTK.Emitter"]) === false){
      throw new Error("Required component not defined.");
    }

    root.GSTK.$.def (root.GSTK, "DOMEventNotifier", factory(
      root.GSTK.Emitter
    ));
  }
})(this, function (Emitter) {

  var DOMEmitter = new Emitter(); // This is an instance... I know you knew that.
  var INITIALIZED = false;
  var WinWidth = 0;
  var WinHeight = 0;
  return {
    ready:function(){return INITIALIZED;},
    initialize:function(d3, window){
      if (INITIALIZED === false){
	WinWidth = window.innerWidth;
	WinHeight = window.innerHeight;

	d3.select(window).on("resize", function(){
	  WinWidth = window.innerWidth;
	  WinHeight = window.innerHeight;
	  DOMEmitter.emit("resize", window.innerWidth, window.innerHeight);
	});

	d3.select("body").on("keydown", function(){
	  DOMEmitter.emit("keydown", d3.event);
	});

	d3.select("body").on("keyup", function(){
	  DOMEmitter.emit("keyup", d3.event);
	});
      }
    },

    getWidth:function(){
      return WinWidth;
    },

    getHeight:function(){
      return WinHeight;
    },

    // These are linking to the global instance. If more than one DOMEventNotifier object is "created" they'll all use the same
    // shared emitter.
    emit: DOMEmitter.emit,
    on: DOMEmitter.on,
    once: DOMEmitter.once,
    listening: DOMEmitter.listening,
    unlisten: DOMEmitter.unlisten,
    unlistenEvent: DOMEmitter.unlistenEvent,
    unlistenAll: DOMEmitter.unlistenAll
  };

});
