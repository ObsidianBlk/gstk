
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'kit/common/PRng',
      'kit/space/StellarBody', 
      'kit/space/Star',
      'kit/space/GasGiant',
      'kit/space/Terrestrial',
      'kit/space/AsteroidBelt',
      'node_modules/tv4/tv4'
    ], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
	require('../common/PRng'),
	require('./StellarBody'),
	require('./Star'),
	require('./GasGiant'),
	require('./Terrestrial'),
	require('./AsteroidBelt'),
	require('tv4')
      );
    }
  } else {
    /* -------------------------------------------------
       Standard Browser style connection.
       ------------------------------------------------- */
    if (typeof(root.$sys) === 'undefined'){
      throw new Error("Missing $sys initilization.");
    }

    if (root.$sys.exists(root, [
      "tv4",
      "GSTK.common.PRng",
      "GSTK.space.StellarBody",
      "GSTK.space.Star",
      "GSTK.space.GasGiant",
      "GSTK.space.Terrestrial",
      "GSTK.space.AsteroidBelt"
    ]) === false){
      throw new Error("Required component not defined.");
    }

    root.$sys.def (root, "GSTK.space.StellarBody", factory(
      root.GSTK.common.PRng,
      root.GSTK.space.StellarBody,
      root.GSTK.space.Star,
      root.GSTK.space.GasGiant,
      root.GSTK.space.Terrestrial,
      root.GSTK.space.AsteroidBelt,
      root.tv4
    ));
  }
})(this, function (PRng, StellarBody, Star, GasGiant, Terrestrial, AsteroidBelt, tv4) {

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
            "star": {"type": "object"}
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

  function DistanceBetween(r1, a1, r2, a2){
    var res = ((r1*r1)+(r2*r2)) - (2*r1*r2*Math.cos(a1 - a2));
    return Math.sqrt(res);
  }


  function Region(options){
    options = (typeof(options) === typeof({})) ? options : {};
    if (typeof(options.seed) === 'undefined'){
      options.seed = Math.random().toString();
    }
    
    var radius = (typeof(options.radius) === 'number') ? options.radius : 12;
    var zmin = (typeof(options.zmin) === 'number') ? Math.floor(options.zmin) : -1;
    var zmax = (typeof(options.zmax) === 'number') ? Math.floor(options.zmax) : zmin + 2;

    var rng = new PRng({seed:options.seed, initDepth:5000});
    var systems = [];

    if (radius <= 0){
      throw new RangeError("Radius too small");
    }

    
    if (typeof(options.data) !== 'string' && typeof(options.data) !== typeof({})){
      options.autoGenerate = (options.autoGenerate === true) ? true : false;
      options.systemAtOrigin = (options.systemAtOrigin === true) ? true : false;
    }

    Object.defineProperties(this, {
      "seed":{
	enumerable:true,
	get:function(){return rng.state.seed;},
	set:function(seed){
	  options.seed = seed;
	  rng = new PRng({seed:seed, initDepth:5000});
	}
      },
      
      "systems":{
	enumerable: true,
	get:function(){
	  var sys = [];
	  for (var i=0; i < systems.length; i++){
	    sys.push(WrapSysInformation(systems[i]));
	  }
	  return sys;
	}
      },

      "radius":{
	enumerable:true,
	get:function(){return radius;},
        set:function(r){
          if (typeof(r) !== 'number'){
            throw new TypeError("Expected number value.");
          }
          if (r <= 0){
            throw new RangeError("Value must be greater than zero.");
          }
          if (systems.length > 0){
            systems = systems.filter(function(i){
              return (i.r <= r);
            });
          }
          radius = r;
        }
      },

      "depth":{
        enumerable:true,
        get:function(){return 1 + (zmax - zmin);} // There's always a depth of at least 1
      },

      "zmax":{
        enumerable:true,
        get:function(){return zmax;},
        set:function(z){
          if (typeof(z) !== 'number'){
            throw new TypeError("Expected number value.");
          }
          if (z < zmin){
            throw new RangeError("Attempting to set a Z Max value less than the current Z Min value.");
          }
          if (z < zmax){ // If we're shrinking, then remove any stars or objects that are now out of range.
            systems = systems.filter(function(i){
              return (i.z <= z);
            });
          }
          zmax = z;
        }
      },

      "zmin":{
        enumerable:true,
        get:function(){return zmin;},
        set:function(z){
          if (typeof(z) !== 'number'){
            throw new TypeError("Expected number value.");
          }
          if (z > zmax){
            throw new RangeError("Attempting to set a Z Min value greater than the current Z Max value.");
          }
          if (z > zmin){ // If we're shrinking, then remove any stars or objects that are now out of range.
            systems = systems.filter(function(i){
              return (i.z >= z);
            });
          }
          zmin = z;
        }
      },

      "systemCount":{
	enumerable: true,
	get:function(){return systems.length;}
      },

      "emptySystemCount":{
        enumerable: true,
        get:function(){
          var count = 0;
          for (var i=0; i < systems.length; i++){
            if (systems[i].star.bodyCount <= 0){
              count += 1;
            }
          }
          return count;
        }
      },

      "emptySystems":{
        enumerable: true,
        get:function(){
          var sys = [];
          for (var i=0; i < systems.length; i++){
            if (systems[i].star.bodyCount <= 0){
              sys.push(WrapSysInformation(systems[i]));
            }
          }
          return sys;
        }
      },

      "nonEmptySystemCount":{
        enumerable: true,
        get:function(){
          var count = 0;
          for (var i=0; i < systems.length; i++){
            if (systems[i].star.bodyCount > 0){
              count += 1;
            }
          }
          return count;
        }
      },

      "nonEmptySystems":{
        enumerable: true,
        get:function(){
          var sys = [];
          for (var i=0; i < systems.length; i++){
            if (systems[i].star.bodyCount > 0){
              sys.push(WrapSysInformation(systems[i]));
            }
          }
          return sys;
        }
      },

      "terrestrialSystemCount":{
        enumerable: true,
        get:function(){
          var count = 0;
          for (var i=0; i < systems.length; i++){
            if (systems[i].star.hasBodiesOfType(Terrestrial.Type) === true){
              count += 1;
            }
          }
          return count;
        }
      },

      "terrestrialSystems":{
        enumerable: true,
        get:function(){
          var sys = [];
          for (var i=0; i < systems.length; i++){
            if (systems[i].star.hasBodiesOfType(Terrestrial.Type) === true){
              sys.push(WrapSysInformation(systems[i]));
            }
          }
          return sys;
        }
      },

      "habitableSystemCount":{
        enumerable: true,
        get:function(){
          var count = 0;
          for (var i=0; i < systems.length; i++){
            if (systems[i].star.hasHabitable() === true){
              count += 1;
            }
          }
          return count;
        }
      },

      "habitableSystems":{
        enumerable: true,
        get:function(){
          var sys = [];
          for (var i=0; i < systems.length; i++){
            if (systems[i].star.hasHabitable() === true){
              sys.push(WrapSysInformation(systems[i]));
            }
          }
          return sys;
        }
      },

      "asteroidSystemCount":{
        enumerable: true,
        get:function(){
          var count = 0;
          for (var i=0; i < systems.length; i++){
            if (systems[i].star.hasBodiesOfType(AsteroidBelt.Type) === true){
              count += 1;
            }
          }
          return count;
        }
      },

      "asteroidSystems":{
        enumerable: true,
        get:function(){
          var sys = [];
          for (var i=0; i < systems.length; i++){
            if (systems[i].star.hasBodiesOfType(AsteroidBelt.Type) === true){
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
	  enumerable:true,
	  get:function(){return sys.r;},
	  set:function(r){
	    if (typeof(r) !== 'number'){throw new TypeError("Expecting Number Type.");}
	    if (r < 0){throw new RangeError("Value expected to be positive.");}
	    sys.r = r;
	  }
	},
	"a":{
	  enumerable:true,
	  get:function(){return sys.a;},
	  set:function(a){
	    if (typeof(a) !== 'number'){throw new TypeError("Expecting Number Type.");}
	    if (a < 0){throw new RangeError("Value expected to be positive.");}
	    sys.a = a;
	  }
	},
	"z":{
	  enumerable:true,
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

    this.setZBounds = function(minz, maxz){
      if (minz < maxz){
        zmin = minz;
        zmax = maxz;
        if (systems.length > 0){
          systems = systems.filter(function(i){
            return (i.z >= zmin && i.z <= zmax);
          });
        }
      }
    };

    this.getSystemsContaining = function(type_or_list){
      if (typeof(type_or_list) === 'number'){
        return this.getSystemsContaining([type_or_list]);
      } else if (type_or_list instanceof Array){
        var sys = [];
        for (var i=0; i < systems.length; i++){
          var star = systems[i].star;
          for (var t=0; t < type_or_list.length; t++){
            if (star.hasBodiesOfType(type_or_list[t]) === true){
              sys.push(WrapSysInformation(systems[i]));
            }
          }
        }
        return sys;
      }
      throw new TypeError("Unsupported argument value.");
    };

    this.toString = function(pretty){
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
	  star: JSON.parse(systems[i].star.toString())
	});
      }

      if (pretty === true){
	return JSON.stringify(reg, null, 2);
      }
      return JSON.stringify(reg);
    };

    this.canPlaceStar = function(r, a, z){
      for (var i=0; i < systems.length; i++){
	if (DistanceBetween(r, a, systems[i].r, systems[i].a) < 1.0){
	  return false;
	}
      }
      return true;
    };

    this.addStar = function(ops){
      var star = null;
      ops = (typeof(ops) === typeof({})) ? ops : {};
      if (typeof(ops.star) !== 'undefined'){
	if (ops.star instanceof Star){
	  star = ops.star;
	} else if (typeof(ops.star) === typeof({})){
	  try{
	    star = new Star({from: ops.star});
	  } catch (e) {throw e;}
	} else if (typeof(ops.star) === 'string'){
	  try{
	    star = new Star({from: ops.jsonString});
	  } catch (e) {throw e;}
	} else {
	  throw new TypeError("Invalid data type given for star.");
	}
      } else {
        if (typeof(ops.seed) !== 'string'){
          ops.seed = rng.generateUUID();
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
        ops.z = (zmin === zmax) ? zmin : Math.round(rng.value(zmin, zmax));
      } else {
        ops.z = Math.floor(ops.z);
        if (ops.z < zmin || ops.z > zmax){
          throw new RangeError("Given Z depth is out of bounds.");
        }
      }

      var store = this.canPlaceStar(ops.r, ops.a, ops.z);
      if (store){
	if (star === null){
	  var sops = {
	    seed: rng.generateUUID()
	  };
	  if (typeof(ops.name) === 'string' && ops.name.length > 0){
	    sops.name = ops.name;
	  }
	  if (typeof(ops.companions) === 'number' && ops.companions >= 0){
	    sops.companions = Math.floor(ops.companions);
	  }
	  if (typeof(ops.maxBodies) === 'number' && ops.maxBodies >= 0){
	    sops.maxBodies = ops.maxBodies;
	  }
	  if (typeof(ops.arrangement) === 'number' && ops.arrangement >= 0){
	    sops.arrangement = ops.arrangement;
	  }
	  if (typeof(ops.mass) === 'number' && ops.mass > 0){
	    sops.mass = ops.mass;
	  }
	  if (typeof(ops.age) === 'number' && ops.age >= 0){
	    sops.age = ops.age;
	  }
	  star = new Star(sops);
	}

        systems.push({
          r: ops.r,
	  a: ops.a,
	  z: ops.z,
	  star: star
        });
      } else if (typeof(ops.attempts) === 'number' && ops.attemps > 0){
	ops.attemps -= 1;
	this.addStar(ops);
      }
    };

    this.removeStar = function(star){
      for (var i=0; i < systems.length; i++){
        if (systems[i].star === star){
          systems.splice(i, 1);
          break;
        }
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

    this.load = function(str_or_obj){
      var data = null;
      try{
	if (typeof(str_or_obj) === typeof({})){
	  data = JSON.parse(JSON.stringify(str_or_obj));
	} else {
	  data = JSON.parse(str_or_obj);
	}
      } catch (e) {
	throw e;
      }
      if (tv4.validate(data, RegionSchema) === false){
	throw new Error(tv4.error);
      }

      if (data.radius <= 0){
        throw new RangeError("Property 'radius' must be greater than zero."); 
      }
      if (data.zmin > data.zmax){
        throw new RangeError("Property 'zmin' is greater than property 'zmax'.");
      }

      // If we already have systems, remove them all!
      if (systems.length > 0){
        systems.splice(0, systems.length);
      }

      radius = data.radius;
      zmin = Math.floor(data.zmin);
      zmax = Math.floor(data.zmax);
      
      for (var i=0; i < data.systems.length; i++){
	try{
	  this.addStar(data.systems[i]);
	} catch (e) {
	  throw e;
	}
      }
    };

    this.empty = function(force){
      if (force === true && systems.length > 0){
        systems.splice(0, systems.length);
      }
      return systems.length <= 0;
    };

    this.generate = function(density, systemAtOrigin, forceEmpty){
      if (forceEmpty === true){
	this.empty(true);
      }
      var volume = Math.PI*(radius*radius); // TODO: Handle depth.
      var count = 1; // Adding one to make sure we always generate at least one!
      if (typeof(density) === 'number' && density > 0){
	count += (density*0.01)*volume;
      } else {
	count += Math.round(rng.value(volume*0.1, volume*0.4));
      }

      var originSatisfied = false;
      if (systems.length > 0){
	count -= systems.length;
	systems.forEach(function(sys){
	  if (sys.r === 0 && sys.a === 0){
	    originSatisfied = true;
	  }
	});
      }

      if (count > 0){
	if (options.systemAtOrigin === true && originSatisfied === false){
          this.addStar({
            fullSystemGeneration:true,
            r:0,
            a:0,
	    seed: rng.generateUUID()
          });
          count -= 1;
	}
	for (var i=0; i < count; i++){
          this.addStar({
	    fullSystemGeneration:true,
	    seed:rng.generateUUID()
	  });
	}
      }
    };


    // ------
    // Final setup calls!
    // ------
    if (typeof(options.data) === 'string' || typeof(options.data) === typeof({})){
      try{
        this.load(options.data);
      } catch (e) { throw e; }
    } else {
      // ----------
      // Generating automatically if requested.
      if (options.autoGenerate === true){
	this.generate(options.systemDensity, options.systemAtOrigin === true);
      }
    }
    
  }
  Region.prototype.constructor = Region;

  Region.ValidateData = function(data){
    if (typeof(data) === 'string'){
      try{
	data = JSON.parse(data);
      } catch (e) {
	return false;
      }
    } 

    if (typeof(data) === typeof({})){
      if (tv4.validate(data, RegionSchema) === true){
	if (data.systems instanceof Array){
	  for (var i=0; i < data.systems.length; i++){
	    if (Star.ValidateData(data.systems[i].star) === false){
	      return false;
	    }
	  }
	}
	return true;
      }
    }
    return false;
  };

  return Region;
});
