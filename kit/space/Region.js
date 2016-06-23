
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
    console.log(srng.seed());
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


  function GenerateStarLocations(rng, radius, density, systemAtOrigin){
    var systems = [];

    for (var x=0; x < radius; x++){
      for (var y=0; y < radius; y++){
	if ((x*x)+(y*y) < (radius * radius)){
	  systems.push({
	    x: x,
	    y: y,
	    z: 0,
	    star: null
	  });
	}
      }
    }

    var dropCount = systems.length - Math.round(systems.length*(density*0.01));

    for (var i=0; i < dropCount; i++){
      var index = Math.floor(systems.length*rng.uniform());
      if (systems[index].x === 0 && systems[index].y === 0 && systemAtOrigin === true){
	i--; // Nope... try again.
      } else {
	systems.splice(index, 1);
      }
    }

    return systems;
  }

  function Region(rng, radius, zmin, zmax, options){
    options = (typeof(options) === typeof({})) ? JSON.parse(JSON.stringify(options)) : {};
    if (radius <= 0){
      throw new RangeError("Radius too small");
    }
    
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

    var systems = GenerateStarLocations(rng, radius, options.systemDensity, options.systemAtOrigin);
    var breathableCount = 0;
    systems.forEach(function(sys){
      sys.z = Math.floor(horizon+rng.value(-(height*0.5), (height*0.5)));
      sys.star = GenerateStar(
	rng,
	options.companionProbability,
	false,
	false);
      breathableCount += (sys.star !== null && sys.star.containsBreathableBody() === true) ? 1 : 0; // Not a true count!
    });

    Object.defineProperties(this, {
      "systemCount":{
	enumerate: true,
	get:function(){return systems.length;}
      },

      "data":{
	get:function(){return systems;}
      }
    });
  }
  Region.prototype.constructor = Region;

  return Region;
});
