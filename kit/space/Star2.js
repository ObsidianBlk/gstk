(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'kit/PRng',
      'kit/space/StellarBody',
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
	require('../PRng'),
	require('./StellarBody'),
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
    if (typeof(root.GSTK) === 'undefined'){
      throw new Error("Missing GSTK initilization.");
    } else if (typeof(root.GSTK.$) === 'undefined'){
      throw new Error("GSTK improperly initialized.");
    }

    if (root.GSTK.$.exists(root, [
      "GSTK.PRng",
      "GSTK.space.StellarBody",
      "GSTK.space.GasGiant",
      "GSTK.space.Terrestrial",
      "GSTK.space.AsteroidBelt",
      "tv4"
    ]) === false){
      throw new Error("Required component not defined.");
    }

    root.GSTK.$.def (root.GSTK, "space.Star", factory(
      root.GSTK.PRng,
      root.GSTK.space.StellarBody,
      root.GSTK.space.GasGiant,
      root.GSTK.space.Terrestrial,
      root.GSTK.space.AsteroidBelt,
      root.tv4
    ));
  }
})(this, function (PRng, StellarBody, GasGiant, Terrestrial, AsteroidBelt, tv4) {

  var StarSchema = {
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "object",
    "properties": {
      "_type":{"type": "number"},
      "age": {"type": "number"},
      "limit": {
	"type": "object",
	"properties": {
          "innerRadius": {"type": "number"},
          "outerRadius": {"type": "number"},
          "snowLine": {"type": "number"}
	},
	"required": [
          "innerRadius",
          "outerRadius",
          "snowLine"
	]
      },
      "lumClass": {"type": "string"},
      "luminosity": {"type": "number"},
      "mass": {"type": "number"},
      "name": {"type": "string"},
      "primaryStar": {"type": ["string", "null"]},
      "radius": {"type": "number"},
      "temp": {"type": "integer"},
      "sequence": {"type": "string"},
      "arrangement": {"type": "number"},
      "body": {
	"type": "array",
	"items": {
          "type": "object",
          "properties": {
            "avgRadius": {"type": "number"},
            "body": {"type": "object"},
            "period": {"type": "number"},
            "rMax": {"type": "number"},
            "rMin": {"type": "number"}
	  }
	}
      },
      "companion": {
	"type": "array",
	"items": {
          "type": "object",
          "properties": {
            "orbit": {
              "type": "object",
              "properties": {
		"description": {"type": "string"},
		"avgRadius": {"type": "number"},
		"rMin": {"type": "number"},
		"rMax": {"type": "number"},
		"period": {"type": "number"}
              },
              "required": [
		"description",
		"avgRadius",
		"rMin",
		"rMax",
		"period"
              ]
            },
            "forbiddenZone": {
              "type": "object",
              "properties": {
		"innerRadius": {"type": "number"},
		"outerRadius": {"type": "number"}
              },
              "required": [
		"innerRadius",
		"outerRadius"
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
            "forbiddenZone",
            "body"
          ]
	}
      }
    },
    "required": [
      "_type",
      "age",
      "limit",
      "lumClass",
      "luminosity",
      "mass",
      "name",
      "radius",
      "temp",
      "sequence",
      "arrangement"
    ]
  };

  function CalcOrbitalInformation(rng, primaryMass, companionMass, options){
    options = (typeof(options) === typeof({})) ? options : {};
    var radius = 0;
    if (typeof(options.radius) === 'number' && options.radius > 0){
      radius = options.radius;
    } else {
      var multi = 0.05;
      var mod = -6;
      var desc = "Very Close";
      var roll = rng.rollDice(6, 3) + ((typeof(options.rollMod) === 'number') ? options.rollMod : 0);
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

      radius = (rng.rollDice(6, 2)*multi) + rng.value(-hmulti, hmulti);
    }

    var e = 0;
    if (typeof(options.eccentricity) === 'number' && options.eccentricity < 1.0){
      e = options.eccentricity;
    } else {
      roll = (rng.rollDice(6, 3) + mod) - 3; // 0 basing
      e = (roll >= 15) ? 0.95 : roll*0.1;
      if (e < 0){ e = 0;}
    }

    return {
      description: desc,
      avgRadius: radius,
      rMin: (1 - e) * radius,
      rMax: (1 + e) * radius,
      period: Math.sqrt((radius*radius*radius)/(primaryMass + companionMass))
    };
  }


  function GetStellarEvolutionEntry(mass){
    for (var i=0; i < StellarBody.StellarEvolutionTable.length; i++){
      if (Math.abs(StellarBody.StellarEvolutionTable[i].mass - mass) < 0.01){
	return StellarBody.StellarEvolutionTable[i];
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


  function Generate(data, rng, options){
    var r1 = 0;
    var r2 = 0;
    var r3 = 0;
    var parent = (options.parent instanceof Star) ? options.parent : null;

    // -- Calculating Age
    if (parent !== null){
      data.age = parent.age;
    } else if (typeof(options.age) === 'number'){
      data.age = options.age;
    } else {
      r1 = (options.supportGardenWorlds === true) ? rng.rollDice(6, 2)+2 : rng.rollDice(6, 3);
      r2 = rng.rollDice(6, 1) - 1;
      r3 = rng.rollDice(6, 1) - 1;
      if (r1 >= 4 && r1 <= 6){
	data.age += 0.1 + (r2*0.3) + (r3*0.05);
      } else if (r1 >= 7 && r1 <= 10){
	data.age += 2 + (r2*0.6) + (r3*0.1);
      } else if (r1 >= 11 && r1 <= 14){
	data.age += 5.6 + (r2*0.6) + (r3*0.1);
      } else if (r1 >= 15 && r1 <= 17){
	data.age += 8 + (r2*0.6) + (r3*0.1);
      } else {
	data.age += 10 + (r2*0.6) + (r3*0.1);
      }
    }

    // Generate a companion star mass to the given primary star.
    if (parent !== null){
      r1 = rng.rollDice(6, 1) - 1;
      data.mass = parent.mass;
      if (r1 >= 1){
	if (data.mass >= 1.6){
	  data.mass += (1.5 - data.mass); // NOTE: This is a subtraction. Don't get confused by the "+="
	  r1 += (1.5 - data.mass)*10;
	  data.mass -= (0.5 * r1);
	} else {
	  if (data.mass - (r1 * 0.5) < 0.1){
	    data.mass = 0.1;
	  } else {
	    data.mass -= (r1*0.5);
	  }
	}
      }

    // Force the use of the provided mass.
    } else if (typeof(options.mass) === 'number' && options.mass > 0.0 && options.mass <= 2.0){
      data.mass = options.mass;
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
      data.mass = StarMassCalc(
	r1,
	rng.rollDice(6, 3)
      );
      // Fluctuate the mass by +-0.025
      data.mass += rng.value(-0.025, 0.025);

    // Full, random generation of a star mass.
    } else {
      data.mass = StarMassCalc(
	rng.rollDice(6, 3),
	rng.rollDice(6, 3)
      );
      // Fluctuate the mass by +-0.025
      data.mass += rng.value(-0.025, 0.025);
    }
    

    // -- Storing the star's current type and assumed temprature
    var sete = GetStellarEvolutionEntry(data.mass);
    data.sequence = sete.type;
    data.temp = Math.floor(sete.temp + rng.value(-100, 100)); // I don't REALLY need to floor, but the small degree is trivial. 
    // Adjusting age as needed.
    if (options.supportGardenWorlds === true && sete.Mspan !== null && data.age >= sete.Mspan){
      data.age = (sete.Mspan*0.75)*rng.uniform();
    }

    // -- Calculating Luminosity Class
    data.lumClass = "V";
    if (sete.Mspan !== null && data.age > sete.Mspan){
      if (sete.Sspan === null){
	data.lumClass = "D";
      } else {
	if (data.age <= sete.Sspan){
	  data.lumClass = "IV";
	} else if (data.age <= sete.Gspan){
	  data.lumClass = "III";
	} else {
	  data.lumClass = "D";
	}
      }
    }

    if (data.lumClass !== "D"){
      // -- Calculating actual Luminosity
      if (data.mass <= 0.4){
	data.luminosity = sete.Lmin + (sete.Lmin*rng.value(-0.1, 0.1));
      } else {
	if (sete.Sspan === null || data.age <= sete.Mspan){
          data.luminosity = sete.Lmin + ((data.age/sete.Mspan)*(sete.Lmax - sete.Lmin));
	} else if (sete.Sspan !== null && data.age > sete.Mspan){
	  // Adjusting for Sub-Giant stage
	  data.temp -= ((data.age - sete.Mspan)/sete.Sspan)*(data.temp-4800); // Higher temprature.
	  data.luminosity = sete.Lmax + (sete.Lmax * rng.value(-0.1, 0.1));

	  if (data.age > sete.Sspan){
	    // Adjusting for Giant stage.
	    data.temp = 3000 + ((rng.rollDice(6, 2)-2) * 200);
	    data.luminosity *= 25;
	  }
	}
      }

      // -- Calculating radius...
      data.radius = (155000 * Math.sqrt(data.luminosity)) / (data.temp * data.temp);
    } else {
      // -- Recaluclating for a White Dwarf star.
      data.mass = 0.9 + ((rng.rollDice(6, 2) - 2)*0.05);
      data.luminosity = 0.001;
      // White dwarfs are roughly Earth sized, so...
      data.radius = 0; // 0 AUs. The actual number would be so small I doubt it's worth storing. I'll use earth diameter in the Mile/KM properties.
    }

    // -- Calculating planetary support limits.
    var lmass = data.mass;
    var llum = data.luminosity;
    if (data.lumClass === "D"){
      lmass = sete.mass;
      llum = (sete.Lmax !== null) ? sete.Lmax : sete.Lmin;
    }

    data.limit = {
      innerRadius: Math.max(
        0.1*lmass,
        0.01*Math.sqrt(llum)
      ),
      outerRadius: 40 * lmass,
      snowLine: 4.85 * Math.sqrt(sete.Lmin)
    };

    // -- Calculating the "Gas Giant Arrangement Type". This will effect how standard stellar bodies are placed around star.
    var roll = rng.rollDice(6, 3);
    data.arrangement = 0; // No Gas Giant.
    if (roll > 10 && roll <= 12){
      data.arrangement = 1; // Standard.
    } else if (roll > 12 && roll <= 14){
      data.arrangement = 2; // Eccentric
    } else if (roll > 14 && roll <= 18){
      data.arrangement = 3; // Epistellar
    }
  }



  


  /* -------------------------------------------------------------------------------
   * Actual Star class
   * ---------------------------------------------------------------------------- */
  function Star(options){
    StellarBody.call(this);
    this.schema = StarSchema;
    this._type = Star.Type;
    options = (typeof(options) === typeof({})) ? options : {};
    var rng = new PRng({seed:(typeof(options.seed)!=='undefined') ? options.seed : Math.random().toString(), initDepth:5000});
    var parent = (options.parent instanceof Star) ? options.parent : null;

    if (typeof(options.from) === 'string' || typeof(options.from) === typeof({})){
      this.from(options.from);
    } else {
      /*this.data.type = GasGiant.Type;*/
      Generate(this.data, rng, options);
      this.name = (typeof(options.name) === 'string') ? options.name : rng.generateUUID();
    }

    function WrapCompanion(cmp){
      var c = {};
      Object.defineProperties(c, {
	"orbit":{
	  enumerate: true,
	  get:function(){
	    return JSON.parse(JSON.stringify(cmp.orbit));
	  }
	},
	"forbiddenZone":{
	  enumerate: true,
	  get:function(){
	    return JSON.parse(JSON.stringify(cmp.forbiddenZone));
	  }
	}
      });
      c.body = cmp.body;
      return c;
    }


    function WrapBody(sb){
      var o = {};
      Object.defineProperties(o, {
	"avgRadius":{
	  enumerate:true,
	  get:function(){return sb.avgRadius;}
	},
	"rMin":{
	  enumerate:true,
	  get:function(){return sb.rMin;}
	},
	"rMax":{
	  enumerate:true,
	  get:function(){return sb.rMax;}
	},
	"period":{
	  enumerate:true,
	  get:function(){return sb.period;}
	}
      });

      o.body = sb.body;
      return o;
    }

    function RadiusFromBlackbody(bb){
      var lum = this.data.luminosity;
      return Math.pow((Math.pow(lum, 0.25)*278)/bb, 2);
    }

    function GetOrbitalEccentricity(gasGiant, inSnowLine, arrangement){
      var roll = rng.rollDice(6, 3);
      if (gasGiant){
	if (arrangement === 2 && inSnowLine){
	  roll += 4;
	} else if (arrangement === 3){
	  roll -= 6;
	}
      } else if (arrangement === 1){
	roll -= 6;
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

    function ConfirmRadius(rMin, rMax){
      var count = 0;
      // Check for conflicts with already placed stellar bodies...
      if (typeof(this.data.body) !== 'undefined'){
	count = this.data.body.length;
	for (var i=0; i < count; i++){
	  var body = this.data.body[i];
	  // First check radial crossing...
	  if (body.rMin < rMin){
	    if (body.rMax > rMax){return false;} // Radial crossing
	  } else {
	    if (body.rMax < rMax){return false;} // Radial crossing
	  }

	  // Check if too close...
	  if (Math.abs(rMin - body.rMin) < 1.4 || Math.abs(rMax - body.rMax) < 1.4){
	    return false;
	  }
	}
      }

      // Check for conflict with any existing companion stars.
      if (typeof(this.data.companion) !== 'undefined'){
	count = this.data.companion.length;
	for (var c=0; c < count; c++){
	  var fz = this.data.companion[c].forbiddenZone;
	  if (rMin >= fz.innerRadius && rMin <= fz.outerRadius){return false;}
	  if (rMax >= fz.innerRadius && rMax <= fz.outerRadius){return false;}
	}
      }

      return true;
    }

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


    Object.properties(this, {
      "parent":{
	enumerate: true,
	get:function(){return parent;},
	set:function(p){
	  if (parent === null && p instanceof Star){
	    parent = p;
	  } else if (parent !== null && p === null){
	    parent = null;
	  } else if (p !== null && !(p instanceof Star)){
	    throw new TypeError("Can only parent to a Star instance object.");
	  } else if (parent !== null && parent !== p){
	    throw new Error("Cannot parent to an already parented object. Unparent first.");
	  }
	}
      },

      "sequence":{
        enumerate: true,
        get:function(){
          return (typeof(this.data.sequence) === 'string') ? this.data.sequence : "UNIQUE";
        }
      },

      "class":{
        enumerate: true,
        get:function(){
          return (typeof(this.data.lumClass) === 'string') ? this.data.lumClass : "";
        }
      },

      "mass":{
        enumerate: true,
        get:function(){return (typeof(this.data.mass) === 'number') ? this.data.mass : 0;}
      },

      "radius":{
	enumerate:true,
	get:function(){return this.data.radius;}
      },

      "radiusMiles":{
	enumerate:true,
	get:function(){
	  var r = this.data.radius;
	  return (r > 0) ? r*StellarBody.Conv.AU2Mile : StellarBody.Conv.E2Miles;
	}
      },

      "radiusKM":{
	enumerate:true,
	get:function(){
	  var r = this.data.radius;
	  return (r > 0) ? r*StellarBody.Conv.AU2KM : StellarBody.Conv.E2KM;
	}
      },

      "age":{
        enumerate: true,
        get:function(){return (typeof(this.data.age) === 'number') ? this.data.age : 0;}
      },

      "temperature":{
        enumerate: true,
        get:function(){return (typeof(this.data.temp) === 'number') ? this.data.temp : 0;}
      },

      "luminosity":{
        enumerate: true,
        get:function(){return (typeof(this.data.luminosity) === 'number') ? this.data.luminosity : 0;}
      },

      "limit":{
	enumerate: true,
	get:function(){return (typeof(this.data.limit) !== 'undefined') ? JSON.parse(JSON.stringify(this.data.limit)) : null;}
      },

      "goldielocks":{
	enumerate: true,
	get:function(){
	  var lum = this.data.luminosity;
	  // Coldest is further out than hottest, therefore coldest is max.
	  return {
	    min:Math.pow((Math.pow(lum, 0.25)*278)/320, 2),
	    max:Math.pow((Math.pow(lum, 0.25)*278)/241, 2)
	  };
	}
      },

      "companionCount":{
        enumerate: true,
        get:function(){return (typeof(this.data.companion) !== 'undefined') ? this.data.companion.length : 0;}
      },

      "companions":{
	enumerate: true,
	get:function(){
	  var cmp = [];
	  if (this.companionCount > 0){
	    for (var i=0; i < this.data.companion.length; i++){
	      cmp.push(WrapCompanion(this.data.companion[i]));
	    }
	  }
	  return cmp;
	}
      },

      "fullSystemRadius":{
	enumerate:true,
	get:function(){
	  var size = this.data.limit.outerRadius;
	  for (var c=0; c < this.companionCount; c++){
	    var orbit = this.data.companion[c].orbit;
	    var p = Math.max(orbit.rMin, orbit.rMax);
	    var plimit = p + this.data.companion[c].companion.limit.outerRadius;
	    size = (plimit > size) ? plimit : size;
	  }
	  return size;
	}
      },

      "bodyCount":{
	enumerate: true,
	get:function(){return (typeof(this.data.body) !== 'undefined') ? this.data.body.length : 0;}
      },

      "bodies":{
	enumerate: true,
	get:function(){
	  var sb = [];
	  if (typeof(this.data.body) !== 'undefined'){
	    for (var i=0; i < this.data.body.length; i++){
	      sb.push(WrapBody(this.data.body[i]));
	    }
	  }
	  return sb;
	}
      }
    });

    var _toString = this.toString;
    this.toString = function(pretty){
      var cmp = (typeof(this.data.companion) !== 'undefined') ? this.data.companion : null;
      var body = (typeof(this.data.body) !== 'undefined') ? this.data.body : null;

      if (cmp !== null){
	this.data.companion = [];
	for (var c=0; c < cmp.length; c++){
	  this.data.companion.push({
	    orbit: JSON.parse(JSON.stringify(cmp[c].orbit)),
	    forbiddenZone: JSON.parse(JSON.stringify(cmp[c].forbiddenZone)),
	    companion: JSON.parse(cmp[c].companion.toString())
	  });
	}
      }

      if (body !== null){
	this.data.body = [];
	for (var s=0; s < body.length; s++){
	  this.data.body.push({
	    avgRadius: body[s].avgRadius,
	    rMin: body[s].rMin,
	    rMax: body[s].rMax,
	    period: body[s].period,
	    body: JSON.parse(body[s].body.toString())
	  });
	}
      }

      var res = _toString(pretty);

      if (cmp !== null){
	this.data.companion = cmp;
      }
      if (body !== null){
	this.data.body = body;
      }

      return res;
    };

    var _from = this.from;
    this.from = function(str_or_obj){
      _from(str_or_obj);
      var count = 0;
      if (typeof(this.data.companion) !== 'undefined'){
	count = this.data.companion.length;
	for (var i=0; i < count; i++){
	  this.data.companion[i].body = StellarBody.BuildType(Star.Type, {from: this.data.companion[i].body});
	}
      }

      if (typeof(this.data.body) !== 'undefined'){
	count = this.data.body.length;
	for (var i=0; i < count; i++){
	  this.data.body[i].body = StellarBody.BuildType(this.data.body[i].body._type, {from: this.data.body[i].body});
	}
      }
    };

    this.hasBodiesOfType = function(type){
      if (typeof(this.data.body) !== 'undefined'){
	var count = this.data.body.length;
	for (var i=0; i < count; i++){
	  var b = this.data.body[i];
	  if (b.body.type === type){
	    return true;
	  }
	}
      }
      return false;
    };

    this.getBodiesOfType = function(type){
      var list = [];
      if (typeof(this.data.body) !== 'undefined'){
	var count = this.data.body.length;
	for (var i=0; i < count; i++){
	  var b = this.data.body[i];
	  if (b.body.type === type){
	    list.push(WrapBody(b));
	  }
	}
      }
      return list;
    };

    this.generateCompanion = function(opts){
      opts = (typeof(opts) === typeof({})) ? JSON.parse(JSON.stringify(opts)) : {};

      if (typeof(this.data.body) === 'undefined'){ // Don't want to create new companions after other solar bodies have been added.
	if (parent !== null){return;} // Don't generate a companion of a companion.

        if (typeof(this.data.companion) === 'undefined'){
          this.data.companion = [];
        }

        if (this.data.companion.length < 2){
          var cmp = new Star({
	    seed: rng.generateUUID(),
	    parent: this,
            supportGardenWorlds: (options.supportGardenWorlds === true) ? true : false
          });
          
          if (options.supportGardenWorlds === true){
            if (this.data.companion.length === 0){
              // This is the first companion...
              opts.rollMod = 4;
            } else { // And this is the second companion...
              opts.rollMod = 6;
            }
          }

          var c = {
            body: cmp,
            orbit: CalcOrbitalInformation(rng, this.data.mass, cmp.mass, opts)//CalcOrbitalInformation(rng, roll, data.mass, cmp.mass)
          };
          c.forbiddenZone = {
            innerRadius: 0.33 * c.orbit.rMin,
            outerRadius: 3 * c.orbit.rMax
          };
          
          this.data.companion.push(c);
        }
      }
    };

    function GetGasGiantSize(inSnowline){
      var roll = rng.rollDice(6, 3) + ((inSnowline) ? 4 : 0);
      if (roll >= 17){
	return 2;
      } else if (roll > 10 && roll < 17){
	return 1;
      }
      return 0;
    }

    function GetBodyType(){

    }

    function GenerateRandomGasGiants(lastRadius, direction, current, max){
      if (current >= max){return;}
      var spacing = GetRandomOrbitalSpacing();
      var radius = (direction === 0) ? (lastRadius / spacing) : (lastRadius * spacing);
      var b = {
	avgRadius: radius,
	rMin: 0,
	rMax: 0,
	period: 0,
	body: null
      };

      var e = 0;
      var add = false;
      if (radius >= this.data.limit.innerRadius && radius <= this.data.limit.outerRadius){
	if (radius < this.data.limit.snowLine){
	  if (this.data.arrangement > 1){
	    if ((this.data.arrangement === 2 && rng.rollDice(6, 3) <= 8) || (this.data.arrangement === 3 && rng.rollDice(6, 3) <= 6)){
	      e = GetOrbitalEccentricity(true, true, this.data.arrangement);
	      b.rMin = (1-e) * radius;
	      b.rMax = (1+e) * radius;
	      add = ConfirmRadius(b.rMin, b.rMax);
	    }
	  }
	} else {
	  if ((this.data.arrangement === 1 && rng.rollDice(6, 3) <= 15) || (this.data.arrangement > 1 && rng.rollDice(6, 3) <= 14)){
	    e = GetOrbitalEccentricity(true, false, this.data.arrangement);
	    b.rMin = (1-e) * radius;
	    b.rMax = (1+e) * radius;
	    add = ConfirmRadius(b.rMin, b.rMax);
	  }
	}

	if (add){
	  var size = GetGasGiantSize(true);
	  b.period = Math.sqrt(Math.pow(radius, 3)/this.data.mass);
	  b.body = new GasGiant({
	    seed: rng.generateUUID(),
	    parent: this,
	    sizeIndex: size
	  });
	  this.data.body.push(b);
	}

	GenerateRandomGasGiants(radius, direction, this.data.body.length, max);
      }
    }


    function GenerateRandomBodies(lastRadius, direction, current, max){
      if (current >= max){return;}
      var spacing = GetRandomOrbitalSpacing();
      var radius = (direction === 0) ? (lastRadius / spacing) : (lastRadius * spacing);
      var b = {
	avgRadius: radius,
	rMin: 0,
	rMax: 0,
	period: 0,
	body: null
      };

      var e = 0;
      var add = false;
      if (radius >= this.data.limit.innerRadius && radius <= this.data.limit.outerRadius){
	// TODO: You know... actually something important!!
	if (radius < this.data.limit.snowLine){

	} else {

	}

	GenerateRandomBodies(radius, direction, this.data.body.length, max);
      }
    }

    this.generateSystemBodies = function(maxBodies){
      maxBodies = (typeof(maxBodies) === 'number' && maxBodies >= 1) ? Math.floor(maxBodies) : Infinity;
      if (typeof(this.data.body) === 'undefined'){
	this.data.body = [];
      }
      if(this.data.arrangement > 0){
	// Generate first gas giant...
	var radius = 0;
	switch (this.data.arrangement){
	case 1:
	  radius = (1 + ((rng.rollDice(6, 2)-2)*0.05)) * this.data.limit.snowLine;
	  break;
	case 2:
	  radius = (rng.rollDice(6, 1)*0.125)*this.data.limit.snowLine;
	  break;
	case 3:
	  radius = (rng.rollDice(6, 3)*0.1)*this.data.limit.innerRadius;
	  break;
	}
	var e = GetOrbitalEccentricity(
	  true,
	  (radius < this.data.limit.snowLine),
	  this.data.arrangement
	);
	var body = new GasGiant({
	  seed: rng.generateUUID(),
	  parent: this,
	  orbitalRadius: radius
	});

	this.data.body.push({
	  avgRadius: radius,
	  rMin: (1-e) * radius,
	  rMax: (1+e) * radius,
	  period: Math.sqrt(Math.pow(radius, 3)/this.data.mass),
	  body: body
	});

	GenerateRandomGasGiants(radius, 1, this.data.body.length, maxBodies);
	GenerateRandomGasGiants(radius, 0, this.data.body.length, maxBodies);
      } else {
	GenerateRandomBodies(this.data.limit.innerRadius, 0, 0, maxBodies);
      }
    };

    this.addBody = function(body, options){
      if (!(body instanceof StellarBody)){
	throw new TypeError("Unknown/Unsupported object given");
      }
      if (body instanceof Star){
	throw new TypeError("Star instance objects not allowed as basic orbital bodies.");
      }
      if (typeof(body.parent) === 'undefined' || body.parent !== null){
	throw new Error("StellarBody instance object either does not support parenting or is already parented to another StellarBody.");
      }

      var r =0;
      var e = 0;
      var b = {
	avgRadius: 0,
	rMin: 0,
	rMax: 0,
	period: 0,
	body: null
      };

      if (body instanceof Terrestrial || body instanceof AsteroidBelt || body instanceof GasGiant){
	b.avgRadius = RadiusFromBlackbody(body.blackbody);
	if (typeof(options.radius) === 'number' && options.ignoreBlackbody === true){
	  if (options.radius > this.data.limit.innerRadius && options.radius < this.data.limit.outerRadius){
	    b.avgRadius = options.radius;
	  }
	}
	if (typeof(options.eccentricity) === 'number'){
	  e = options.eccentricity;
	  if (e < 0){
	    e = 0.0;
	  } else if (e > 0.9){
	    e = 0.9;
	  }
	} else {
	  e = GetOrbitalEccentricity(
	    (body instanceof GasGiant),
	    (r < this.data.limit.snowLine),
	    this.data.arrangement
	  );
	}

	b.rMin = (1-e) * b.avgRadius;
	b.rMax = (1+e) * b.avgRadius;
	if (ConfirmRadius(b.rMin, b.rMax) === true){
	  b.period = Math.sqrt(Math.pow(b.avgRadius, 3)/this.data.mass);
	  b.body = body;
	  if (typeof(this.data.body) === 'undefined'){
	    this.data.body = [];
	  }
	  b.body.parent = this;
	  this.data.body.push(b);
	  this.data.body.sort(function(a, b){
	    return a.avgRadius - b.avgRadius;
	  });
	  return true;
	}
      } else {
	if (typeof(options.radius) === 'number'){
	  // NOTE: This is not a StellarBody with solid rules, so, any radius over the inner limit is fine, even if it's in the
	  // forbidden or past the outter limit.
	  if (options.radius > this.data.limit.innerRadius){
	    b.avgRadius = options.radius;
	  }
	}
	if (b.avgRadius <= 0){
	  b.avgRadius = rng.value(this.data.limit.innerRadius, this.data.limit.outerRadius);
	}

	if (typeof(options.eccentricity) === 'number'){
	  e = options.eccentricity;
	  if (e < 0){
	    e = 0.0;
	  } else if (e > 0.9){
	    e = 0.9;
	  }
	} // If no eccentricity is given, assume none (0, which is default anyway).

	b.rMin = (1-e) * b.avgRadius;
	b.rMax = (1+e) * b.avgRadius;
	if (ConfirmRadius(b.rMin, b.rMax) === true){
	  if (typeof(options.period) === 'number'){
	    b.period = options.period;
	    if (b.period < 0){
	      b.period = 0;
	    }
	  } else {
	    b.period = Math.sqrt(Math.pow(b.avgRadius, 3)/this.data.mass);
	  }
	  b.body = body;
	  if (typeof(this.data.body) === 'undefined'){
	    this.data.body = [];
	  }
	  b.body.parent = this;
	  this.data.body.push(b);
	  this.data.body.sort(function(a, b){
	    return a.avgRadius - b.avgRadius;
	  });
	  return true;
	}

      }

      return false;
    };
  }
  Star.prototype.__proto__ = StellarBody.prototype;
  Star.prototype.constructor = Star;
  Star.Type = 0;

  StellarBody.RegisterType(Star);
  return Star;
});
