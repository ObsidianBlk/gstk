(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'kit/PRng',
      'node_modules/tv4/tv4',
      'kit/space/StellarBody'
    ], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
	require('../PRng'),
	require('tv4'),
	require('StellarBody')
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

    if (root.GSTK.$.exists(root, [
      "GSTK.PRng",
      "tv4",
      "GSTK.space.StellarBody"
    ]) === false){
      throw new Error("Required component not defined.");
    }

    root.GSTK.$.def (root.GSTK, "space.AsteroidBelt", factory(
      root.GSTK.PRng,
      root.tv4,
      root.GSTK.space.StellarBody
    ));
  }
})(this, function (PRng, tv4, StellarBody) {
  
  var AsteroidSchema = {
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "object",
    "properties": {
      "blackbody": {"type": "number"},
      "name": {"type": "string"},
      "resourceIndex": {"type": "integer"},
      "size": {"type": "integer"},
      "temperature": {"type": "integer"},
      "_type": {"type": "integer"}
    },
    "required": [
      "blackbody",
      "name",
      "resourceIndex",
      "size",
      "temperature",
      "type"
    ]
  };

  function CalculateResources(rng){
    switch(rng.rollDice(6, 3)){
    case 4:
      return 1;
    case 5:
      return 2;
    case 6: case 7:
      return 3;
    case 8: case 9:
      return 4;
    case 10: case 11:
      return 5;
    case 12: case 13:
      return 6;
    case 14: case 15:
      return 7;
    case 16:
      return 8;
    case 17:
      return 9;
    case 18:
      return 10;
    }

    return 0;
  }


  function Generate(data, rng, options){
    // Calculating temperature
    if (typeof(options.parent) !== 'undefined' && typeof(options.parent.luminosity) === 'number' && typeof(options.orbitalRadius) === 'number'){
      var l = options.parent.luminosity;
      var r = options.orbitalRadius;
      data.blackbody = 278*(Math.pow(l, 0.25)/Math.sqrt(r));
      data.temperature = data.blackbody*0.97;
    } else {
      var tempsteprange = Math.floor((500 - 140)/24);
      data.temperature = 140 + (Math.floor(rng.uniform()*tempsteprange) * 24);
      data.blackbody = data.temperature/0.97;
    }

    data.resourceIndex = CalculateResources(rng);
    data.size = 0;
    if (data.resourceIndex > 2){
      data.size = 1;
      if (data.resourceIndex > 5){
        data.size = 2;
      }
    }
  }




  function AsteroidBelt(options){
    StellarBody.call(this);
    this.schema = AsteroidSchema;
    this.data._type = AsteroidBelt.Type;
    options = (typeof(options) === typeof({})) ? options : {};

    var parent = (options.parent instanceof StellarBody) ? options.parent : null;

    var rng = new PRng({
      seed:(typeof(options.seed) !== 'undefined') ? 
	options.seed : 
	Math.random().toString(), 
      initDepth:5000});


    Object.defineProperties(this, {
      "parent":{
	enumerate: true,
	get:function(){return parent;},
	set:function(p){
	  if (parent === null && p instanceof StellarBody){
	    parent = p;
	  } else if (parent !== null && p === null){
	    parent = null;
	  } else if (p !== null && !(p instanceof StellarBody)){
	    throw new TypeError("Can only parent to a StellarBody instance object.");
	  } else if (parent !== null && parent !== p){
	    throw new Error("Cannot parent to an already parented object. Unparent first.");
	  }
	}
      },

      "sizeIndex":{
	enumerate:true,
	get:function(){return this.data.size;}
      },

      "size":{
	enumerate:true,
	get:function(){
	  switch(this.data.size){
	  case 0:
	    return "Thin";
	  case 1:
	    return "Standard";
	  case 2:
	    return "Dense";
	  }
	  return "UNKNOWN";
	}
      },

      "blackbody":{
        enumerate:true,
        get:function(){return this.data.blackbody;}
      },

      "resources":{
        enumerate: true,
        get:function(){
          return StellarBody.Table.ResourceValueTable[this.data.resourceIndex].desc;
        }
      },

      "resourceModifier":{
        enumerate: true,
        get:function(){
          return StellarBody.Table.ResourceValueTable[this.data.resourceIndex].mod;
        }
      },

      "temperature":{
        enumerate: true,
        get:function(){return this.data.temperature;}
      }
    });


    if (typeof(options.from) === 'string' || typeof(options.from) === typeof({})){
      this.from(options.from);
    } else {
      Generate(this.data, rng, options);
      this.name = (typeof(options.name) === 'string') ? options.name : rng.generateUUID();
    }
  }
  AsteroidBelt.prototype.__proto__ = StellarBody.prototype;
  AsteroidBelt.prototype.constructor = AsteroidBelt;
  AsteroidBelt.Type = 3;

  StellarBody.RegisterType(AsteroidBelt);
  return AsteroidBelt;
});
