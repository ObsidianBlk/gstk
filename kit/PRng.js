
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
    if (typeof(root.GSTK) === 'undefined'){
      throw new Error("Missing GSTK initilization.");
    } else if (typeof(root.GSTK.$) === 'undefined'){
      throw new Error("GSTK improperly initialized.");
    }

    root.GSTK.$.def (root.GSTK, "PRng", factory());
  }
})(this, function () {

  // -------------------------------------------------------------------
  // Small set of utility functions.

  function GetSeedString(seed){
    if (typeof(seed) === 'undefined' || seed === null){
      seed = (Math.random() + Date.now()).toString();
    } else if (Object.prototype.toString.call(seed) !== "[object String]"){
      seed = JSON.stringify(seed);
    }
    return seed;
  }


  function Swap(state){
    var tmp = state.s[state.i];
    state.s[state.i] = state.s[state.j];
    state.s[state.j] = tmp;
  }

  function NextByte(state){
    state.i = (state.i + 1)%256;
    state.j = (state.j + state.s[state.i]) % 256;
    Swap(state);
    return state.s[(state.s[state.i] + state.s[state.j]) % 256];
  }


  function GetStringBytes(str){
    var output = [];
    for (var i=0; i < str.length; i++){
      var bytes = [];
      var c = str.charCodeAt(i);
      while(c > 0){
        bytes.push(c & 0xFF);
        c = c >> 8;
      }
      output = output.concat(bytes.reverse());
    }
    return output;
  }

  function MixSeed(state){
    var bytes = GetStringBytes(state.seed);
    for (var i=0; i < state.s.length; i++){
      state.j += state.s[i] + bytes[i % bytes.length];
      state.j %= 256;
      Swap(state);
    }
  }

  function InitState(state){
    for (var i=0; i < 256; i++){
      state.s[i] = i;
    }
    state.i = 0;
    state.j = 0;
    MixSeed(state);
  }


  // -------------------------------------------------------------------


  function PRng(){
    var prng_state = {
      seed: "",
      s: new Array(256),
      i: 0,
      j: 0
    };

    Object.defineProperties(this, {
      "state":{
	get:function(){return JSON.parse(JSON.stringify(prng_state));},
	set:function(state){
	  if (state instanceof PRng){
	    prng_state = state.state;
	    return;
	  } else if (typeof(state) === typeof({})){
	    if (typeof(state.seed) === 'string' && typeof(state.i) === 'number' && typeof(state.j) === 'number'){
	      if (typeof(state.s) !== 'undefined' && state.s instanceof Array){
		if (state.s.length === 256){
		  prng_state.seed = state.seed;
		  prng_state.i = state.i;
		  prng_state.j = state.j;
		  prng_state.s.forEach(function(val, index){
		    prng_state.s[index] = state.s[index];
		  });
		  return;
		}
	      }
	    }
	  }
	  throw new TypeError("Invalid state object");
	}
      }
    });

    this.seed = function(value){
      if (typeof(value) !== 'undefined' || prng_state.seed === ""){
	prng_state.seed = GetSeedString(value);
	InitState(prng_state);
      }
      return prng_state.seed;
    };

    /**
     * Returns a random number between 0 and 1
     */
    this.uniform = function(){
      var BYTES = 7; // 56 bits to make a 53-bit double
      var output = 0;
      for (var i=0; i < BYTES; i++){
	output = (output*256)+NextByte(prng_state);
      }
      return output / (Math.pow(2, BYTES * 8) - 1);
    };

    /*
     * Returns a random value between a given min and max. If no min and max is given, this method acts just like uniform() 
     */
    this.value = function(min, max){
      min = min || 0;
      max = max || 1;
      var u = this.uniform();
      return min + ((max - min)*this.uniform());
    };

    /*
     * Returns an array of <count> random values between a given min and max. 
     */
    this.range = function(count, min, max){
      min = min || 0;
      max = max || 1;

      var rng = [];
      for (var i=0; i < count; i++){
	rng.push(this.value(min, max));
      }
      return rng;
    };

    /*
     * Similar to the range method, but acts as if a <count> number of <sides>-sided dice were rolled.
     */
    this.rollDice = function(sides, count){
      var roll = this.range(count, 1, sides);
      var res = 0;
      for (var i=0; i < count; i++){
	res += Math.round(roll[i]); // range returns float values. Let's turn these to integers.
      }
      return res;
    };

    this.generateUUID = function(){
      // This method's operations are from StackOverflow response by...
      // broofa ... ( http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript )
      var uniform = (function(prng){
	return function(){return prng.uniform();};
      })(this);

      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	var r = Math.floor(uniform()*16)|0, v = (c == 'x') ? r : (r&0x3|0x8);
	return v.toString(16);
      });
    };

    /**
     * Runs <count> number of random generations. Nothing is returned.
     */
    this.fastforward = function(count){
      for (var i=0; i < count; i++){
	this.uniform();
      }
    };

    /*
     * Returns a new PRng instance pre-seeded using a UUID string generated by the calling PRng instance.
     */
    this.spawn = function(){
      var prng = new PRng();
      prng.seed(this.generateUUID());
      return prng;
    };

    // -------------------------------------
    // Initialization!
    this.seed();
  }
  PRng.prototype.constructor = PRng;

  return PRng;

});




