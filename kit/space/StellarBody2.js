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


  StellarBody.Convert = {
    E2Miles: 3959, // "Earths" to miles
    E2KM: 6371 // "Earths" to Kilometers.
  };

  StellarBody.Table = {
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

});
