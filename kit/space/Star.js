
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'kit/PRng',
      'kit/space/StellarBody'
    ], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
	require('../PRng'),
	require('./StellarBody')
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

    if (root.GSTK.$.exists(root.GSTK, [
      "PRng",
      "space.StellarBody"
    ]) === false){
      throw new Error("Required component not defined.");
    }

    root.GSTK.$.def (root.GSTK, "space.Star", factory(
      root.GSTK.PRng,
      root.GSTK.space.StellarBody
    ));
  }
})(this, function (PRng, StellarBody) {


  var StellarEvolutionTable = [
    {mass: 0.10, type: "M7", temp: 3100, Lmin: 0.0012, Lmax: null, Mspan: null, Sspan: null, Gspan: null},
    {mass: 0.15, type: "M6", temp: 3200, Lmin: 0.0036, Lmax: null, Mspan: null, Sspan: null, Gspan: null},
    {mass: 0.20, type: "M5", temp: 3200, Lmin: 0.0079, Lmax: null, Mspan: null, Sspan: null, Gspan: null},
    {mass: 0.25, type: "M4", temp: 3300, Lmin: 0.015, Lmax: null, Mspan: null, Sspan: null, Gspan: null},
    {mass: 0.30, type: "M4", temp: 3300, Lmin: 0.024, Lmax: null, Mspan: null, Sspan: null, Gspan: null},
    {mass: 0.35, type: "M3", temp: 3400, Lmin: 0.037, Lmax: null, Mspan: null, Sspan: null, Gspan: null},
    {mass: 0.40, type: "M2", temp: 3500, Lmin: 0.054, Lmax: null, Mspan: null, Sspan: null, Gspan: null},
    {mass: 0.45, type: "M1", temp: 3700, Lmin: 0.07, Lmax: 0.08, Mspan: 70, Sspan: null, Gspan: null},
    {mass: 0.50, type: "M0", temp: 3800, Lmin: 0.09, Lmax: 0.11, Mspan: 59, Sspan: null, Gspan: null},
    {mass: 0.55, type: "K8", temp: 4000, Lmin: 0.11, Lmax: 0.15, Mspan: 50, Sspan: null, Gspan: null},
    {mass: 0.60, type: "K6", temp: 4200, Lmin: 0.13, Lmax: 0.20, Mspan: 42, Sspan: null, Gspan: null},
    {mass: 0.65, type: "K5", temp: 4400, Lmin: 0.15, Lmax: 0.25, Mspan: 37, Sspan: null, Gspan: null},
    {mass: 0.70, type: "K4", temp: 4600, Lmin: 0.19, Lmax: 0.35, Mspan: 30, Sspan: null, Gspan: null},
    {mass: 0.75, type: "K2", temp: 4900, Lmin: 0.23, Lmax: 0.48, Mspan: 24, Sspan: null, Gspan: null},
    {mass: 0.80, type: "K0", temp: 5200, Lmin: 0.28, Lmax: 0.65, Mspan: 20, Sspan: null, Gspan: null},
    {mass: 0.85, type: "G8", temp: 5400, Lmin: 0.36, Lmax: 0.84, Mspan: 17, Sspan: null, Gspan: null},
    {mass: 0.90, type: "G6", temp: 5500, Lmin: 0.45, Lmax: 1.00, Mspan: 14, Sspan: null, Gspan: null},
    {mass: 0.95, type: "G4", temp: 5700, Lmin: 0.56, Lmax: 1.30, Mspan: 12, Sspan: 1.8, Gspan: 1.1},
    {mass: 1.00, type: "G2", temp: 5800, Lmin: 0.68, Lmax: 1.60, Mspan: 10, Sspan: 1.6, Gspan: 1.0},
    {mass: 1.05, type: "G1", temp: 5900, Lmin: 0.87, Lmax: 1.90, Mspan: 8.8, Sspan: 1.4, Gspan: 0.8},
    {mass: 1.10, type: "G0", temp: 6000, Lmin: 1.10, Lmax: 2.20, Mspan: 7.7, Sspan: 1.2, Gspan: 0.7},
    {mass: 1.15, type: "F9", temp: 6100, Lmin: 1.40, Lmax: 2.60, Mspan: 6.7, Sspan: 1.0, Gspan: 0.6},
    {mass: 1.20, type: "F8", temp: 6300, Lmin: 1.70, Lmax: 3.00, Mspan: 5.9, Sspan: 0.9, Gspan: 0.6},
    {mass: 1.25, type: "F7", temp: 6400, Lmin: 2.10, Lmax: 3.50, Mspan: 5.2, Sspan: 0.8, Gspan: 0.5},
    {mass: 1.30, type: "F6", temp: 6500, Lmin: 2.50, Lmax: 3.90, Mspan: 4.6, Sspan: 0.7, Gspan: 0.4},
    {mass: 1.35, type: "F5", temp: 6600, Lmin: 3.10, Lmax: 4.50, Mspan: 4.1, Sspan: 0.6, Gspan: 0.4},
    {mass: 1.40, type: "F4", temp: 6700, Lmin: 3.70, Lmax: 5.10, Mspan: 3.7, Sspan: 0.6, Gspan: 0.4},
    {mass: 1.45, type: "F3", temp: 6900, Lmin: 4.30, Lmax: 5.70, Mspan: 3.3, Sspan: 0.5, Gspan: 0.3},
    {mass: 1.50, type: "F2", temp: 7000, Lmin: 5.10, Lmax: 6.50, Mspan: 3.0, Sspan: 0.5, Gspan: 0.3},
    {mass: 1.60, type: "F0", temp: 7300, Lmin: 6.70, Lmax: 8.20, Mspan: 2.5, Sspan: 0.4, Gspan: 0.2},
    {mass: 1.70, type: "A9", temp: 7500, Lmin: 8.60, Lmax: 10.0, Mspan: 2.1, Sspan: 0.3, Gspan: 0.2},
    {mass: 1.80, type: "A7", temp: 7800, Lmin: 11.0, Lmax: 13.0, Mspan: 1.8, Sspan: 0.3, Gspan: 0.2},
    {mass: 1.90, type: "A6", temp: 8000, Lmin: 13.0, Lmax: 16.0, Mspan: 1.5, Sspan: 0.2, Gspan: 0.1},
    {mass: 2.00, type: "A5", temp: 8200, Lmin: 16.0, Lmax: 20.0, Mspan: 1.3, Sspan: 0.2, Gspan: 0.1}
  ];

  function GetSETEntry(mass){
    for (var i=0; i < StellarEvolutionTable.length; i++){
      if (Math.abs(StellarEvolutionTable[i].mass - mass) < 0.01){
	return StellarEvolutionTable[i];
      }
    }
    return null;
  }

  function GetSETEntryByType(type){
    for (var i=0; i < StellarEvolutionTable.length; i++){
      if (StellarEvolutionTable[i].type === type){
	return StellarEvolutionTable[i];
      }
    }
    return null;
  }

  function StarMassCalc(r1, r2){
    var Mass = function(base, adj, breaks){
      switch (breaks){
      case 2:
	if (r2 >= 3 && r2 <= 10){
	  return base;
	}
	return base - adj;
      case 3:
	if (r2 >= 3 && r2 <= 8){
	  return base;
	} else if (r2 >= 9 && r2 <= 11){
	  return base - adj;
	}
	return base - (adj*2);
      case 4:
	if (r2 >= 3 && r2 <= 7){
	  return base;
	} else if (r2 >= 8 && r2 <= 10){
	  return base - adj;
	} else if (r2 >= 11 && r2 <= 12){
	  return base - (adj*2);
	}
	return base - (adj*3);

      case 5:
	if (r2 >= 3 && r2 <= 7){
	  return base;
	} else if (r2 >= 8 && r2 <= 9){
	  return base - adj;
	} else if (r2 === 10){
	  return base - (adj*2);
	} else if (r2 >= 11 && r2 <= 12){
	  return base - (adj*3);
	}
	return base - (adj*4);
      }

      return base;
    };

    switch(r1){
    case 3:
      return Mass(2, 0.1, 2);
    case 4:
      return Mass(1.8, 0.1, 3);
    case 5:
      return Mass(1.5, 0.05, 4);
    case 6:
      return Mass(1.3, 0.05, 5);
    case 7:
      return Mass(1.05, 0.05, 5);
    case 8:
      return Mass(0.8, 0.05, 5);
    case 9:
      return Mass(0.55, 0.05, 3);
    case 10:
      return Mass(0.4, 0.05, 3);
    case 11:
      return 0.25;
    case 12:
      return 0.2;
    case 13:
      return 0.15;
    }

    return 0.1;
  }


  function StarAgeCalc(r1, r2, r3){
    var age = 0;

    if (r1 >= 4 && r1 <= 6){
      age += 0.1 + (r2*0.3) + (r3*0.05);
    } else if (r1 >= 7 && r1 <= 10){
      age += 2 + (r2*0.6) + (r3*0.1);
    } else if (r1 >= 11 && r1 <= 14){
      age += 5.6 + (r2*0.6) + (r3*0.1);
    } else if (r1 >= 15 && r1 <= 17){
      age += 8 + (r2*0.6) + (r3*0.1);
    } else {
      age += 10 + (r2*0.6) + (r3*0.1);
    }

    return age;
  }


  function GenStar(star, rng, options){
    var r1 = 0;

    // Generate a companion star mass to the given primary star.
    if (typeof(options.primaryStar) !== 'undefined'){
      r1 = rng.rollDice(6, 1) - 1;
      star.mass = options.primaryStar.mass;
      if (r1 >= 1){
	if (star.mass >= 1.6){
	  star.mass += (1.5 - star.mass); // NOTE: This is a subtraction. Don't get confused by the "+="
	  r1 += (1.5 - star.mass)*10;
	  star.mass -= (0.5 * r1);
	} else {
	  if (star.mass - (r1 * 0.5) < 0.1){
	    star.mass = 0.1;
	  } else {
	    star.mass -= (r1*0.5);
	  }
	}
      }

    // Force the generation of a star mass that can more easily support a "Garden" world.
    } else if (options.supportGardenWorlds === true){
      r1 = 5;
      switch (rng.rollDice(6, 1)){
      case 2:
	r1 = 6; break;
      case 3: case 4:
	r1 = 7; break;
      case 5: case 6:
	r1 = 8; break;
      }
      star.mass = StarMassCalc(
	r1,
	rng.rollDice(6, 3)
      );

    // Full, random generation of a star mass.
    } else {
      star.mass = StarMassCalc(
	rng.rollDice(6, 3),
	rng.rollDice(6, 3)
      );
    }
    

    // -- Calculating Age
    if (typeof(options.primaryStar) !== 'undefined'){
      star.age = options.primaryStar.age;
    } else {
      star.age = StarAgeCalc(
	(options.supportGardenWorlds === true) ? rng.rollDice(6, 2)+2 : rng.rollDice(6, 3),
	rng.rollDice(6, 1)-1,
	rng.rollDice(6, 1)-1
      );
    }

    var sete = GetSETEntry(star.mass);
    // -- Storing the star's current type and assumed temprature
    star.type = sete.type;
    star.temp = sete.temp;

    if (options.supportGardenWorlds === true && sete.Mspan !== null && star.age >= sete.Mspan){
      star.age = (sete.Mspan*0.75)*rng.uniform();
    }

    // -- Calculating Luminosity Class
    star.lumClass = "V";
    if (sete.Mspan !== null && star.age > sete.Mspan){
      if (sete.Sspan === null){
	star.lumClass = "D";
      } else {
	if (star.age <= sete.Sspan){
	  star.lumClass = "IV";
	} else if (star.age <= sete.Gspan){
	  star.lumClass = "III";
	} else {
	  star.lumClass = "D";
	}
      }
    }

    if (star.lumClass !== "D"){
      // -- Calculating actual Luminosity
      if (star.mass <= 0.4){
	star.luminosity = sete.Lmin + (sete.Lmin*rng.value(-0.1, 0.1));
      } else {
	if (sete.Sspan === null || star.age <= sete.Mspan){
          star.luminosity = sete.Lmin + ((star.age/sete.Mspan)*(sete.Lmax - sete.Lmin));
	} else if (sete.Sspan !== null && star.age > sete.Mspan){
	  // Adjusting for Sub-Giant stage
	  star.temp -= ((star.age - sete.Mspan)/sete.Sspan)*(star.temp-4800); // Higher temprature.
	  star.luminosity = sete.Lmax + (sete.Lmax * rng.value(-0.1, 0.1));

	  if (star.age > sete.Sspan){
	    // Adjusting for Giant stage.
	    star.temp = 3000 + ((rng.rollDice(6, 2)-2) * 200);
	    star.luminosity *= 25;
	  }
	}
      }
    } else {
      // -- Recaluclating for a White Dwarf star.
      star.mass = 0.9 + ((rng.rollDice(6, 2) - 2)*0.05);
      star.luminosity = 0.001;
    }

    // -- Calculating radius...
    star.radius = (155000 * Math.sqrt(star.luminosity)) / (star.temp * star.temp);

    return star;
  }


  function CalcOrbitalInformation(rng, roll, primaryMass, companionMass){
    var multi = 0.05;
    var mod = -6;
    var desc = "Very Close";
    if (roll > 6 && roll <= 9){
      multi = 0.5;
      mod = -4;
      desc = "Close";
    } else if (roll > 9 && roll <= 11){
      multi = 2;
      mod = -2;
      desc = "Moderate";
    } else if (roll > 11 && roll <= 14){
      multi = 10;
      mod = 0;
      desc = "Wide";
    } else {
      multi = 50;
      mod = 0;
      desc = "Distant";
    }
    var hmulti = 0.5 * multi;

    var oradius = rng.rollDice(6, 2)*multi;
    oradius += rng.value(-hmulti, hmulti);

    var e = 0;
    roll = (rng.rollDice(6, 3) + mod) - 3; // 0 basing
    e = (roll >= 15) ? 0.95 : roll*0.1;
    if (e < 0){ e = 0;}

    return {
      description: desc,
      avgRadius: oradius,
      rMin: (1 - e) * oradius,
      rMax: (1 + e) * oradius,
      period: Math.sqrt((oradius*oradius*oradius)/(primaryMass + companionMass))
    };
  }


  function CalculateLimitRadii(rng, star, options){
    var mass = star.mass;
    var luminosity = star.luminosity;
    var sete = GetSETEntryByType(star.type);
    
    if (star.lumClass === "D"){
      if (sete !== null){
        mass = sete.mass;
        luminosity = (sete.Lmax !== null) ? sete.Lmax : sete.Lmin;
      }
    }

    star.limit = {
      innerRadius: Math.max(
        0.1*mass,
        0.01*Math.sqrt(luminosity)
      ),
      outerRadius: 40 * mass,
      snowLine: (sete !== null) ? 4.85 * Math.sqrt(sete.Lmin) : 0
    };
  }



  

  /* -------------------------------------------------------------------------------
   * Actual Star class
   * ---------------------------------------------------------------------------- */
  function Star(seed, options){
    options = (typeof(options) !== typeof({})) ? {} : options;
    var rng = new PRng({seed:seed, initDepth:5000});

    var data = GenStar({}, rng, options);
    data.name = rng.generateUUID();

    // Calculating Inner and Outer Limit Radii... and Snow line.
    CalculateLimitRadii(rng, data);

    var stellarBodiesGenerated = false; // This is just a marker so stellar bodies are only created once.

    Object.defineProperties(this, {
      "name":{
        enumerate: true,
        get:function(){return data.name;},
        set:function(name){
          if (typeof(name) !== 'string'){
            throw new TypeError("Expecting string.");
          }
          data.name = name;
        }
      },

      "type":{
        enumerate: true,
        get:function(){
          return (typeof(data.type) === 'string') ? data.type : "UNIQUE";
        }
      },

      "class":{
        enumerate: true,
        get:function(){
          return (typeof(data.lumClass) === 'string') ? data.lumClass : "";
        }
      },

      "mass":{
        enumerate: true,
        get:function(){return (typeof(data.mass) === 'number') ? data.mass : 0;},
        set:function(mass){
          if (typeof(mass) !== 'number'){throw new TypeError("Expected number.");}
          if (mass <= 0){throw new RangeError("Value must be greater than zero.");}
          data.mass = mass;
        }
      },

      "radius":{
	enumerate:true,
	get:function(){return data.radius;}
      },

      "age":{
        enumerate: true,
        get:function(){return (typeof(data.age) === 'number') ? data.age : 0;},
        set:function(age){
          if (typeof(age) !== 'number'){throw new TypeError("Expected number.");}
          if (age < 0){throw new RangeError("Value must be positive.");}
          data.age = age;
        }
      },

      "temperature":{
        enumerate: true,
        get:function(){return (typeof(data.temp) === 'number') ? data.temp : 0;},
        set:function(temp){
          if (typeof(temp) !== 'number'){throw new TypeError("Expected number.");}
          data.temp = temp;
        }
      },

      "luminosity":{
        enumerate: true,
        get:function(){return (typeof(data.luminosity) === 'number') ? data.luminosity : 0;},
        set:function(lum){
          if (typeof(lum) !== 'number'){throw new TypeError("Expected number.");}
          if (lum < 0){throw new RangeError("Value must be positive.");}
          data.luminosity = lum;
        }
      },

      "orbit":{
	enumerate: true,
	get:function(){return (typeof(data.orbit) !== 'undefined') ? JSON.parse(JSON.stringify(data.orbit)) : null;}
      },

      "forbiddenZone":{
	enumerate: true,
	get:function(){return (typeof(data.forbiddenZone) !== 'undefined') ? JSON.parse(JSON.stringify(data.forbiddenZone)) : null;}
      },

      "companionCount":{
        enumerate: true,
        get:function(){return (typeof(data.companion) !== 'undefined') ? data.companion.length : 0;}
      },

      "stellarBodyCount":{
	enumerate: true,
	get:function(){return (typeof(data.stellarBody) !== 'undefined') ? data.stellarBody.length : 0;}
      },

      "hasPlanets":{
	enumerate: true,
	get:function(){
	  if (typeof(data.stellarBody) !== 'undefined'){
	    for (var i=0; i < data.stellarBody.length; i++){
	      var body = data.stellarBody[i].body;
	      if (body.typeIndex === 2 || body.typeIndex === 0){
		return true;
	      }
	    }
	  }
	  return false;
	}
      },

      "planetCount":{
	enumerate: true,
	get:function(){
	  var count = 0;
	  if (typeof(data.stellarBody) !== 'undefined'){
	    for (var i=0; i < data.stellarBody.length; i++){
	      var body = data.stellarBody[i].body;
	      if (body.typeIndex === 2 || body.typeIndex === 0){
		count += 1;
	      }
	    }
	  }
	  return count;
	}
      },

      "hasBreathableWorlds":{
	enumerate: true,
	get:function(){
	  if (typeof(data.stellarBody) !== 'undefined'){
	    for (var i=0; i < data.stellarBody.length; i++){
	      var body = data.stellarBody[i].body;
	      if (body.typeIndex === 2 && body.atmosphere.breathable === true){
		return true;
	      }
	    }
	  }
	  return false;
	}
      },

      "breathableWorldCount":{
	enumerate: true,
	get:function(){
	  var count = 0;
	  if (typeof(data.stellarBody) !== 'undefined'){
	    for (var i=0; i < data.stellarBody.length; i++){
	      var body = data.stellarBody[i].body;
	      if (body.typeIndex === 2 && body.atmosphere.breathable === true){
		count += 1;
	      }
	    }
	  }
	  return count;
	}
      },

      "data":{
        enumerate: true,
        get:function(){return data;}
      }
    });

    function GetRandomOrbitalSpacing(){
      switch(rng.rollDice(6, 3)){
      case 3: case 4:
	return 1.4;
      case 5: case 6:
	return 1.5;
      case 7: case 8:
	return 1.6;
      case 9: case 10: case 11: case 12:
	return 1.7;
      case 13: case 14:
	return 1.8;
      case 15: case 16:
	return 1.9;
      }
      return 2.0;
    }

    function GetOrbitalEccentricity(gasGiant, inSnowLine, arrangement){
      var roll = rng.rollDice(6, 3);
      if (gasGiant){
	if (arrangement === 1 && inSnowLine){
	  roll += 4;
	} else if (arrangement === 0){
	  roll -= 6;
	}
      }

      if (roll <= 3){return 0 + rng.value(-0.025, 0.025);}
      switch(roll){
      case 4: case 5: case 6:
	return 0.05 + rng.value(-0.025, 0.025);
      case 7: case 8: case 9:
	return 0.1 + rng.value(-0.025, 0.025);
      case 10: case 11:
	return 0.15 + rng.value(-0.025, 0.025);
      case 12:
	return 0.2 + rng.value(-0.05, 0.05);
      case 13:
	return 0.3 + rng.value(-0.05, 0.05);
      case 14:
	return 0.4 + rng.value(-0.05, 0.05);
      case 15:
	return 0.5 + rng.value(-0.05, 0.05);
      case 16:
	return 0.6 + rng.value(-0.05, 0.05);
      case 17:
	return 0.7 + rng.value(-0.05, 0.05);
      }
      return 0.8 + rng.value(-0.05, 0.05);
    }

    function ValidateOrbitalRadius(radius, adjustIn){
      if (radius < data.limit.innerRadius || radius > data.limit.outerRadius){
	return -1;
      }
      adjustIn = (adjustIn === true) ? true : false;

      var ccount = (typeof(data.companion) !== 'undefined') ? data.companion.length : 0;
      for (var c=0; c < ccount; c++){
	var fz = data.companion[c].forbiddenZone;
	if (radius >= fz.innerRadius && radius <= fz.outerRadius){
	  if (adjustIn === true){
	    // Adjust it so that it's between .1 and .2 AU away from the innerRadius of forbidden zone
	    radius = fz.innerRadius - rng.value(0.1, 0.2); 
	  } else {
	    radius = fz.outerRadius + rng.value(0.1, 0.5);
	  }

	  // Check to see if adjustment is still generally legal...
	  if (radius < data.limit.innerRadius || radius > data.limit.outerRadius){
	    return -1; // Nope... invalid radius
	  }
	}
      }

      return radius;
    }

    function GenerateOrbitAtRadius(radius, arrangementType, geninfo){
      if (typeof(data.stellarBody) === 'undefined'){
        data.stellarBody = [];
      }

      var firstAfterSnowline = true;
      if (geninfo.makeGasGiant === true){
        for (var i=0; i < data.stellarBody.length; i++){
          if (data.stellarBody[i].radius >= data.limit.snowLine){
            firstAfterSnowline = false;
            break;
          }
        }
      }

      var eccentricity = GetOrbitalEccentricity(geninfo.makeGasGiant, radius < data.limit.snowLine, arrangementType);
      var Rmin = (1 - eccentricity)*radius;
      var Rmax = (1 + eccentricity)*radius;

      data.stellarBody.push({
        avgRadius: radius,
        rMin: Rmin,
        rMax: Rmax,
        period: Math.sqrt((radius*radius*radius)/data.mass),
        body: geninfo
      });
      // NOTE: StellarBody instance is not actually generated at this step.
    }

    function GenerateOrbitList(){
      var radius = 0;
      // Generation direction... 0 = In | 1 = Out | 2 = Both
      var gendir = 2; // Assume both directions to start.

      // Start with first Gas Giant...
      var arrangementType = 0; // None
      switch(rng.rollDice(6, 3)){
      case 11: case 12: // Convensional
	arrangementType = 1;
	radius = ValidateOrbitalRadius((1 + ((rng.rollDice(6, 2)-2)*0.05)) * data.limit.snowLine);
	break;
      case 13: case 14: // Eccentric
	arrangementType = 2; 
	radius = ValidateOrbitalRadius((rng.rollDice(6, 1)*0.125)*data.limit.snowLine);
	break;
      case 15: case 16: case 17: case 18: // Epistellar
	arrangementType = 3;
	radius = ValidateOrbitalRadius((rng.rollDice(6, 3)*0.1)*data.limit.innerRadius);
	break;
      }

      if (radius <= 0){
        // Is inner limit a valid radius (not in a forbidden zone)?
        radius = ValidateOrbitalRadius(data.limit.innerRadius);
        gendir = 1;
        if (radius <= 0){
          // Ok... how about the outer limit radius?
          radius = ValidateOrbitalRadius(data.limit.outerRadius);
          gendir = 0;
          if (radius <= 0){return;} // Ok... can't find a valid start point. Must not have any space for planets... hehe... space
        }
      } else {
        GenerateOrbitAtRadius(radius, arrangementType, {
          makeGasGiant: true,
          contentModifier: 4
        });
      }

      var newRadius = 0;
      var genRadius = 0;
      var lastRadius = radius;
      var geninfo = null;

      var MakeGasGiant = function(){
        switch(arrangementType){
	case 1:
	  return (newRadius < data.limit.snowLine) ? false : (rng.rollDice(6, 3) <= 15);
	case 2:
	  return (newRadius < data.limit.snowLine) ? (rng.rollDice(6, 3) <= 8) : (rng.rollDice(6, 3) <= 14);
	case 3:
	  return (newRadius < data.limit.snowLine) ? (rng.rollDice(6, 3) <= 6) : (rng.rollDice(6, 3) <= 14);
	}
        return false;
      };

      // Generate Inwards!
      if (gendir === 0 || gendir === 2){
        genRadius = radius / GetRandomOrbitalSpacing();
        newRadius = ValidateOrbitalRadius(genRadius, true);
        while (newRadius > data.limit.innerRadius){
          if (lastRadius - newRadius > 0.15){
            geninfo = {
              makeGasGiant:MakeGasGiant(),
              contentTypeRoll: rng.rollDice(6, 3)
            };
            
            if (geninfo.makeGasGiant || (geninfo.contentTypeRoll > 3 && newRadius < data.limit.snowLine)){
              if (geninfo.makeGasGiant === false){
                if (genRadius !== newRadius){ // Orbit was bumped by forbidden zone!
                  geninfo.contentTypeRoll -= 6;
                } else if (newRadius / 2 < data.limit.innerRadius){ // This is the last radius before overtaking the inner limit radius.
                  geninfo.contentTypeRoll -= 3;
                }
                if (geninfo.contentTypeRoll <= 6){
                  geninfo.makeAsteroidBelt = true;
                }
              }
              GenerateOrbitAtRadius(newRadius, arrangementType, geninfo);
            }
          }
          if (newRadius > data.limit.innerRadius){
            lastRadius = newRadius;
            genRadius = newRadius / GetRandomOrbitalSpacing();
            newRadius = ValidateOrbitalRadius(genRadius, true);
          }
        }
      }


      // Generate Outwards!
      if (gendir === 1 || gendir === 2){
        lastRadius = radius;
        genRadius = radius * GetRandomOrbitalSpacing();
        newRadius = ValidateOrbitalRadius(genRadius);
        while (newRadius > 0 && newRadius <= data.limit.outerRadius){
	  //console.log("Outward: " + newRadius + " | Limit: " + data.limit.outerRadius);
          if (newRadius - lastRadius > 0.15){
            geninfo = {
              makeGasGiant:MakeGasGiant(),
              contentTypeRoll: rng.rollDice(6, 3)
            };
            
            if (geninfo.makeGasGiant || (geninfo.contentTypeRoll > 3 && newRadius < data.limit.snowLine)){
              if (geninfo.makeGasGiant === false){
                if (genRadius !== newRadius){ // Orbit was bumped by forbidden zone!
                  geninfo.contentTypeRoll -= 6;
                } else if (newRadius * 1.4 > data.limit.outerRadius){ // This is the last radius before overtaking the inner limit radius.
                  geninfo.contentTypeRoll -= 3;
                }
                if (geninfo.contentTypeRoll <= 6){
                  geninfo.makeAsteroidBelt = true;
                }
              }
              GenerateOrbitAtRadius(newRadius, arrangementType, geninfo);
            }
          }
          if (newRadius < data.limit.outerRadius){
            lastRadius = newRadius;
            genRadius = newRadius * GetRandomOrbitalSpacing();
            newRadius = ValidateOrbitalRadius(genRadius);
          }
        }
      }
    }


    this.getCompanion = function(index){
      if (typeof(data.companion) === 'undefined' || (index < 0 || index >= data.companion.length)){
        throw new RangeError();
      }
      return {
	orbit: JSON.parse(JSON.stringify(data.companion[index].orbit)),
	forbiddenZone: JSON.parse(JSON.stringify(data.companion[index].forbiddenZone)),
	compansion: data.companion[index].companion
      };
    };

    this.getCompanionByName = function(name){
      if (typeof(data.companion) !== 'undefined'){
	for (var i=0; i < data.companion.length; i++){
	  if (data.companion[i].companion.name === name){
	    return {
	      orbit: JSON.parse(JSON.stringify(data.companion[i].orbit)),
	      forbiddenZone: JSON.parse(JSON.stringify(data.companion[i].forbiddenZone)),
	      compansion: data.companion[i].companion
	    };
	  }
	}
      }
      return null;
    };


    this.generateCompanion = function(){
      if (typeof(data.stellarBody) === 'undefined'){ // Don't want to create new companions after the stellar bodies.
        if (typeof(data.companion) === 'undefined'){
          data.companion = [];
        }
        if (data.companion.length < 2){
          var cmp = new Star(rng.generateUUID(), {
            supportGardenWorlds: (options.supportGardenWorlds === true) ? true : false
          });
          
          var roll = rng.rollDice(6, 3);
          if (options.supportGardenWorlds === true){
            if (data.companion.length === 0){
              // This is the first companion...
              roll += 4;
            } else { // And this is the second companion...
              roll += 6;
            }
          }

          var c = {
            companion: cmp,
            orbit: CalcOrbitalInformation(rng, roll, data.mass, cmp.mass)
          };
          c.forbiddenZone = {
            innerRadius: 0.33 * c.orbit.rmin,
            outerRadius: 3 * c.orbit.rmax
          };
          
          data.companion.push(c);
        }
      }
    };


    this.getStellarBody = function(index){
      if (typeof(data.stellarBody) === 'undefined' || index < 0 || index > data.stellarBody.length){
	throw new RangeError("Index is out of bounds");
      }
      return {
	avgRadius: data.stellarBody[index].avgRadius,
        rMin: data.stellarBody[index].rMin,
        rMax: data.stellarBody[index].rMax,
        period: data.stellarBody[index].period,
        body: data.stellarBody[index].body
      };
    };

    this.getStellarBodyByName = function(name){
      if (typeof(data.stellarBody) !== 'undefined'){
	for (var i=0; i < data.stellarBody.length; i++){
	  if (data.stellarBody[i].body.name === name){
	    return {
	      avgRadius: data.stellarBody[i].avgRadius,
              rMin: data.stellarBody[i].rMin,
              rMax: data.stellarBody[i].rMax,
              period: data.stellarBody[i].period,
              body: data.stellarBody[i].body
	    };
	  }
	}
      }
      return null;
    };

    this.generateStellarBodies = function(){
      if (stellarBodiesGenerated === false){
        stellarBodiesGenerated = true;
        GenerateOrbitList();

        if (typeof(data.stellarBody) !== 'undefined'){
          // Now... sort the list!
          data.stellarBody.sort(function(a, b){
            return (a.avgRadius - b.avgRadius);
          });

          // Finally... build the planets!
          data.stellarBody.forEach(function(info){
            info.body = new StellarBody(rng.generateUUID(), info.body);
          });
        }
      }
    };
  }
  Star.prototype.constructor = Star;


  return Star;
});
