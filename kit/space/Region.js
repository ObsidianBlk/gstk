
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'kit/PRng',
      'kit/space/StellarBody', 
      'kit/space/Star',
      'node_modules/tv4/tv4'
    ], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
	require('../PRng'),
	require('./StellarBody'),
	require('./Star'),
	require('tv4')
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

    if (root.GSTK.$.exists(root, ["GSTK.PRng",
				  "GSTK.space.StellarBody",
				  "GSTK.space.Star",
				  "tv4"
				 ]) === false){
      throw new Error("Required component not defined.");
    }

    root.GSTK.$.def (root.GSTK, "space.Region", factory(
      root.GSTK.PRng,
      root.GSTK.space.StellarBody,
      root.GSTK.space.Star,
      root.tv4
    ));
  }
})(this, function (PRng, StellarBody, Star, tv4) {

  var MAX_GEN_RECURSION = 10;

  var RegionSchema = {
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "object",
    "properties": {
      "radius": {"type": "number"},
      "zmin": {"type": "integer"},
      "zmax": {"type": "integer"},
      "systems": {
	"type": "array",
	"items": {
          "type": "object",
          "properties": {
            "r": {"type": "number"},
            "a": {"type": "number"},
            "z": {"type": "number"},
            "star": {"type": "string"}
          },
          "required": [
            "r",
            "a",
            "z",
            "star"
          ]
	}
      }
    },
    "required": [
      "radius",
      "zmin",
      "zmax",
      "systems"
    ]
  };

  function GenerateStar(rng, seed, companionProbability, supportGardenWorlds, forceBreathable, depth){
    if (typeof(depth) !== 'number'){
      depth = 0;
    }
    if (depth >= MAX_GEN_RECURSION){return null;}

    supportGardenWorlds = (supportGardenWorlds === true) ? true : false;
    forceBreathable = (forceBreathable === true) ? true : false;

    var cp = companionProbability * 0.01;
    var s = new Star({
      seed: seed,
      supportGardenWorlds: supportGardenWorlds
    });

    if (rng.uniform() <= cp){
      s.generateCompanion();
      if (rng.uniform() <= cp){
	s.generateCompanion();
      }
    }
    s.generateStellarBodies();
    
    if (forceBreathable === true && s.containsBreathableBody() === false){
      return GenerateStar(rng, companionProbability, forceBreathable, depth + 1);
    }
    return s;
  }

  function DistanceBetween(r1, a1, r2, a2){
    var x1 = r1*Math.cos(a1);
    var y1 = r1*Math.sin(a1);

    var x2 = r2*Math.cos(a2);
    var y2 = r2*Math.sin(a2);

    return Math.sqrt((x1-x2) + (y1-y2));
  }


  function Region(options){
    options = (typeof(options) === typeof({})) ? JSON.parse(JSON.stringify(options)) : {};
    if (typeof(options.seed) === 'undefined'){
      options.seed = Math.random().toString();
    }
    
    var radius = (typeof(options.radius) === 'number') ? options.radius : 10;
    var zmin = (typeof(options.zmin) === 'number') ? Math.floor(options.zmin) : -1;
    var zmax = (typeof(options.zmax) === 'number') ? Math.floor(options.zmax) : zmin + 2;

    var rng = new PRng({seed:options.seed, initDepth:5000});
    var systems = [];
    var height = 0;
    var horizon = 0;

    if (radius <= 0){
      throw new RangeError("Radius too small");
    }

    if (typeof(options.jsonString) === 'string'){
      var data = null;
      try{
	data = JSON.parse(options.jsonString);
      } catch (e) {
	throw e;
      }

      if (tv4.validate(data, RegionSchema) === false){
	throw new Error(tv4.error);
      }

      radius = data.radius;
      zmin = Math.floor(data.zmin);
      zmax = Math.floor(data.zmax);
      
      for (var i=0; i < data.systems.length; i++){
	try{
	  systems.push(new Star({jsonString: data.systems[i].star}));
	} catch (e) {
	  throw e;
	}
      }
    }
    
    if (systems.length <= 0){
      height = (zmax - zmin >= 1) ? zmax - zmin : 1;
      horizon = (height > 1) ? Math.floor(height*0.5) : zmin;

      options.autoGenerate = (options.autoGenerate === true) ? true : false;
      options.systemAtOrigin = (options.systemAtOrigin === true) ? true : false;
      options.breathableAtOrigin = (options.breathableAtOrigin === true) ? true : false;
      options.systemDensity = (typeof(options.systemDensity) === 'number') ?
	Math.abs(options.systemDensity)%100 :
	(rng.rollDice(6, 2)-2)*4;
      if (options.systemDensity < 1){
	options.systemDensity = 6; // We want SOME stars
      }
      options.breathableDensity = (typeof(options.breathableDensity) === 'number') ?
	Math.abs(options.breathableDensity)%100 :
	(rng.rollDice(6, 2)-2)*4;
      if (options.breathableDensity < 1){
	options.breathableDensity = 0; // We don't NEED breathable planets.
      }
      options.companionProbability = (typeof(options.companionProbability) === 'number') ?
	Math.abs(options.companionProbability)%100 :
	rng.rollDice(6, 2)*5;
      if (options.companionProbability < 1){
	options.companionProbability = 10;
      }

      if (options.autoGenerate === true){
	this.generate();
      }
    }

    Object.defineProperties(this, {
      "systems":{
	enumerate: true,
	get:function(){
	  var sys = [];
	  for (var i=0; i < systems.length; i++){
	    sys.push(WrapSysInformation(systems[i]));
	  }
	  return sys;
	}
      },

      "radius":{
	enumerate:true,
	get:function(){return radius;}
      },

      "systemCount":{
	enumerate: true,
	get:function(){return systems.length;}
      },

      "emptySystemCount":{
        enumerate: true,
        get:function(){
          var count = 0;
          for (var i=0; i < systems.length; i++){
            if (systems[i].star.stellarBodyCount <= 0){
              count += 1;
            }
          }
          return count;
        }
      },

      "emptySystems":{
        enumerate: true,
        get:function(){
          var sys = [];
          for (var i=0; i < systems.length; i++){
            if (systems[i].star.stellarBodyCount <= 0){
              sys.push(WrapSysInformation(systems[i]));
            }
          }
          return sys;
        }
      },

      "nonEmptySystemCount":{
        enumerate: true,
        get:function(){
          var count = 0;
          for (var i=0; i < systems.length; i++){
            if (systems[i].star.stellarBodyCount > 0){
              count += 1;
            }
          }
          return count;
        }
      },

      "nonEmptySystems":{
        enumerate: true,
        get:function(){
          var sys = [];
          for (var i=0; i < systems.length; i++){
            if (systems[i].star.stellarBodyCount > 0){
              sys.push(WrapSysInformation(systems[i]));
            }
          }
          return sys;
        }
      },

      "terrestrialSystemCount":{
        enumerate: true,
        get:function(){
          var count = 0;
          for (var i=0; i < systems.length; i++){
            if (systems[i].star.terrestrialCount > 0){
              count += 1;
            }
          }
          return count;
        }
      },

      "terrestrialSystems":{
        enumerate: true,
        get:function(){
          var sys = [];
          for (var i=0; i < systems.length; i++){
            if (systems[i].star.terrestrialCount > 0){
              sys.push(WrapSysInformation(systems[i]));
            }
          }
          return sys;
        }
      },

      "habitableSystemCount":{
        enumerate: true,
        get:function(){
          var count = 0;
          for (var i=0; i < systems.length; i++){
            if (systems[i].star.hasBreathable === true){
              count += 1;
            }
          }
          return count;
        }
      },

      "habitableSystems":{
        enumerate: true,
        get:function(){
          var sys = [];
          for (var i=0; i < systems.length; i++){
            if (systems[i].star.hasBreathable === true){
              sys.push(WrapSysInformation(systems[i]));
            }
          }
          return sys;
        }
      }
    });

    function WrapSysInformation(sys){
      var wrap = {};
      Object.defineProperties(wrap, {
	"r":{
	  enumerate:true,
	  get:function(){return sys.r;},
	  set:function(r){
	    if (typeof(r) !== 'number'){throw new TypeError("Expecting Number Type.");}
	    if (r < 0){throw new RangeError("Value expected to be positive.");}
	    sys.r = r;
	  }
	},
	"a":{
	  enumerate:true,
	  get:function(){return sys.a;},
	  set:function(a){
	    if (typeof(a) !== 'number'){throw new TypeError("Expecting Number Type.");}
	    if (a < 0){throw new RangeError("Value expected to be positive.");}
	    sys.a = a;
	  }
	},
	"z":{
	  enumerate:true,
	  get:function(){return sys.z;},
	  set:function(z){
	    if (typeof(z) !== 'number'){throw new TypeError("Expecting Number Type.");}
	    if (z < 0){throw new RangeError("Value expected to be positive.");}
	    sys.z = z;
	  }
	}
      });
      wrap.star = sys.star;
      return wrap;
    };

    this.toString = function(){
      var reg = {
	radius: radius,
	zmin: zmin,
	zmax: zmax,
	systems:[]
      };
      for (var i=0; i < systems.length; i++){
	reg.systems.push({
	  r: systems[i].r,
	  a: systems[i].a,
	  z: systems[i].z,
	  star: systems[i].star.toString()
	});
      }

      return JSON.stringify(reg);
    };

    this.addStar = function(ops){
      ops = (typeof(ops) === typeof({})) ? JSON.parse(JSON.stringify(ops)) : {};
      if (!(ops.star instanceof Star)){
        if (typeof(ops.seed) !== 'string'){
          ops.seed = rng.generateUUID();
        }
        if (typeof(ops.companionProbability) !== 'number'){
          ops.companionProbability = options.companionProbability;
        }
      }
      if (typeof(ops.r) !== 'number'){
        ops.r = rng.value(0, radius);
      } else if (ops.r < 0 || ops.r > radius){
        throw new RangeError("Given radius is out of bounds.");
      }

      if (typeof(ops.a) !== 'number'){
        ops.a = rng.value(0, 2*Math.PI);
      } else {
        ops.a = Math.abs(ops.a%(2*Math.PI));
      }

      if (typeof(ops.z) !== 'number'){
        ops.z = Math.floor(horizon+rng.value(-(height*0.5), (height*0.5)));
      } else {
        if (ops.z < (horizon-(height*0.5)) || ops.z > (horizon+(height*0.5))){
          throw new RangeError("Given Z depth is out of bounds.");
        }
      }

      var store = true;
      for (var _i=0; _i < systems.length; _i++){
	if (DistanceBetween(ops.r, ops.a, systems[_i].r, systems[_i].a) < 1.0){
	  store = false;
	}
      }

      if (store){
        systems.push({
          r: ops.r,
	  a: ops.a,
	  z: ops.z,
	  star: (ops.star instanceof Star) ?
            ops.star :
            GenerateStar(
	    rng,
            ops.seed,
	    ops.companionProbability,
	    false,
	    false
	  )
        });
      }
    };

    this.generate = function(){
      if (systems.length > 0){return;} // Only generate the region once.

      systems = [];
      //sys.z = Math.floor(horizon+rng.value(-(height*0.5), (height*0.5)));

      var volume = Math.PI*(radius*radius);
      var sysCount = volume*(options.systemDensity*0.01);

      var D2R = Math.PI/180;
      var satisfiedOrigin = (options.systemAtOrigin === false);
      for (var i=0; i < sysCount; i++){
	if (satisfiedOrigin === false){
	  satisfiedOrigin = true;
          this.addStar({
            r: 0,
            a: 0
          });
	  //continue;
	} else {
          this.addStar();
        }

	/*var r = rng.value(0, radius);
	var a = rng.value(0, 2*Math.PI);
	var store = true;
	for (var _i=0; _i < systems.length; _i++){
	  if (DistanceBetween(r, a, systems[_i].r, systems[_i].a) < 1.0){
	    store = false;
	  }
	}

	if (store){
	  systems.push({
	    r: r,
	    a: a,
	    z: Math.floor(horizon+rng.value(-(height*0.5), (height*0.5))),
	    star: GenerateStar(
	      rng,
	      options.companionProbability,
	      false,
	      false
	    )
	  });
	}*/ // NOTE: I could shift the i variable back one, but, assuming low density systems, this shouldn't drop too many stars.
      } 
    };

    this.getStar = function(index){
      if (index < 0 || index >= systems.length){
	throw new RangeError("Index out of bounds.");
      }
      return WrapSysInformation(systems[index]);
    };

    this.getStarByName = function(name){
      for (var index=0; index < systems.length; index++){
	if (systems[index].star.name === name){
	  return WrapSysInformation(systems[index]);
	}
      }
      return null;
    };
  }
  Region.prototype.constructor = Region;

  return Region;
});
