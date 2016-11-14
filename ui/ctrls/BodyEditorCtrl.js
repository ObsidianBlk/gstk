(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'd3',
      'ui/common/Emitter',
      'ui/ctrls/RangeSliderInput',
      'ui/ctrls/HoverPanelCtrl',
      'kit/space/StellarBody',
      'kit/space/Star',
      'kit/space/Terrestrial',
      'kit/space/GasGiant',
      'kit/space/AsteroidBelt'
    ], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
	require('d3'),
	require('../common/Emitter'),
	require('./RangeSliderInput'),
	require('./HoverPanelCtrl'),
	require('../../kit/space/StellarBody'),
	require('../../kit/space/Star'),
	require('../../kit/space/Terrestrial'),
	require('../../kit/space/GasGiant'),
	require('../../kit/space/AsteroidBelt')
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
      'd3',
      'ui.common.Emitter',
      'ui.ctrls.RangeSliderInput',
      'ui.ctrls.HoverPanelCtrl',
      'GSTK.space.StellarBody',
      'GSTK.space.Star',
      'GSTK.space.Terrestrial',
      'GSTK.space.GasGiant',
      'GSTK.space.AsteroidBelt'
    ]) === false){
      throw new Error("Required component not defined.");
    }

    root.$sys.def (root, "ui.ctrls.BodyEditorCtrl", factory(
      root.d3,
      root.ui.common.Emitter,
      root.ui.ctrls.RangeSliderInput,
      root.ui.ctrls.HoverPanelCtrl,
      root.GSTK.space.StellarBody,
      root.GSTK.space.Star,
      root.GSTK.space.Terrestrial,
      root.GSTK.space.GasGiant,
      root.GSTK.space.AsteroidBelt
    ));
  }
})(this, function (d3, Emitter, RangeSliderInput, HoverPanelCtrl, StellarBody, Star, Terrestrial, GasGiant, AsteroidBelt) {

  function BodyEditorCtrl(dom){
    HoverPanelCtrl.call(this, dom);
    var self = this;

    var star = null;
    var NoUpdate = false;
    var genType = 0; // 0 = Random | 1 = Gas Giant | 2 = Terrestrial | 3 = Asteroid Belt
    var terrClass = 0;

    function UpdateTerrestrialClass(){
      var makeGarden = GardenRange.value >= 1;
      terrClass = Terrestrial.GetClassFromBlackbody(TerrSizeRange.value, BlackbodyRange.value, makeGarden, 0);
      var orbPeriod = star.bodyOrbitalPeriodFromRadius(OrbitRange.value) * 365; // Convert earth years to earth days.
      PeriodRange.max = orbPeriod;
      var drng = Terrestrial.GetDensityRange(TerrSizeRange.value, terrClass);
      DiameterRange.min = drng.min;
      DiameterRange.max = drng.max;
      self.set({terrclass: Terrestrial.ClassToName(terrClass)});
    }

    function UpdateGGMassDensityRanges(){
      var rng = GasGiant.MassDensityRangeFromIndexAndSize(
	GGMassIndexRange.value,
	GGSizeRange.value
      );
      GGMassRange.min = rng.massMin;
      GGMassRange.max = rng.massMax;
      GGDensityRange.min = rng.densityMin;
      GGDensityRange.max = rng.densityMax;
    }

    var OrbitRange = new RangeSliderInput(d3.select("#body-orbit"));
    OrbitRange.on("change", function(node, value){
      self.emit("orbitradiuschange", node, value);
      if (NoUpdate === false){
	if (star !== null){
	  NoUpdate = true;
	  BlackbodyRange.value = star.blackbodyFromOrbitRadius(Number(value));
	}
      } else {
	NoUpdate = false;
      }
      UpdateTerrestrialClass();
    });

    var EccentricityRange = new RangeSliderInput(d3.select("#body-oecc"));
    EccentricityRange.on("change", function(node, value){
      self.emit("orbiteccentricitychange", node, value);
    });

    var BlackbodyRange = new RangeSliderInput(d3.select("#body-blackbody"));
    BlackbodyRange.on("change", function(node, value){
      self.emit("blackbodychange", node, value);
      if (NoUpdate === false){
	if (star !== null){
	  NoUpdate = true;
	  OrbitRange.value = star.orbitRadiusFromBlackbody(Number(value));
	  console.log(OrbitRange.value);
	}
      } else {
	NoUpdate = false;
      }
      UpdateTerrestrialClass();
    });

    var TerrSizeRange = new RangeSliderInput(d3.select("#body-terrsize"));
    TerrSizeRange.updateValueDisplayFunc = function(d3node, value){
      if (d3node.empty() === false){
	d3node.html(Terrestrial.SizeToName(Number(value)));
      }
    };
    TerrSizeRange.on("change", function(node, value){
      self.emit("terrestrialsizechange", node, value);
      UpdateTerrestrialClass();
    });

    var DiameterRange = new RangeSliderInput(d3.select("#body-diameter"));
    DiameterRange.on("change", function(node, value){
      self.emit("diameterchange", node, value);
    });

    var AtmmassRange = new RangeSliderInput(d3.select("#body-atmmass"));
    AtmmassRange.on("change", function(node, value){
      self.emit("atmmasschange", node, value);
    });

    var HydroRange = new RangeSliderInput(d3.select("#body-hydro"));
    HydroRange.on("change", function(node, value){
      self.emit("hydrographicchange", node, value);
    });

    var PeriodRange = new RangeSliderInput(d3.select("#body-period"));
    PeriodRange.on("change", function(node, value){
      self.emit("rotperiodchange", node, value);
    });

    var AxisRange = new RangeSliderInput(d3.select("#body-axis"));
    AxisRange.on("change", function(node, value){
      self.emit("axischange", node, value);
    });

    var GardenRange = new RangeSliderInput(d3.select("#body-garden"));
    GardenRange.on("change", function(node, value){
      self.emit("gardenchange", node, value);
      UpdateTerrestrialClass();
    });

    var AstSizeRange = new RangeSliderInput(d3.select("#ast-size"));
    AstSizeRange.on("change", function(node, value){
      self.emit("asteroidsizechange", node, value);
      self.set({astsize: AsteroidBelt.SizeToName(Number(value))});
    });

    var ResourceIndexRange = new RangeSliderInput(d3.select("#resourceindex"));
    ResourceIndexRange.on("change", function(node, value){
      self.emit("resourceindexchange", node, value);
      var v = Number(value);
      if (v >= 0 && v < StellarBody.Table.ResourceValueTable.length){
	self.set({resourcedesc: StellarBody.Table.ResourceValueTable[v].desc});
      } else {
	self.set({resourcedesc: "UNKNOWN"});
      }
    });

    var GGSizeRange = new RangeSliderInput(d3.select("#gg-size"));
    GGSizeRange.on("change", function(node, value){
      self.emit("gasgiantsizechange", node, value);
      var v = Number(value);
      if (v === 0){
	self.set({ggsize: "Small"});
      } else if (v === 1){
	self.set({ggsize: "Standard"});
      } else if (v === 2){
	self.set({ggsize: "Large"});
      } else {
	self.set({ggsize: "UNKNOWN"});
      }
      UpdateGGMassDensityRanges();
    });

    var GGMassIndexRange = new RangeSliderInput(d3.select("#gg-mdindex"));
    GGMassIndexRange.on("change", function(node, value){
      self.emit("gasgiantmassindexchange", node, value);
      UpdateGGMassDensityRanges();
    });

    var GGMassRange = new RangeSliderInput(d3.select("#gg-mass"));
    GGMassIndexRange.on("change", function(node, value){
      self.emit("gasgiantmasschange", node, value);
    });

    var GGDensityRange = new RangeSliderInput(d3.select("#gg-density"));
    GGMassIndexRange.on("change", function(node, value){
      self.emit("gasgiantdensitychange", node, value);
    });

    this.on("tab-genrandom", function(){
      genType = 0;
      self.showSection("basiceditor", true, true);
    });

    this.on("tab-gengasgiant", function(){
      genType = 1;
      self.showSection(["basiceditor", "gasgianteditor", "orientationeditor"], true, true);
    });

    this.on("tab-genterrestrial", function(){
      genType = 2;
      self.showSection(["basiceditor", "terrestrialeditor", "orientationeditor", "resourceeditor"], true, true);
    });

    this.on("tab-genasteroidbelt", function(){
      genType = 3;
      self.showSection(["basiceditor", "asteroideditor", "resourceeditor"], true, true);
    });

    Object.defineProperties(this, {
      "bodyName":{
	enumerable:true,
	get:function(){
	  var value = d3.select("#body-name").node().value;
	  if (value.length <= 0){
	    value = null;
	  }
	  return value;
	}
      },

      "star":{
	enumerable:true,
	get:function(){return star;},
	set:function(s){
	  if (s === null){
	    star = null;
	  } else if (s instanceof Star){
	    star = s;
	    OrbitRange.min = star.limit.innerRadius;
	    OrbitRange.max = star.limit.outerRadius;
	    OrbitRange.value = star.limit.innerRadius;

	    BlackbodyRange.max = star.blackbodyFromOrbitRadius(star.limit.innerRadius);
	    BlackbodyRange.min = star.blackbodyFromOrbitRadius(star.limit.outerRadius);
	    BlackbodyRange.value = BlackbodyRange.max;
	  }
	}
      },

      "orbitalRadius":{
	enumerable:true,
	get:function(){return OrbitRange.value;}
      },

      "orbitalEccentricity":{
	enumerable:true,
	get:function(){return EccentricityRange.value;}
      },

      "terrestrialConfig":{
	enumerable:true,
	get:function(){
	  var ops = {
	    size: TerrSizeRange.value,
	    class: terrClass,
	    diameter: DiameterRange.value,
	    hydrographicPercent: HydroRange.value,
	    atmmass: AtmmassRange.value,
	    rotationPeriod: PeriodRange.value,
	    axialTile: AxisRange.value,
	    resourceIndex: ResourceIndexRange.value
	  };
	  var name = this.bodyName;
	  if (name !== null){
	    ops.name = name;
	  }
	  return ops;
	}
      },

      "asteroidBeltConfig":{
	enumerable:true,
	get:function(){
	  var ops = {
	    resourceIndex: ResourceIndexRange.value,
	    size: AstSizeRange.value
	  };
	  var name = this.bodyName;
	  if (name !== null){
	    ops.name = name;
	  }
	  return ops;
	}
      },

      "gasGiantConfig":{
	enumerable:true,
	get:function(){
	  var ops = {
	    size: GGSizeRange.value,
	    mass: GGMassRange.value,
	    density: GGDensityRange.value,
	    rotationPeriod: PeriodRange.value,
	    axialTile: AxisRange.value
	  };
	  var name = this.bodyName;
	  if (name !== null){
	    ops.name = name;
	  }
	  return ops;
	}
      },

      "blackbody":{
	enumerable:true,
	get:function(){return BlackbodyRange.value;}
      },

      "terrestrialClass":{
	enumerable:true,
	get:function(){return terrClass;}
      },

      "terrestrialSize":{
	enumerable:true,
	get:function(){return TerrSizeRange.value;}
      },

      "terrestrialDiameter":{
	enumerable:true,
	get:function(){return DiameterRange.value;}
      },

      "hydrographics":{
	enumerable:true,
	get:function(){return HydroRange.value;}
      },

      "atmosphericMass":{
	enumerable:true,
	get:function(){return AtmmassRange.value;}
      },

      "generationType":{
	enumerable:true,
	get:function(){return genType;}
      }
    });
  }
  BodyEditorCtrl.prototype.__proto__ = HoverPanelCtrl.prototype;
  BodyEditorCtrl.prototype.constructor = BodyEditorCtrl;

  return BodyEditorCtrl;
});
