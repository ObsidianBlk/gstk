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

    root.GSTK.$.def (root.GSTK, "space.GasGiant", factory(
      root.GSTK.PRng,
      root.tv4,
      root.GSTK.space.StellarBody
    ));
  }
})(this, function (PRng, tv4, StellarBody) {

  var GasGiantSchema = {
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "object",
    "properties": {
      "_type": {"type": "integer"},
      "axialTilt": {"type": "integer"},
      "density": {"type": "number"},
      "diameter": {"type": "number"},
      "mass": {"type": "number"},
      "name": {"type": "string"},
      "rotationalPeriod": {"type": "number"},
      "size": {"type": "integer"},
      "surfaceGravity": {"type": "number"},
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
            "body": {"type": "object"}
          },
          "required": [
            "orbit",
            "companion"
          ]
	}
      }
    },
    "required": [
      "axialTilt",
      "density",
      "diameter",
      "mass",
      "name",
      "rotationalPeriod",
      "size",
      "surfaceGravity",
      "_type"
    ]
  };


  function GetGGMassDensityVariance(rng, roll){
    var index = 0;
    switch(roll){
    case 9: case 10:
      index = 1; break;
    case 11:
      index = 2; break;
    case 12:
      index = 3; break;
    case 13:
      index = 4; break;
    case 14:
      index = 5; break;
    case 15:
      index = 6; break;
    case 16:
      index = 7; break;
    }
    if (roll >= 17){index = 8;}

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

    var ent = StellarBody.Table.GGMassDensityTable[index];
    return {
      Smass: ent.Smass + smdiff,
      Sdensity: ent.Sdensity + (ent.Sdensity*densityDiff),
      Mmass: ent.Mmass + mmdiff,
      Mdensity: ent.Mdensity + (ent.Mdensity*densityDiff),
      Lmass: ent.Lmass + lmdiff,
      Ldensity: ent.Ldensity + (ent.Ldensity*densityDiff)
    };
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

  function GetRotationalPeriod(rng, size){
    var roll = rng.rollDice(6, 3);
    var Adjust = function(){
      roll += (size === 1) ? 6 : 0;
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


  function SetSize(body, rng, options){
    options = (typeof(options) === typeof({})) ? options : {};

    if (typeof(options.sizeIndex) === 'number' || typeof(options.size) === 'number'){
      if (typeof(options.size) === 'number'){
	body.size = Math.floor(options.size);
      } else {
	body.size = Math.floor(options.sizeIndex);
	if (body.size < 0){
	  body.size = 0;
	} else if (body.size > 2){
	  body.size = 2;
	}
      }
    } else {
      body.size = rng.rollDice(6, 3);
      if (typeof(options.contentModifier) === 'number'){
	body.size += options.contentModifier;
      }
    }

    if (body.size > 2){
      if (body.size <= 10){
	body.size = 0;
      } else if (body.size > 10 && body.size <= 16){
	body.size = 1;
      } else {
	body.size = 2;
      }
    }

    var ggmd = GetGGMassDensityVariance(rng, rng.rollDice(6,3));
    var diff = diff = (ggmd.Lmass - ggmd.Mmass)*0.45; // Both medium and large use the same variance.
    var subd = 0;
    switch(body.size){
    case 0:
      diff = (ggmd.Mmass - ggmd.Smass)*0.45; // Small uses a slightly different variance.
      body.mass = ggmd.Smass + rng.value(-diff, diff);
      subd = ggmd.Sdensity*0.1;
      body.density = ggmd.Sdensity + rng.value(-subd, subd);
      break;
    case 1:
      body.mass = ggmd.Mmass + rng.value(-diff, diff);
      subd = ggmd.Mdensity*0.1;
      body.density = ggmd.Mdensity + rng.value(-subd, subd);
      break;
    case 2:
      body.mass = ggmd.Lmass + rng.value(-diff, diff);
      subd = ggmd.Ldensity*0.1;
      body.density = ggmd.Ldensity + rng.value(-subd, subd);
      break;
    }

    body.diameter = Math.cbrt(body.mass / body.density);
    body.surfaceGravity = body.diameter * body.density;
  }


  function Generate(body, rng, options){
    SetSize(body, rng, options);
    body.rotationalPeriod = GetRotationalPeriod(rng, body.size);
    body.axialTilt = GetAxialTilt(rng);
  }


  function GasGiant(options){
    StellarBody.call(this);
    this.schema = GasGiantSchema;
    this.data._type = GasGiant.Type;
    options = (typeof(options) === typeof({})) ? options : {};

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
      "sizeIndex":{
	enumerate: true,
	get:function(){return this.data.size;},
	set:function(index){
	  if (index < 0 || index > 2){
	    throw new RangeError("Invalid size index.");
	  }
	  SetSize(this.data, rng, {sizeIndex:index});
	}
      },

      "size":{
	enumerate: true,
	get:function(){
	  switch(this.data.size){
	  case 0:
	    return "Small";
	  case 1:
	    return "Medium";
	  case 2:
	    return "Large";
	  }
	  return "UNKNOWN";
	}
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

      "companionCount":{
	enumerate:true,
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

    var _from = this.from;
    this.from = function(str_or_obj){
      try{
	_from(str_or_obj);
      } catch (e){throw e;}

      // TODO: Do stuff to handle moons... like check if there're companions.
    };
  }
  GasGiant.prototype.__proto__ = StellarBody.prototype;
  GasGiant.prototype.constructor = GasGiant;
  GasGiant.Type = 1;


  StellarBody.RegisterType(GasGiant);
  return GasGiant;
});
