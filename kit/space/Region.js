
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'kit/PRng',
      'kit/space/StellarBody', 
      'kit/space/Star'
    ], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
	require('../PRng'),
	require('./StellarBody'),
	require('./Star')
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

    if (root.GSTK.$.exists(root.GSTK, ["PRng",
				       "space.StellarBody",
				       "space.Star"
				      ]) === false){
      throw new Error("Required component not defined.");
    }

    root.GSTK.$.def (root.GSTK, "space.Region", factory(
      root.GSTK.PRng,
      root.GSTK.space.StellarBody,
      root.GSTK.space.Star
    ));
  }
})(this, function (PRng, StellarBody, Star) {

  var MAX_GEN_RECURSION = 10;

  function GenerateStar(rng, companionProbability, supportGardenWorlds, forceBreathable, depth){
    if (typeof(depth) !== 'number'){
      depth = 0;
    }
    if (depth >= MAX_GEN_RECURSION){return null;}

    supportGardenWorlds = (supportGardenWorlds === true) ? true : false;
    forceBreathable = (forceBreathable === true) ? true : false;

    var cp = companionProbability * 0.01;
    var srng = rng.spawn();
    var s = new Star(srng, {supportGardenWorlds: supportGardenWorlds});
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


  function Region(seed, radius, zmin, zmax, options){
    var rng = new PRng({seed:seed, initDepth:5000});

    options = (typeof(options) === typeof({})) ? JSON.parse(JSON.stringify(options)) : {};
    if (radius <= 0){
      throw new RangeError("Radius too small");
    }
    
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

    zmax = Math.floor(zmax);
    zmin = Math.floor(zmin);
    var height = (zmax - zmin >= 1) ? zmax - zmin : 1;
    var horizon = (height > 1) ? Math.floor(height*0.5) : zmin;

    var systems = [];//GenerateStarLocations(rng, radius, horizon, height, options.systemDensity, options.systemAtOrigin);
    if (options.autoGenerate === true){
      this.generate();
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

      "systemsWithPlanets":{
	enumerate: true,
	get:function(){
	  var count = 0;
	  for (var i=0; i < systems.length; i++){
	    if (systems[i].star.hasPlanets === true){
	      count += 1;
	    }
	  }
	  return count;
	}
      },

      "planetCount":{
	enumerate: true,
	get:function(){
	  var count = 0;
	  for (var i=0; i < systems.length; i++){
	    count += systems[i].star.planetCount;
	  }
	  return count;
	}
      },

      "systemsWithBreathableWorlds":{
	enumerate: true,
	get:function(){
	  var count = 0;
	  for (var i=0; i < systems.length; i++){
	    if (systems[i].star.hasBreathableWorlds === true){
	      count += 1;
	    }
	  }
	  return count;
	}
      },

      "breathableWorldCount":{
	enumerate: true,
	get:function(){
	  var count = 0;
	  for (var i=0; i < systems.length; i++){
	    count += systems[i].star.breathableWorldCount;
	  }
	  return count;
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
	  systems.push({
	    r: 0,
	    a: 0,
	    z: 0,
	    star:GenerateStar(
	      rng,
	      options.companionProbability,
	      false,
	      false
	    )
	  });
	  continue;
	}

	var r = rng.value(0, radius);
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
	} // NOTE: I could shift the i variable back one, but, assuming low density systems, this shouldn't drop too many stars.
      } 
    };

    this.getStar = function(index){
      if (index < 0 || index >= systems.length){
	throw new RangeError("Index out of bounds.");
      }
      return {
	r: systems[index].r,
	a: systems[index].a,
	z: systems[index].z,
	star: systems[index].star
      };
    };

    this.getStarByName = function(name){
      for (var index=0; index < systems.length; index++){
	if (systems[index].star.name === name){
	  return {
	    r: systems[index].r,
	    a: systems[index].a,
	    z: systems[index].z,
	    star: systems[index].star
	  };
	}
      }
      return null;
    };

    this.getStarsWithPlanets = function(){
      var swp = [];
      for (var i=0; i < systems.length; i++){
	if (systems[i].star.hasPlanets === true){
	  swp.push(WrapSysInformation(systems[i]));
	}
      }
      return swp;
    };

    this.StarsWithBreathableWorlds = function(){
      var swp = [];
      for (var i=0; i < systems.length; i++){
	if (systems[i].star.hasBreathableWorlds === true){
	  swp.push(WrapSysInformation(systems[i]));
	}
      }
      return swp;
    };
  }
  Region.prototype.constructor = Region;

  return Region;
});
