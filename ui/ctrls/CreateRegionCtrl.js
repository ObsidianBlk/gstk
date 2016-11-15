
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'd3',
      'kit/common/PRng',
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
	require('../../kit/common/PRng'),
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
      'GSTK.common.PRng',
      'ui.common.Emitter',
      'ui.ctrls.RangeSliderInput',
      'ui.ctrls.HoverPanelCtrl'
    ]) === false){
      throw new Error("Required component not defined.");
    }

    root.$sys.def (root, "ui.ctrls.CreateRegionCtrl", factory(
      root.d3,
      root.GSTK.common.PRng,
      root.ui.common.Emitter,
      root.ui.ctrls.RangeSliderInput,
      root.ui.ctrls.HoverPanelCtrl
    ));
  }
})(this, function (d3, PRng, Emitter, RangeSliderInput, HoverPanelCtrl) {

  function CreateRegionCtrl(dom){
    HoverPanelCtrl.call(this, dom);
    var self = this;

    var RegRadiusRange = new RangeSliderInput(d3.select("#region-radius"));
    RegRadiusRange.on("change", function(node, value){
      self.emit("regionradiuschange", node, value);
    });

    var RegDensityRange = new RangeSliderInput(d3.select("#region-density"));
    RegRadiusRange.on("change", function(node, value){
      self.emit("regiondensitychange", node, value);
    });

    Object.defineProperties(this, {
      "seed":{
	enumerable:true,
	get:function(){
	  return d3.select("#region-seed").node().value;
	},
	set:function(seed){
	  if (typeof(seed) !== 'string'){
	    throw new TypeError("Expected string value.");
	  }
	  d3.select("#region-seed").node().value = seed;
	}
      },
      
      "radius":{
	enumerable:true,
	get:function(){return RegRadiusRange.value;}
      },

      "density":{
	enumerable:true,
	get:function(){return RegDensityRange.value;}
      }
    });


    var Show = (this.show).bind(this);
    this.show = function(enable, x, y){
      if (enable === true){
	d3.select("#region-seed").node().value = PRng.GenerateUUID();
      }
      Show(enable, x, y);
    };
  }
  CreateRegionCtrl.prototype.__proto__ = HoverPanelCtrl.prototype;
  CreateRegionCtrl.prototype.constructor = CreateRegionCtrl;

  return CreateRegionCtrl;
});
