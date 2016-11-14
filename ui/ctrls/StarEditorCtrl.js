
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'd3',
      'ui/common/Emitter',
      'ui/ctrls/RangeSliderInput',
      'ui/ctrls/HoverPanelCtrl'
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
	require('./HoverPanelCtrl')
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
      'ui.ctrls.HoverPanelCtrl'
    ]) === false){
      throw new Error("Required component not defined.");
    }

    root.$sys.def (root, "ui.ctrls.StarEditorCtrl", factory(
      root.d3,
      root.ui.common.Emitter,
      root.ui.ctrls.RangeSliderInput,
      root.ui.ctrls.HoverPanelCtrl
    ));
  }
})(this, function (d3, Emitter, RangeSliderInput, HoverPanelCtrl) {

  function StarEditorCtrl(dom){
    HoverPanelCtrl.call(this, dom);
    var self = this;

    var usingConfig = false;
    var config = {
      arrangement: 0,
      companions: 0,
      maxBodies: 0
    };

    var AngleRange = new RangeSliderInput(d3.select("#region-cursor-angle"));
    AngleRange.on("change", function(node, value){
      self.emit("regionanglechange", node, value);
    });

    var RadiusRange = new RangeSliderInput(d3.select("#region-cursor-radius"));
    RadiusRange.on("change", function(node, value){
      self.emit("regionradiuschange", node, value);
    });

    var AgeRange = new RangeSliderInput(d3.select("#star-age"));
    AgeRange.on("change", function(node, value){
      config.age = Number(value);
      self.emit("staragechange", node, value);
    });

    var MassRange = new RangeSliderInput(d3.select("#star-mass"));
    MassRange.on("change", function(node, value){
      config.mass = Number(value);
      self.emit("starmasschange", node, value);
    });

    var CompanionRange = new RangeSliderInput(d3.select("#star-companions"));
    CompanionRange.on("change", function(node, value){
      config.companions = Number(value);
      self.emit("starcompanionschange", node, value);
    });

    var BodiesRange = new RangeSliderInput(d3.select("#star-bodies"));
    BodiesRange.on("change", function(node, value){
      config.maxBodies = Number(value);
      self.emit("starbodieschange", node, value);
    });

    var ArrangementRange = new RangeSliderInput(d3.select("#star-arrangement"));
    ArrangementRange.on("change", function(node, value){
      config.arrangement = Number(value);
      self.emit("stararrangementchange", node, value);
    });

    this.on("tab-genrandom", function(){
      usingConfig = false;
      self.showSection("fulleditor", false);
    });

    this.on("tab-gencustom", function(){
      usingConfig = true;
      self.showSection("fulleditor", true);
    });

    Object.defineProperties(this, {
      "maxRegionRadius":{
	enumerable: true,
	get:function(){return RadiusRange.max;},
	set:function(r){
	  if (typeof(r) !== 'number'){
	    throw new TypeError("Expected a number value.");
	  }
	  if (r <= 0){
	    throw new RangeError();
	  }
	  RadiusRange.value = 0;
	  RadiusRange.max = r;
	}
      },

      "regionRadius":{
	enumerable:true,
	get:function(){return RadiusRange.value;},
	set:function(r){
	  if (typeof(r) !== 'number'){
	    throw new TypeError("Expected a number value.");
	  }
	  if (r <= 0 || r > RadiusRange.max){
	    throw new RangeError();
	  }
	  RadiusRange.value = r;
	}
      },

      "regionAngle":{
	enumerable:true,
	get:function(){return AngleRange.value;},
	set:function(ang){
	  if (typeof(ang) !== 'number'){
	    throw new TypeError("Expected a number value.");
	  }
	  ang = (ang >= 0) ? ang%360.0 : 360 - (ang%360);
	  AngleRange.value = ang;
	}
      },

      "starName":{
	enumerable:true,
	get:function(){
	  var value = d3.select("#star-name").node().value;
	  if (value.length <= 0){
	    value = null;
	  }
	  return value;
	}
      },

      "starConfig":{
	enumerable:true,
	get:function(){
	  if (usingConfig === true){
	    var sname = d3.select("#star-name").node().value;
	    if (sname.length <= 0){
	      delete config.name;
	    } else {
	      config.name = sname;
	    }
	    return config;
	  }
	  return null;
	}
      }
    });


    this.reset = function(){
      RadiusRange.value = 0;
      AngleRange.value = 0;
    };
  }
  StarEditorCtrl.prototype.__proto__ = HoverPanelCtrl.prototype;
  StarEditorCtrl.prototype.constructor = StarEditorCtrl;

  return StarEditorCtrl;
  
});
