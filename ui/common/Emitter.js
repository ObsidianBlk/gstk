
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define(factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory();
    }
  } else {
    /* -------------------------------------------------
       Standard Browser style connection.
       ------------------------------------------------- */
    root.$sys.def (root, "ui.common.Emitter", factory());
  }
})(this, function () {

  var DEFAULT_PRIORITY = 100;

  function Emitter(){
    var event = {};

    this.listening = function(eventName, callback){
      var e = (typeof(event[eventName]) !== 'undefined') ? event[eventName] : null;
      if (e !== null){
	for (var i=0; i < e.length; i++){
	  if (e[i].callback === callback){
	    return true;
	  }
	}
      }
      return false;
    };

    this.on = function(eventName, callback, priority, once){
      once = (typeof(once) === 'boolean') ? once : false;
      priority = (typeof(priority) === 'number') ? Math.floor(priority) : DEFAULT_PRIORITY;

      if (this.listening(eventName, callback) === false){
	var e = (typeof(event[eventName]) !== 'undefined') ? event[eventName] : null;
	if (e === null){
	  event[eventName] = [];
	  e = event[eventName];
	}

	e.push({
	  callback: callback,
	  priority: priority,
	  once: once
	});

	e.sort(function(a, b){
	  return (a.priority < b.priority) ? -1 : (a.priority > b.priority) ? 1 : 0;
	});
      }
    };

    this.once = function(eventName, callback, priority){
      this.on(eventName, callback, (typeof(priority) === 'number') ? Math.floor(priority) : DEFAULT_PRIORITY, true);
    };

    this.unlisten = function(eventName, callback){
      if (typeof(event[eventName]) !== 'undefined'){
	var e = event[eventName];
	for (var i=0; i < e.length; i++){
	  if (e[i].callback === callback){
	    e.splice(i, 1);
	    break;
	  }
	}
      }
    };

    this.unlistenEvent = function(eventName){
      if (eventName in event){
	delete event[eventName];
      }
    };

    this.unlistenAll = function(){
      event = {};
    };

    this.emit = function(eventName){
      if (typeof(event[eventName]) !== 'undefined'){
	var e = event[eventName];
	for (var i=0; i < e.length; i++){
	  var cb = e[i].callback;
	  cb.apply(cb, [].slice.call(arguments,1));
	}
	
	// Remove the one-off listeners.
	e = e.filter(function(item){
	  return item.once === false;
	});
      }
    };


  };
  Emitter.prototype.constructor = Emitter;

  Object.defineProperties(Emitter, {
    "defaultPriority":{
      get:function(){return DEFAULT_PRIORITY;},
      set:function(priority){
	if (typeof(priority) !== 'number'){
	  throw new TypeError();
	}
	DEFAULT_PRIORITY = Math.floor(priority);
      }
    }
  });

  // Exporting object!
  return Emitter;
});
