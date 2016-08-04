
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

    root.GSTK.$.def (root.GSTK, "space.Terrestrial", factory(
      root.GSTK.PRng,
      root.tv4,
      root.GSTK.space.StellarBody
    ));
  }
})(this, function (PRng, tv4, StellarBody) {

  var TerrestrialSchema = {
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "object",
    "properties": {
      "affinity": {"type": "integer"},
      "atmosphere": {
	"type": "object",
	"properties": {
          "breathable": {"type": "boolean"},
          "composition": {
            "type": "array",
            "items": {"type": "string"}
          },
          "corrosive": {"type": "boolean"},
          "marginal": {"type": "boolean"},
          "mass": {"type": "number"},
          "pressure": {"type": "integer"},
          "suffocating": {"type": "boolean"},
          "toxicity": {"type": "integer"}
	},
	"required": [
          "breathable",
          "corrosive",
          "mass",
          "pressure",
          "suffocating",
          "toxicity"
	]
      },
      "axialTilt": {"type": "integer"},
      "blackbody": {"type": "number"},
      "class": {"type": "integer"},
      "density": {"type": "number"},
      "diameter": {"type": "number"},
      "hydrographics": {"type": "integer"},
      "mass": {"type": "number"},
      "name": {"type": "string"},
      "resourceIndex": {"type": "integer"},
      "rotationalPeriod": {"type": "number"},
      "size": {"type": "integer"},
      "surfaceGravity": {"type": "number"},
      "temperature": {"type": "integer"},
      "_type": {"type": "integer"},
      "companion": {
	"type": "array",
	"items": {
          "type": "object",
          "properties": {
            "orbit": {
              "type": "object",
              "properties": {
		"avgRadius": {"type": "number"},
		"rMin": {"type": "number"},
		"rMax": {"type": "number"},
		"period": {"type": "number"}
              },
              "required": [
		"avgRadius",
		"rMin",
		"rMax",
		"period"
              ]
            },
            "body": {
	      "type": "object",
	      "properties": {
		"_type": {"type": "number"}
	      },
	      "required":[
		"_type"
	      ]
	    }
          },
          "required": [
            "orbit",
            "companion"
          ]
	}
      }
    },
    "required": [
      "affinity",
      "atmosphere",
      "axialTilt",
      "blackbody",
      "class",
      "density",
      "diameter",
      "hydrographics",
      "mass",
      "name",
      "resourceIndex",
      "rotationalPeriod",
      "size",
      "surfaceGravity",
      "temperature",
      "type"
    ]
  };


  function GetSizeClassTempFromBlackBody(rng, blackbody, options){
    var size = 0;
    if (typeof(options.size) === 'number'){
      size = Math.floor(options.size);
      if (size < 0){
	size = 0;
      } else if (size > 3){
	size = 3;
      }
    } else {
      size = rng.rollDice(6, 1) - 3;
      if (size < 0){size = 0;}
    }

    var cls = 0; // 0 = Rock
    var temp = 0;

    switch (size){
    case 0:
      if (blackbody <= 140){
	if (rng.uniform() <= 0.5){
	  cls = 1; // Ice
	} else {
	  cls = 7; // Sulfur
	}
      }
      break;
    case 1:
      if (blackbody <= 80){
	cls = 5; // Hadean
      } else if (blackbody > 80 && blackbody < 140){
	cls = 1; // Ice
      }
      break;
    case 2:
      if (blackbody <= 80){
	cls = 5; // Hadean
      } else if (blackbody > 80 && blackbody <= 150){
	cls = 1; // Ice
      } else if (blackbody > 150 && blackbody <= 230){
	if (rng.uniform() <= 0.5){
	  cls = 1; // Ice
	} else {
	  cls = 8; // Ammonia
	}
      } else if (blackbody > 230 && blackbody <= 240){
	cls = 1; // Ice ... Damn... lot of ice
      } else if (blackbody > 240 && blackbody <= 320){
	if (options.makeGarden === true){
	  cls = 3; // Garden
	} else if (rng.uniform() <= 0.5){
	  cls = 3; // Garden .. again... we like gardens!
	} else {
	  cls = 2; // Ocean
	}
      } else if (blackbody > 320 && blackbody <= 500){
	cls = 4; // Greenhouse
      } else {
	cls = 6; // Chthonian
      }
      break;
    case 3:
      if (blackbody <= 150){
	cls = 1; // Ice
      } else if (blackbody > 150 && blackbody <= 230){
	if (rng.uniform() <= 0.5){
	  cls = 1; // Ice
	} else {
	  cls = 8; // Ammonia
	}
      } else if (blackbody > 230 && blackbody <= 240){
	cls = 1; // Ice ... Damn... lot of ice
      } else if (blackbody > 240 && blackbody <= 320){
	if (options.makeGarden === true){
	  cls = 3; // Garden
	} else if (rng.uniform() <= 0.5){
	  cls = 3; // Garden .. again... we like gardens!
	} else {
	  cls = 2; // Ocean
	}
      } else if (blackbody > 320 && blackbody <= 500){
	cls = 4; // Greenhouse
      } else {
	cls = 6; // Chthonian
      }
      break;
    }

    return {size: size, class: cls, temp: 0}; // Temp is 0 as no temp is calculated here.
  };

  function GetSizeClassTemp(rng, options){
    options = (typeof(options) === typeof({})) ? options : {};
    var type = 0;
    if (typeof(options.contentType) === 'number'){
      type = Math.floor(options.contentType);
      if (type < 0){
	type = 0;
      } else if (type > 2){
	type = 2;
      }
    } else {
      type = (typeof(options.contentTypeRoll) === 'number') ? Math.floor(options.contentTypeRoll) : rng.rollDice(6,3);
      if (typeof(options.contentModifier) === 'number'){
	type += options.contentModifier;
      }
      
      if (type <= 7){
	type = 0;
      } else if (type >= 8 && type <= 13){
	type = 1;
      } else {
	type = 2;
      }
    }

    var index = 0;
    if (typeof(options.sizeClassIndex) === 'number'){
      index = Math.floor(options.sizeClassIndex);
      if (index < 0){
	index = 0;
      } else if (index >= StellarBody.Table.TerrestrialSizeClassTable.length){
	index = StellarBody.Table.TerrestrialSizeClassTable.length - 1;
      }
    } else {
      index = rng.rollDice(6, 3) - 3;
    }
    var ent = StellarBody.Table.TerrestrialSizeClassTable[index];

    var temp = 0;
    var tempsteprange = 0;
    var tempsteppercent = rng.uniform();
    var tscale = null;
    
    switch(type){
    case 0:
      tscale = StellarBody.Table.TemperatureScaleTable[ent.Htsi];
      tempsteprange = Math.floor(
	(tscale.Kmax - tscale.Kmin)/tscale.step
      );
      temp = tscale.Kmin + (Math.floor(tempsteppercent*tempsteprange) * tscale.step);
      return {size: ent.Hsize, class: ent.Hclass, temp: temp};
    case 1:
      tscale = StellarBody.Table.TemperatureScaleTable[ent.Btsi];
      tempsteprange = Math.floor(
	(tscale.Kmax - tscale.Kmin)/tscale.step
      );
      temp = tscale.Kmin + (Math.floor(tempsteppercent*tempsteprange) * tscale.step);
      return {size: ent.Bsize, class: ent.Bclass, temp: temp};
    case 2:
      tscale = StellarBody.Table.TemperatureScaleTable[ent.Gtsi];
      tempsteprange = Math.floor(
	(tscale.Kmax - tscale.Kmin)/tscale.step
      );
      temp = tscale.Kmin + (Math.floor(tempsteppercent*tempsteprange) * tscale.step);
      return {size: ent.Gsize, class: ent.Gclass, temp: temp};
    }

    return {size: -1, class: -1, temp: 0};
  }

  function CalculateHydrographics(rng, size, cls){
    var hg = 0;

    if (size === 1 && cls === 1){
      hg = (rng.rollDice(6, 1)+2)*10;
    } else if (cls === 8 && (size === 2 || size === 3)){
      hg = rng.rollDice(6, 2)*10;
    } else if (cls === 1 && (size === 2 || size === 3)){
      hg = (rng.rollDice(6, 2)-10)*10;
    } else if ((cls === 2 || cls === 3) && (size === 2 || size === 3)){
      hg = (rng.rollDice(6, 1) + ((size === 3) ? 6 : 4))*10;
    } else if (cls === 4 && (size === 2 || size === 3)){
      hg = (rng.rollDice(6, 2)-7) * 10;
    }

    if (hg !== 0){
      var variance = hg * 0.05;
      hg = Math.floor(hg + (rng.value(-1, 1)*variance));

      if (hg < 0){
	hg = 0;
      } else if (hg > 100){
	hg = 100;
      }
    }

    return hg;
  }


  function CalculateAbsorptionAndGreenhouse(size, type, hydro){
    var ab = 0;
    var gh = 0;

    switch(size){
    case 0:
      if (type === 1){
	ab = 0.86;
      } else if (type === 0){
	ab = 0.97;
      } else if (type === 7){
	ab = 0.77;
      }
      break;
    case 1:
      if (type === 5){
	ab = 0.67;
      } else if (type === 1){
	ab = 0.93;
	gh = 0.1;
      } else if (type === 0){
	ab = 0.96;
      }
      break;
    case 2:
      if (type === 5){
	ab = 0.67;
      }
    case 3:
      if (type === 8){
	ab = 0.84;
	gh = 0.2;
      } else if (type === 1){
	ab = 0.86;
	gh = 0.2;
      } else if (type === 2 || type === 3){
	gh = 0.16;
	if (hydro <= 20){
	  ab = 0.95;
	} else if (hydro > 20 && hydro <= 50){
	  ab = 0.92;
	} else if (hydro > 50 && hydro <= 90){
	  ab = 0.88;
	} else {
	  ab = 0.84;
	}
      } else if (type === 4){
	ab = 0.77;
	gh = 2;
      } else if (type === 6){
	ab = 0.97;
      }
      break;
    }
    

    return {
      ab: ab,
      gh: gh
    };
  }


  function CalculateWorldDensity(rng, size, type){
    var density = 0;

    if ((size === 0 && type === 1) || (size === 0 && type === 7) || (size === 1 && type === 5) || (size === 1 && type === 1) ||
        (size === 2 && type === 5) || (size === 2 && type === 8) || (size === 3 && type === 8)){
      density = 0.3;
    } else if ((size === 0 && type === 0) || (size === 1 && type === 0)){
      density = 0.6;
    } else {
      density = 0.8;
    }

    switch(rng.rollDice(6, 3)){
    case 18:
      density += 0.1;
    case 15: case 16: case 17:
      density += 0.1;
    case 11: case 12: case 13: case 14:
      density += 0.1;
    case 7: case 8: case 9: case 10:
      density += 0.1;
    }

    return density;
  }

  function CalculateAtmosphericPressure(size, cls, atmMass, surfGravity){
    var factor = 0;

    if (size === 1 && cls === 1){
      factor = 10;
    } else if (size === 2 && cls === 4){
      factor = 100;
    } else if (size === 3 && cls === 4){
      factor = 500;
    } else if (size === 2 && (cls === 8 || cls === 1 || cls === 2 || cls === 3)){
      factor = 1;
    } else if (size === 3 && (cls === 8 || cls === 1 || cls === 2 || cls === 3)){
      factor = 5;
    }

    return atmMass * surfGravity * factor;
  }

  function GetRotationalPeriod(rng, size){
    var roll = rng.rollDice(6, 3);
    var Adjust = function(){
      switch (size){
      case 0:
	roll += 18; break;
      case 1:
	roll += 14; break;
      case 2:
	roll += 10; break;
      case 3:
	roll += 6; break;
      }
      roll *= 1/24;
    };

    if (roll < 16){
      Adjust();
    } else { // Especially slow rotation...
      var roll2 = rng.rollDice(6, 2);
      if (roll2 <= 6){
	Adjust();
      } else if (roll2 === 7){
	roll *= 2;
      } else if (roll2 === 8){
	roll *= 5;
      } else if (roll2 === 9){
	roll *= 10;
      } else if (roll2 === 10){
	roll *= 20;
      } else if (roll2 === 11){
	roll *= 50;
      } else {
	roll *= 100;
      }
    }
    return roll;
  }

  function GetAxialTilt(rng){
    var roll = rng.rollDice(6, 3);
    var val = rng.rollDice(6, 2)-2;
    if (roll > 6 && roll <= 9){
      val += 10;
    } else if (roll > 9 && roll <= 12){
      val += 20;
    } else if (roll > 12 && roll <= 14){
      val += 30;
    } else if (roll > 14 && roll <= 16){
      val += 40;
    } else if (roll >= 17){
      roll = rng.rollDice(6, 1);
      if (roll >= 1 && roll <= 2){
	val += 50;
      } else if (roll >= 3 && roll <= 4){
	val += 60;
      } else if (roll === 5){
	val += 70;
      } else if (roll === 6){
	val += 80;
      }
    }
    return val;
  }





  function Generate(data, rng, options){
    data.blackbody = 0;
    if (options.parent !== null){
      if (options.parent instanceof Terrestrial){
	data.blackbody = options.parent.blackbody; // Satellites share blackbody temps.
      } else if (typeof(options.parent.luminosity) === 'number' && typeof(options.orbitalRadius) === 'number'){
	var l = options.parent.luminosity;
	var r = options.orbitalRadius;
	data.blackbody = 278*(Math.pow(l, 0.25)/Math.sqrt(r));
      }
    }

    var sc = (data.blackbody > 0) ? GetSizeClassTempFromBlackBody(rng, data.blackbody, options) : GetSizeClassTemp(rng, options);

    data.size = sc.size;
    data.class = sc.class;
    data.temperature = sc.temp;

    if (typeof(options.hydrographicPercent) === 'number'){
      data.hydrographics = Math.floor(options.hydrographicPercent);
      if (data.hydrographics < 0){
	data.hydrographics = 0;
      } else if (data.hydrographics > 100){
	data.hydrographics = 100;
      }

      if (data.size === 0 && (data.class === 0 || data.class === 1)){
	data.hydrographics = 0;
      }
    } else {
      data.hydrographics = CalculateHydrographics(rng, sc.size, sc.class);
    }

    var atm = {
      mass: 100, // Not a real value at the moment.
      suffocating: false,
      corrosive: false,
      breathable: false,
      marginal: false,
      toxicity: 0
    };
    switch (sc.size){
    case 0: // Tiny
      switch(sc.class){
      case 0: case 1: case 7:
	atm.mass = 0;
      }
      break;
    case 1: // Small
      switch(sc.class){
      case 0: case 5:
	atm.mass = 0;
      }
      break;
    case 2: // Standard
      switch(sc.class){
      case 5: case 6:
	atm.mass = 0;
      }
    case 3: // Large
      if (sc.class === 6){
	atm.mass = 0;
      }
    }
    if (atm.mass > 0){
      // If atmosphere mass is not zero, then we actually calculate it now...
      if (typeof(options.atmosphereicMass) === 'number'){
	atm.mass = options.atmosphericMass;
	if (atm.mass < 0.25){
	  atm.mass = 0.25;
	} else if (atm.mass > 1.85){
	  atm.mass = 1.85;
	}
      } else {
	atm.mass = (rng.rollDice(6, 3)/10) + rng.value(-0.05, 0.05);
      }
    }

    // Defining atmosphere composition...
    if (sc.size === 1 && sc.class === 1){
      atm.suffocating = true;
      atm.toxicity = (rng.rollDice(6, 3) >= 15) ? 2 : 1;
      atm.composition = ["nitrogen", "methane"];
    } else if (sc.size === 2 && sc.class === 8){
      atm.suffocating = true;
      atm.corrosive = true;
      atm.toxicity = 3;
      atm.composition = ["ammonia", "methane", "nitrogen"];
    } else if (sc.size === 2 && sc.class === 1){
      atm.suffocating = true;
      atm.toxicity = (rng.rollDice(6, 3) > 12) ? 1 : 0;
      atm.composition = ["carbon dioxide", "nitrogen"];
    } else if (sc.size === 2 && sc.class === 2){
      atm.suffocating = true;
      atm.toxicity = (rng.rollDice(6, 3) > 12) ? 1 : 0;
      atm.composition = ["carbon dioxide", "nitrogen"];
    } else if (sc.size === 2 && sc.class === 3){
      atm.composition = ["oxygen", "nitrogen"];
      atm.breathable = true;
      atm.marginal = (rng.rollDice(6, 3) >= 12);
    } else if (sc.size === 2 && sc.class === 4){
      atm.suffocating = true;
      atm.corrosive = true;
      atm.toxicity = 3;
      atm.composition = (rng.uniform() >= 0.5) ? ["carbon dioxide"] : ["nitrogen"];
    } else if (sc.size === 3 && sc.class === 8){
      atm.suffocating = true;
      atm.corrosive = true;
      atm.toxicity = 3;
      atm.composition = ["helium", "ammonia", "methane"];
    } else if (sc.size === 3 && sc.class === 1){
      atm.suffocating = true;
      atm.toxicity = 2;
      atm.composition = ["helium", "nitrogen"];
    } else if (sc.size === 3 && sc.class === 2){
      atm.suffocating = true;
      atm.toxicity = 2;
      atm.composition = ["helium", "nitrogen"];
    } else if (sc.size === 3 && sc.class === 3){
      atm.composition = ["oxygen", "nitrogen"];
      atm.breathable = true;
      atm.marginal = (rng.rollDice(6, 3) >= 12);
    } else if (sc.size === 3 && sc.class === 4){
      atm.suffocating = true;
      atm.corrosive = true;
      atm.toxicity = 3;
      atm.composition = (rng.uniform() >= 0.5) ? ["carbon dioxide"] : ["nitrogen"];
    }
    
    if (atm.marginal === true){
      var roll = rng.rollDice(6, 3);
      if (roll >= 3 && roll <= 4){
	atm.toxin = (rng.uniform() >= 0.8) ? "fluorine" : "chlorine";
      } else if (roll >= 5 && roll <= 6){
	atm.toxin = "sulfur compounds";
      } else if (roll === 7){
	atm.toxin = "nitrogen compounds";
      } else if (roll >= 8 && roll <= 9){
	atm.toxin = "organic toxins";
      } else if (roll >= 10 && roll <= 11){
	atm.toxin = "low oxygen";
      } else if (roll >= 12 && roll <= 13){
	atm.toxin = "pollutants";
      } else if (roll === 14) {
	atm.toxin = "high carbon dioxide";
      } else if (roll >= 15 && roll <= 16){
	atm.toxin = "high oxygen";
      } else {
	atm.toxin = "inert gases";
      }
    }
    data.atmosphere = atm;

    var ag = CalculateAbsorptionAndGreenhouse(sc.size, sc.class, data.hydrographics);
    var bbcor = ag.ab * (1 + (atm.mass * ag.gh));

    if (data.blackbody > 0){
      data.temperature = data.blackbody * bbcor;
    } else {
      data.blackbody = data.temperature / bbcor;
    }

    data.density = CalculateWorldDensity(rng, sc.size, sc.class);

    // Calculating diameter...
    var Dmin = 0;
    var Dmax = 0;
    var BK = (data.density !== 0) ? Math.sqrt(data.blackbody/data.density) : 0;

    switch(sc.size){
    case 0:
      Dmin = BK*0.004;
      Dmax = BK*0.024;
      break;
    case 1:
      Dmin = BK*0.024;
      Dmax = BK*0.03;
      break;
    case 2:
      Dmin = BK*0.03;
      Dmax = BK*0.065;
      break;
    case 3:
      Dmin = BK*0.065;
      Dmax = BK*0.091;
      break;
    }

    data.diameter = Dmin + ((Dmax - Dmin)*rng.uniform()); // NOTE: Cheating. The book random effect says something about rolling 2D-2 or something.
    data.surfaceGravity = data.diameter * data.density;
    data.mass = data.density * (data.diameter * data.diameter * data.diameter);
    data.atmosphere.pressure = CalculateAtmosphericPressure(sc.size, sc.class, data.atmosphere.mass, data.surfaceGravity);
    data.resourceIndex = (function(){
      switch(rng.rollDice(6, 3)){
      case 3: case 4:
        return 3;
      case 5: case 6: case 7:
        return 4;
      case 8: case 9: case 10: case 11: case 12: case 13:
        return 5;
      case 14: case 15: case 16:
        return 6;
      case 17: case 18:
        return 7;
      }
      return 0;
    })();
    
    
    // --- Calculating Affinity Score...
    var affinity = 0;
    if (data.atmosphere.breathable === true){
      // Based on pressure density
      if ((data.atmosphere.pressure >= 0.01 && data.atmosphere.pressure <= 0.5) || data.atmosphere.pressure > 1.2){
	affinity += 1;
      } else if (data.atmosphere.pressure > 0.5 && data.atmosphere.pressure <= 0.8){
	affinity += 2;
      } else if (data.atmosphere.pressure > 0.8 && data.atmosphere.pressure <= 1.2){
	affinity += 3;
      }

      // Based on temperature
      if ((data.temperature > 255 && data.temperature <= 266) || (data.temperature > 322 && data.temperature <= 333)){
	affinity += 1;
      } else if (data.temerature > 266 && data.temperature <= 322){
	affinity += 2;
      }

      // Non-marginal atmosphere bonus...
      affinity += (data.atmosphere.marginal === true) ? 0 : 1;

    } else {
      if (data.atmosphere.suffocating === true){
	if (data.atmosphere.toxicity > 0){
	  affinity -= 1;
	  if (data.atmosphere.corrosive === true){
	    affinity -= 1;
	  }
	}
      }
    }

    // Affinity adjustment Based on hydrographics
    if (data.hydrographics >= 1 && data.hydrographics <= 59){
      affinity += 1;
    } else if (data.hydrographics > 59 && data.hydrographics <= 90){
      affinity += 2;
    } else if (data.hydrographics > 90 && data.hydrographics <= 99){
      affinity += 1;
    }

    data.affinity = affinity;

    // --- Misc data.
    data.rotationalPeriod = GetRotationalPeriod(rng, data.size);
    data.axialTilt = GetAxialTilt(rng);
  }


  function Terrestrial(options){
    StellarBody.call(this);
    this.schema = TerrestrialSchema;
    this.data._type = Terrestrial.Type;
    options = (typeof(options) === typeof({})) ? options : {};

    var parent = (options.parent instanceof StellarBody) ? options.parent : null;

    var rng = new PRng({
      seed:(typeof(options.seed) !== 'undefined') ? 
	options.seed : 
	Math.random().toString(), 
      initDepth:5000});

    if (typeof(options.from) === 'string' || typeof(options.from) === typeof({})){
      this.from(options.from);
    } else {
      Generate(this.data, rng, options);
      this.name = (typeof(options.name) === 'string') ? options.name : rng.generateUUID();
    }

    function WrapCompanion(c){
      var o = {};
      Object.defineProperties(o, {
	"avgRadius":{
	  enumerate:true,
	  get:function(){return c.avgRadius;}
	},
	"rMin":{
	  enumerate:true,
	  get:function(){return c.rMin;}
	},
	"rMax":{
	  enumerate:true,
	  get:function(){return c.rMax;}
	},
	"period":{
	  enumerate:true,
	  get:function(){return c.period;}
	}
      });

      o.body = c.body;
      return o;
    }

    
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
	enumerate: true,
	get:function(){return this.data.size;}
      },

      "size":{
        enumerate: true,
	get:function(){
	  switch(this.data.size){
	  case 0:
	    return "Tiny";
	  case 1:
	    return "Small";
	  case 2:
	    return "Standard";
	  case 3:
	    return "Large";
	  }
	  return "UNKNOWN";
	}
      },

      "classIndex":{
	enumerate:true,
	get:function(){return this.data.class;}
      },

      "class":{
        enumerate: true,
        get:function(){return StellarBody.Table.TerrestrialClassTable[this.data.class];}
      },

      "mass":{
        enumerate: true,
        get:function(){return this.data.mass;}
      },

      "density":{
        enumerate: true,
        get:function(){return this.data.density;}
      },

      "diameter":{
        enumerate: true,
        get:function(){return this.data.diameter;}
      },

      "diameterMiles":{
        enumerate: true,
        get:function(){return this.data.diameter*(StellarBody.Conv.E2Mile*2);}
      },

      "diameterKM":{
        enumerate: true,
        get:function(){return this.data.diameter*(StellarBody.Conv.E2KM*2);}
      },

      "surfaceGravity":{
        enumerate: true,
        get:function(){return this.data.surfaceGravity;}
      },

      "rotationalPeriod":{
        enumerate: true,
        get:function(){return this.data.rotationalPeriod;}
      },

      "axialTilt":{
        enumerate: true,
        get:function(){return this.data.axialTilt;}
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
      },

      "hydrographics":{
        enumerate: true,
        get:function(){return this.data.hydrographics;}
      },

      "atmosphere":{
        enumerate: true,
        get:function(){return JSON.parse(JSON.stringify(this.data.atmosphere));}
      },

      "affinity":{
        enumerate: true,
        get:function(){return this.data.affinity;}
      },

      "companionCount":{
	enumerate: true,
	get:function(){return (typeof(this.data.companion) !== 'undefined') ? this.data.companion.length : 0;}
      },

      "companions":{
	enumerate:true,
	get:function(){
	  var list = [];
	  if (typeof(this.data.companion) !== 'undefined'){
	    this.data.companion.forEach(function(c){
	      list.push(WrapCompanion(c));
	    });
	  }
	  return list;
	}
      }
    });

    var _toString = this.toString;
    this.toString = function(pretty){
      var cmp = (typeof(this.data.companion) !== 'undefined') ? this.data.companion : null;
      var list = [];
      if (cmp !== null){
	list = [];
	cmp.forEach(function(c){
	  list.push({
	    avgRadius: c.avgRadius,
	    rMin: c.rMin,
	    rMax: c.rMax,
	    period: c.period,
	    body: JSON.parse(c.body.toString())
	  });
	});
	this.data.companion = list;
      }

      var res = _toString(pretty);

      if (cmp !== null){
	this.data.companion = cmp;
      }
      return res;
    };

    var _from = this.from;
    this.from = function(str_or_obj){
      try{
	_from(str_or_obj);
      } catch (e){throw e;}

      if (typeof(this.data.companion) !== 'undefined'){
	this.data.companion.forEach(function(cmp){
	  cmp.body = StellarBody.BuildType(cmp.body._type, {
	    from: cmp.body,
	    parent: this
	  });
	});
	this.data.companion = this.data.companion.filter(function(cmp){
	  return (cmp.body !== null);
	});
      }
    };


    // TODO: Add functions for adding/removing companions.
  }
  Terrestrial.prototype.__proto__ = StellarBody.prototype;
  Terrestrial.prototype.constructor = Terrestrial;
  Terrestrial.Type = 2;

  StellarBody.RegisterType(Terrestrial);
  return Terrestrial;
});
