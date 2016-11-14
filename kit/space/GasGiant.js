(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'kit/common/PRng',
      'node_modules/tv4/tv4',
      'kit/space/StellarBody'
    ], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
	require('../common/PRng'),
	require('tv4'),
	require('./StellarBody')
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
      "GSTK.space.StellarBody"
    ]) === false){
      throw new Error("Required component not defined.");
    }

    root.$sys.def (root, "GSTK.space.GasGiant", factory(
      root.GSTK.common.PRng,
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
      "blackbody": {"type": "number"},
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
      "blackbody",
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

    if (typeof(options.mass) === 'number' && options.mass > 0 && typeof(options.density) === 'number' && options.density > 0){
      body.mass = options.mass;
      body.density = options.density;
    } else {
      var ggmd = GetGGMassDensityVariance(rng, rng.rollDice(6,3));
      var diff = diff = (ggmd.Lmass - ggmd.Mmass)*0.45; // Both medium and large use the same variance.
      var subd = 0;
      switch(body.size){
      case 0:
	diff = (ggmd.Mmass - ggmd.Smass)*0.45; // Small uses a slightly different variance.
	body.mass = ggmd.Smass + rng.value(0, diff);
	subd = ggmd.Sdensity*0.1;
	body.density = ggmd.Sdensity + rng.value(-subd, subd);
	break;
      case 1:
	body.mass = ggmd.Mmass + rng.value(0, diff);
	subd = ggmd.Mdensity*0.1;
	body.density = ggmd.Mdensity + rng.value(-subd, subd);
	break;
      case 2:
	body.mass = ggmd.Lmass + rng.value(0, diff);
	subd = ggmd.Ldensity*0.1;
	body.density = ggmd.Ldensity + rng.value(-subd, subd);
	break;
      }
    }

    body.diameter = Math.cbrt(body.mass / body.density);
    body.surfaceGravity = body.diameter * body.density;
  }


  function Generate(body, rng, options){
    SetSize(body, rng, options);
    body.rotationalPeriod = (typeof(options.rotationPeriod) === 'number' && options.rotationPeriod > 0) ?
      options.rotationPeriod : 
      GetRotationalPeriod(rng, body.size);
    body.axialTilt = (typeof(options.axialTilt) === 'number' && options.axialTilt >= 0 && options.axialTilt <= 90) ?
      options.axialTile :
      GetAxialTilt(rng);

    if (typeof(options.blackbody) === 'number' && options.blackbody >= 0){
      body.blackbody = options.blackbody;
    } else if (typeof(options.parent) !== 'undefined' && typeof(options.parent.luminosity) === 'number' && typeof(options.orbitalRadius) === 'number'){
      var l = options.parent.luminosity;
      var r = options.orbitalRadius;
      body.blackbody = 278*(Math.pow(l, 0.25)/Math.sqrt(r));
    } else if (typeof(options.blackbody) === 'number'){
      body.blackbody = options.blackbody;
    } else {
      // NOTE: GURPS Space does not have (that I saw) any information about calculating Gas Giant blackbody values (in a total random way). As such
      // blackbody is a random value between 30k and 140k, which roughly fits the blackbody values of the Jovian planets in the Sol system.
      // (as given by GURPS Space on page 124)
      body.blackbody = rng.value(30, 140);
    }
  }


  function GasGiant(options){
    StellarBody.call(this);
    this.schema = GasGiantSchema;
    this.data._type = GasGiant.Type;
    options = (typeof(options) === typeof({})) ? options : {};

    var parent = (options.parent instanceof StellarBody) ? options.parent : null;

    var rng = new PRng({
      seed:(typeof(options.seed) !== 'undefined') ? 
	options.seed : 
	Math.random().toString(), 
      initDepth:5000});


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
	enumerable: true,
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
	enumerable: true,
	get:function(){return this.data.size;},
	set:function(index){
	  if (index < 0 || index > 2){
	    throw new RangeError("Invalid size index.");
	  }
	  SetSize(this.data, rng, {sizeIndex:index});
	}
      },

      "size":{
	enumerable: true,
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

      "blackbody":{
	enumerable: true,
	get:function(){return this.data.blackbody;}
      },

      "mass":{
        enumerable: true,
        get:function(){return this.data.mass;}
      },

      "density":{
        enumerable: true,
        get:function(){return this.data.density;}
      },

      "diameter":{
        enumerable: true,
        get:function(){return this.data.diameter;}
      },

      "diameterMiles":{
        enumerable: true,
        get:function(){return this.data.diameter*(StellarBody.Convert.E2Mile*2);}
      },

      "diameterKM":{
        enumerable: true,
        get:function(){return this.data.diameter*(StellarBody.Convert.E2KM*2);}
      },

      "surfaceGravity":{
        enumerable: true,
        get:function(){return this.data.surfaceGravity;}
      },

      "rotationalPeriod":{
        enumerable: true,
        get:function(){return this.data.rotationalPeriod;}
      },

      "axialTilt":{
        enumerable: true,
        get:function(){return this.data.axialTilt;}
      },

      "companionCount":{
	enumerable:true,
	get:function(){return (typeof(this.data.companion) !== 'undefined') ? this.data.companion.length : 0;}
      },

      "companions":{
	enumerable:true,
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

    if (typeof(options.from) === 'string' || typeof(options.from) === typeof({})){
      this.from(options.from);
    } else {
      Generate(this.data, rng, options);
      this.name = (typeof(options.name) === 'string') ? options.name : rng.generateUUID();
    }
  }
  GasGiant.prototype.__proto__ = StellarBody.prototype;
  GasGiant.prototype.constructor = GasGiant;
  GasGiant.Type = 1;

  GasGiant.MassDensityRangeFromIndexAndSize = function(index, size){
    index = Math.max(0, Math.min(8, index));
    size = Math.max(0, Math.min(2, size));

    var ent = StellarBody.Table.GGMassDensityTable[index];
    var res = {};
    switch (size){
    case 0:
      res.massMin = ent.Smass - ((index <= 1) ? 2.5 : 5);
      res.massMax = ent.Smass + ((index <= 1) ? 2.5 : 5);
      res.densityMin = ent.Sdensity - (0.1*ent.Sdensity);
      res.densityMax = ent.Sdensity + (0.1*ent.Sdensity);
      break;
    case 1:
      res.massMin = ent.Mmass - 25;
      res.massMax = ent.Mmass + 25;
      res.densityMin = ent.Mdensity - (0.1*ent.Mdensity);
      res.densityMax = ent.Mdensity + (0.1*ent.Mdensity);
      break;
    case 2:
      res.massMin = ent.Lmass - ((index <= 1) ? 100 : 250);
      res.massMax = ent.Lmass + ((index <= 1) ? 100 : 250);
      res.densityMin = ent.Ldensity - (0.1*ent.Ldensity);
      res.densityMax = ent.Ldensity + (0.1*ent.Ldensity);
      break;
    }
    return res;
  };

  GasGiant.ValidateData = function(data){
    if (typeof(data) === 'string'){
      try{
	data = JSON.parse(data);
      } catch (e) {
	return false;
      }
    } 

    if (typeof(data) === typeof({})){
      if (tv4.validate(data, GasGiantSchema) === true){
	return true;
      }
    }
    return false;
  };

  StellarBody.RegisterType(GasGiant);
  return GasGiant;
});
