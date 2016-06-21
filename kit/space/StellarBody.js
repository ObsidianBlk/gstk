
module.exports = (function(){

  var GGMassDensityTable = [
    {Smass: 10, Sdensity: 0.42, Mmass: 100, Mdensity: 0.18, Lmass: 600, Ldensity:0.31},
    {Smass: 15, Sdensity: 0.26, Mmass: 150, Mdensity: 0.19, Lmass: 800, Ldensity:0.35},
    {Smass: 20, Sdensity: 0.22, Mmass: 200, Mdensity: 0.20, Lmass: 1000, Ldensity:0.4},
    {Smass: 30, Sdensity: 0.19, Mmass: 250, Mdensity: 0.22, Lmass: 1500, Ldensity:0.6},
    {Smass: 40, Sdensity: 0.17, Mmass: 300, Mdensity: 0.24, Lmass: 2000, Ldensity:0.8},
    {Smass: 50, Sdensity: 0.17, Mmass: 350, Mdensity: 0.25, Lmass: 2500, Ldensity:1.0},
    {Smass: 60, Sdensity: 0.17, Mmass: 400, Mdensity: 0.26, Lmass: 3000, Ldensity:1.2},
    {Smass: 70, Sdensity: 0.17, Mmass: 450, Mdensity: 0.27, Lmass: 3500, Ldensity:1.4},
    {Smass: 80, Sdensity: 0.17, Mmass: 500, Mdensity: 0.29, Lmass: 4000, Ldensity:1.6},
  ];

  var TemperatureScaleTable = [
    {Kmin: 140, kmax:500, step: 24}, // 0
    {Kmin: 80, kmax: 140, step: 4}, // 1
    {Kmin: 50, kmax: 80, step: 2}, // 2
    {Kmin: 140, kmax: 215, step: 5}, // 3
    {Kmin: 80, kmax: 230, step: 10}, // 4
    {Kmin: 250, kmax: 340, step: 6}, // 5
    {Kmin: 500, kmax: 950, step: 30}, // 6
  ];

  var TerrestrialClassTable = [
    "Rock", // 0
    "Ice", // 1
    "Ocean", // 2
    "Garden", // 3
    "Greenhouse", // 4
    "Hadean", // 5
    "Chthonian", // 6
    "Sulfur", // 7
    "Ammonia" // 8
  ];

  var TerrestrialSizeClassTable = [
    {Hsize: 2, Hclass: 6, Htsi: 6, Bsize: 1, Bclass: 5, Btsi: 2, Gsize: 2, Gclass: 3, Gtsi: 5},
    {Hsize: 2, Hclass: 6, Htsi: 6, Bsize: 1, Bclass: 1, Btsi: 1, Gsize: 2, Gclass: 3, Gtsi: 5},
    {Hsize: 2, Hclass: 3, Htsi: 5, Bsize: 1, Bclass: 0, Btsi: 0, Gsize: 2, Gclass: 3, Gtsi: 5},
    {Hsize: 2, Hclass: 3, Htsi: 5, Bsize: 1, Bclass: 0, Btsi: 0, Gsize: 2, Gclass: 3, Gtsi: 5},
    {Hsize: 0, Hclass: 7, Htsi: 1, Bsize: 0, Bclass: 0, Btsi: 0, Gsize: 2, Gclass: 3, Gtsi: 5},
    {Hsize: 0, Hclass: 7, Htsi: 1, Bsize: 0, Bclass: 0, Btsi: 0, Gsize: 2, Gclass: 3, Gtsi: 5},
    {Hsize: 0, Hclass: 7, Htsi: 1, Bsize: 0, Bclass: 1, Btsi: 1, Gsize: 2, Gclass: 3, Gtsi: 5},
    {Hsize: 2, Hclass: 8, Htsi: 3, Bsize: 0, Bclass: 1, Btsi: 1, Gsize: 2, Gclass: 3, Gtsi: 5},
    {Hsize: 2, Hclass: 8, Htsi: 3, Bsize: -1, Bclass: -1, Btsi: 0, Gsize: 2, Gclass: 3, Gtsi: 5},
    {Hsize: 2, Hclass: 8, Htsi: 3, Bsize: -1, Bclass: -1, Btsi: 0, Gsize: 2, Gclass: 3, Gtsi: 5},
    {Hsize: 3, Hclass: 8, Htsi: 3, Bsize: 2, Bclass: 2, Btsi: 5, Gsize: 2, Gclass: 3, Gtsi: 5},
    {Hsize: 3, Hclass: 8, Htsi: 3, Bsize: 2, Bclass: 2, Btsi: 5, Gsize: 2, Gclass: 3, Gtsi: 5},
    {Hsize: 3, Hclass: 4, Htsi: 6, Bsize: 2, Bclass: 1, Btsi: 4, Gsize: 2, Gclass: 3, Gtsi: 5},
    {Hsize: 3, Hclass: 4, Htsi: 6, Bsize: 2, Bclass: 5, Btsi: 2, Gsize: 2, Gclass: 3, Gtsi: 5},
    {Hsize: 3, Hclass: 6, Htsi: 6, Bsize: 3, Bclass: 2, Btsi: 5, Gsize: 3, Gclass: 3, Gtsi: 5},
    {Hsize: 3, Hclass: 6, Htsi: 6, Bsize: 3, Bclass: 1, Btsi: 4, Gsize: 3, Gclass: 3, Gtsi: 5}
  ];

  function GetGGMassDensityVariance(rng, roll){
    if (roll > 17){roll = 17;}
    if (roll < 8){roll = 8;}
    var index = roll-8;

    // Calculating "half mass difference" between "this" mass and the "next"
    var smdiff = (index <= 1) ? 2.5 : 5;
    var mmdiff = 25;
    var lmdiff = (index <= 1) ? 100 : 250;

    var variance = rng.uniform();
    var increase = (rng.uniform() >= 0.5) ? true : false;
    var densityDiff = (increase) ? 0.1*variance : -(0.1*variance);

    smdiff *= (increase) ? variance : -variance;
    mmdiff *= (increase) ? variance : -variance;
    lmdiff *= (increase) ? variance : -variance;

    var ent = GGMassDensityTable[index];
    return {
      Smass: ent.Smass + smdiff,
      Sdensity: ent.Sdensity + (ent.Sdensity*densityDiff),
      Mmass: ent.Mmass + mmdiff,
      Mdensity: ent.Mdensity + (ent.Mdensity*densityDiff),
      Lmass: ent.Lmass + lmdiff,
      Ldensity: ent.Ldensity + (ent.Ldensity*densityDiff)
    };
  };

  function GetTerrestrialSizeClassTemp(rng, type){
    if (typeof(type) !== 'number' || type < 0 || type > 2){
      type = rng.rollDice(6,3);
      if (type <= 7){
	type = 0;
      } else if (type >= 8 && type <= 13){
	type = 1;
      } else {
	type = 2;
      }
    } else {type = Math.floor(type);}

    var index = rng.rollDice(6, 3) - 3;
    var ent = TerrestrialSizeClassTable[index];

    var temp = 0;
    var tempsteprange = 0;

    switch(type){
    case 0:
      tempsteprange = Math.floor(
	(TemperatureScaleTable[ent.Htsi].Kmax - TemperatureScaleTable[ent.Htsi].Kmin)/TemperatureScaleTable[ent.Htsi].step
      );
      temp = TemperatureScaleTable[ent.Htsi].Kmin + (Math.floor(rng.uniform()*tempsteprange) * TemperatureScaleTable[ent.Htsi].step);
      return {size: ent.Hsize, class: ent.Hclass, temp: temp};
    case 1:
      tempsteprange = Math.floor(
	(TemperatureScaleTable[ent.Btsi].Kmax - TemperatureScaleTable[ent.Btsi].Kmin)/TemperatureScaleTable[ent.Btsi].step
      );
      temp = TemperatureScaleTable[ent.Btsi].Kmin + (Math.floor(rng.uniform()*tempsteprange) * TemperatureScaleTable[ent.Btsi].step);
      return {size: ent.Bsize, class: ent.Bclass, temp: temp};
    case 2:
      tempsteprange = Math.floor(
	(TemperatureScaleTable[ent.Gtsi].Kmax - TemperatureScaleTable[ent.Gtsi].Kmin)/TemperatureScaleTable[ent.Gtsi].step
      );
      temp = TemperatureScaleTable[ent.Gtsi].Kmin + (Math.floor(rng.uniform()*tempsteprange) * TemperatureScaleTable[ent.Gtsi].step);
      return {size: ent.Gsize, class: ent.Gclass, temp: temp};
    }

    return {size: -1, class: -1, temp: 0};
  };

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

  function GetRotationalPeriod(rng, size, type){
    var roll = rng.rollDice(6, 3);
    var Adjust = function(){
      if (type === 0){
	roll += (size === 1) ? 6 : 0;
      } else if (type === 2){
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

  function ClimateDescription(temp){
    if (temp < 244){
      return "frozen";
    } else if (temp >= 244 && temp <= 255){
      return "very cold";
    } else if (temp > 255 && temp <= 266){
      return "cold";
    } else if (temp > 266 && temp <= 278){
      return "chilly";
    } else if (temp > 278 && temp <= 289){
      return "cool";
    } else if (temp > 289 && temp <= 300){
      return "normal";
    } else if (temp > 300 && temp <= 311){
      return "warm";
    } else if (temp > 311 && temp <= 322){
      return "tropical";
    } else if (temp > 322 && temp <= 333){
      return "hot";
    } else if (temp > 333 && temp <= 344){
      return "very hot";
    }
    // temp Above 344
    return "infernal";
  }

  function GenGasGiant(body, rng, options){
    var ggmd = GetGGMassDensityVariance(rng, rng.rollDice(6,3));

    body.type = 0; // 0 = "Gas Giant"
    body.size = rng.rollDice(6, 3);
    if (body.size <= 10){
      body.size = 1; // Small
      body.mass = ggmd.Smass;
      body.density = ggmd.Sdensity;
    } else if (body.size > 10 && body.size <= 16){
      body.size = 2; // Medium
      body.mass = ggmd.Mmass;
      body.density = ggmd.Mdensity;
    } else {
      body.size = 3; // Large
      body.mass = ggmd.Lmass;
      body.density = ggmd.Ldensity;
    }

    body.diameter = Math.cbrt(body.mass / body.density);
    body.rotationalPeriod = GetRotationalPeriod(rng, body.size, body.type);
    body.axialTilt = GetAxialTilt(rng);

    return body;
  }

  function CalculateHydrographics(rng, size, type){
    var hg = 0;

    if (size === 1 && type === 1){
      hg = (rng.rollDice(6, 1)+2)*10;
    } else if (type === 8 && (size === 2 || size === 3)){
      hg = rng.rollDice(6, 2)*10;
      if (hg > 100){hg = 100;}
    } else if (type === 1 && (size === 2 || size === 3)){
      hg = (rng.rollDice(6, 2)-10)*10;
      if (hg < 0){hg = 0;}
    } else if ((type === 2 || type === 3) && (size === 2 || size === 3)){
      hg = (rng.rollDice(6, 1) + ((size === 3) ? 6 : 4))*10;
      if (hg > 100){hg = 100;}
    } else if (type === 4 && (size === 2 || size === 3)){
      hg = (rng.rollDice(6, 2)-7) * 10;
      if (hg < 0){hg = 0;}
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

  function GenTerrestrial(body, rng, options){
    body.type = 1; // 1 = "Asteroid Belt"
    var sc = GetTerrestrialSizeClassTemp(rng, options.terrestrialType);
    if (sc.size === -1 || sc.class === -1){
      return false; // This should force Asteroid!
    }

    body.size = sc.size;
    body.class = sc.class;
    body.temperature = sc.temp;
    body.hydrographics = CalculateHydrographics(rng, sc.size, sc.class);

    var atm = {
      mass: 100, // Not a real value at the moment.
      suffocating: false,
      corrosive: false,
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
      atm.mass = (rng.rollDice(6, 3)/10) + rng.value(-0.05, 0.05);
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
    body.atmosphere = atm;

    var ag = CalculateAbsorptionAndGreenhouse(sc.size, sc.class, body.hydrographics);
    var bbcor = ag.ab * (1 + (atm.mass * ag.gh));
    var blackbody = body.temperature / bbcor;

    // TODO: Calculate diameter using blackbody.
    // TODO: Calculate affinity score.

    body.rotationalPeriod = GetRotationalPeriod(rng, body.size, body.type);
    body.axialTilt = GetAxialTilt(rng);
    return body;
  }

  function GenAsteroidBelt(body, rng, options){
    body.type = 2; // 2 = "Terrestrial"

    return body;
  }

  function StellarBody(rng, options){
    var data = null;
    if (options.makeGasGiant === true){
      data = GenGasGiant({}, rng, options);
    } else if (options.makAsteroidBelt === true){
      data = GenAsteroidBelt({}, rng, options);
    } else { // Always assume generation of a terrestrial planet
      data = GenTerrestrial({}, rng, options);
      if (data === false){
	data = GenAsteroidBelt({}, rng, options);
      }
    }

    data.name = rng.generateUUID();

    Object.defineProperties(this, {
      "name":{
	get:function(){return data.name;},
	set:function(name){
	  if (typeof(name) !== 'string'){throw new TypeError("Expected string.");}
	  data.name = name;
	}
      },

      "type":{
	get:function(){
	  switch(data.type){
	  case 0:
	    return "Gas Giant";
	  case 1:
	    return "Asteroid Belt";
	  case 2:
	    return "Terrestrial";
	  }
	  return "UNKNOWN";
	}
      },

      "size":{
	get:function(){
	  switch(data.size){
	  case 0:
	    switch(data.type){
	    case 1:
	      return "Small";
	    case 2:
	      return "Medium";
	    case 3:
	      return "Large";
	    }
	    break;
	  case 1:
	    switch(data.type){
	    case 1:
	      return "Thin";
	    case 2:
	      return "Average";
	    case 3:
	      return "Thick";
	    }
	    break;
	  case 2:
	    switch(data.type){
	    case 0:
	      return "Tiny";
	    case 1:
	      return "Small";
	    case 2:
	      return "Standard";
	    case 3:
	      return "Large";
	    }
	  }
	  return "UNKNOWN";
	}
      }
    });

  }
  StellarBody.prototype.constructor = StellarBody;

  return StellarBody;
})();
