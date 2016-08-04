(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'kit/PRng',
      'node_modules/tv4/tv4'
    ], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
	require('../PRng'),
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
      "tv4"
    ]) === false){
      throw new Error("Required component not defined.");
    }

    root.GSTK.$.def (root.GSTK, "space.StellarBody", factory(
      root.GSTK.PRng,
      root.tv4
    ));
  }
})(this, function (PRng, tv4) {

  var REGISTERED_CLASS = {};


  function StellarBody(){
    var data = {name:""};
    var loadSchema = null;

    Object.defineProperties(this, {
      "name":{
	enumerate: true,
	get:function(){return data.name;},
	set:function(name){
	  if (typeof(name) !== 'string'){throw new TypeError("Expected string.");}
	  data.name = name;
	}
      },

      "type":{
	enumerate: true,
	get:function(){
	  return (typeof(data._type) === 'number') ? data._type : -1;
	}
      },

      "data":{
	enumerate: true,
	get:function(){return data;}
      },

      "schema":{
	enumerate: true,
	get:function(){return loadSchema;},
	set:function(schema){
	  if (typeof(schema) === typeof({}) && loadSchema === null){
	    loadSchema = JSON.parse(JSON.stringify(schema));
	  }
	}
      }
    });

    this.toString = function(pretty){
      if (pretty === true){
	return JSON.stringify(data, null, 2);
      }
      return JSON.stringify(data);
    };

    this.from = function(str_or_obj){
      if (loadSchema !== null){
      var body = null;
	try{
	  if (typeof(str_or_obj) === typeof({})){
	    body = JSON.parse(JSON.stringify(str_or_obj));
	  } else {
	    body = JSON.parse(str_or_obj);
	  }
	} catch (e) {
	  console.error("Failed to parse JSON from string.");
	  throw e;
	}

	if (tv4.validate(body, loadSchema) === false){
	  console.error(tv4.error);
	  throw new Error("Failed to match Schema.");
	}

	data = body;
      }
    };
  };
  StellarBody.prototype.constructor = StellarBody;

  StellarBody.RegisterType = function(cls){
    if (cls.prototype.__proto__ === StellarBody.prototype && typeof(cls.Type) !== 'undefined'){
      if (!(cls.Type in REGISTERED_CLASS)){
	REGISTERED_CLASS[cls.Type] = cls;
      }
    }
  };

  StellarBody.BuildType = function(type, options){
    if (type in REGISTERED_CLASS){
      return new REGISTERED_CLASS[type](options);
    }
    console.error("No StellarBody Class with type '" + type + "'.");
    return null;
  };

  StellarBody.Convert = {
    AU2Mile: Number("9.296e+7"), // AUs to Miles
    AU2KM: Number("1.496e+8"), // AUs to Kilometers.
    E2Miles: 3959, // "Earths" radius to miles
    E2KM: 6371 // "Earths" radius to Kilometers.
  };

  StellarBody.Table = {
    StellarEvolutionTable: [
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
    ],

    ResourceValueTable: [
      {desc: "worthless", mod: -5},
      {desc: "very scant", mod: -4},
      {desc: "scant", mod: -3},
      {desc: "very poor", mod: -2},
      {desc: "poor", mod: -1},
      {desc: "average", mod: 0},
      {desc: "abundant", mod: 1},
      {desc: "very abundant", mod: 2},
      {desc: "rich", mod: 3},
      {desc: "very rich", mod: 4},
      {desc: "motherlode", mod: 5}
    ],

    GGMassDensityTable: [ // [Page S115]
      {Smass: 10, Sdensity: 0.42, Mmass: 100, Mdensity: 0.18, Lmass: 600, Ldensity:0.31},
      {Smass: 15, Sdensity: 0.26, Mmass: 150, Mdensity: 0.19, Lmass: 800, Ldensity:0.35},
      {Smass: 20, Sdensity: 0.22, Mmass: 200, Mdensity: 0.20, Lmass: 1000, Ldensity:0.4},
      {Smass: 30, Sdensity: 0.19, Mmass: 250, Mdensity: 0.22, Lmass: 1500, Ldensity:0.6},
      {Smass: 40, Sdensity: 0.17, Mmass: 300, Mdensity: 0.24, Lmass: 2000, Ldensity:0.8},
      {Smass: 50, Sdensity: 0.17, Mmass: 350, Mdensity: 0.25, Lmass: 2500, Ldensity:1.0},
      {Smass: 60, Sdensity: 0.17, Mmass: 400, Mdensity: 0.26, Lmass: 3000, Ldensity:1.2},
      {Smass: 70, Sdensity: 0.17, Mmass: 450, Mdensity: 0.27, Lmass: 3500, Ldensity:1.4},
      {Smass: 80, Sdensity: 0.17, Mmass: 500, Mdensity: 0.29, Lmass: 4000, Ldensity:1.6},
    ],

    TemperatureScaleTable: [
      {Kmin: 140, Kmax:500, step: 24}, // 0
      {Kmin: 80, Kmax: 140, step: 4}, // 1
      {Kmin: 50, Kmax: 80, step: 2}, // 2
      {Kmin: 140, Kmax: 215, step: 5}, // 3
      {Kmin: 80, Kmax: 230, step: 10}, // 4
      {Kmin: 250, Kmax: 340, step: 6}, // 5
      {Kmin: 500, Kmax: 950, step: 30}, // 6
    ],

    TerrestrialClassTable: [
      "Rock", // 0
      "Ice", // 1
      "Ocean", // 2
      "Garden", // 3
      "Greenhouse", // 4
      "Hadean", // 5
      "Chthonian", // 6
      "Sulfur", // 7
      "Ammonia" // 8
    ],

    TerrestrialSizeClassTable: [
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
    ]
  };



  return StellarBody;
});
