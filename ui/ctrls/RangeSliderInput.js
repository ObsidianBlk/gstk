
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'd3',
      'ui/common/Emitter'
    ], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
	require('d3'),
	require('../common/Emitter')
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
      'ui.common.Emitter'
    ]) === false){
      throw new Error("Required component not defined.");
    }

    root.$sys.def (root, "ui.ctrls.RangeSliderInput", factory(
      root.d3,
      root.ui.common.Emitter
    ));
  }
})(this, function (d3, Emitter) {

  function RangeSliderInput(dom){
    Emitter.call(this);
    var valueDispNode = d3.select(dom.node().parentNode.parentNode).select(".value");
    var self = this;
    var fixedSize = 4;
    var updateValueDisplayFuncDef = function(d3node, value){
      if (d3node.empty() === false){
	d3node.html(Number(value).toFixed(fixedSize));
      }
    };
    var updateValueDisplayFunc = updateValueDisplayFuncDef;
    
    function HandleChange(){
      var node = d3.select(this).node();
      var value = d3.select(this).node().value;
      updateValueDisplayFunc(d3.select(node.parentNode.parentNode).select(".value"), value);
      self.emit("change", this, value);
    }

    function ForceRefresh(){
      dom.node().value++;
      dom.node().value--;
      updateValueDisplayFuncDef(valueDispNode, dom.node().value);
    }

    dom.on("change", HandleChange)
      .on("input", HandleChange);

    Object.defineProperties(this, {
      "value":{
        enumerate:true,
        get:function(){return Number(dom.node().value);},
        set:function(v){
          if (typeof(v) !== 'number'){
	    throw new TypeError("Expected a number value.");
	  }
	  dom.node().value = v;
	  updateValueDisplayFuncDef(valueDispNode, v);
	  self.emit("change", dom.node(), v);
        }
      },

      "max":{
	enumerate:true,
	get:function(){return Number(dom.attr("max"));},
	set:function(m){
	  if (typeof(m) !== 'number'){
	    throw new TypeError("Expected number value.");
	  }
	  var val = Number(dom.attr("value"));
	  if (m < val){
	    dom.attr("value", m);
	  }
	  dom.attr("max", m);
	  ForceRefresh();
	}
      },

      "min":{
	enumerate:true,
	get:function(){return Number(dom.attr("min"));},
	set:function(m){
	  if (typeof(m) !== 'number'){
	    throw new TypeError("Expected number value.");
	  }
	  var val = Number(dom.attr("value"));
	  if (m > val){
	    dom.attr("value", m);
	  }
	  dom.attr("min", m);
	  ForceRefresh();
	}
      },

      "fixedSize":{
	enumerate:true,
	get:function(){return fixedSize;},
	set:function(fs){
	  if (typeof(fs) !== 'number'){
	    throw new TypeError("Expected number value.");
	  }
	  if (fs < 0){
	    throw new RangeError("Value must be zero or greater.");
	  }
	  fixedSize = fs;
	  ForceRefresh();
	}
      },

      "updateValueDisplayFunc":{
	get:function(){return updateValueDisplayFunc;},
	set:function(f){
	  if (typeof(f) === 'function'){
	    updateValueDisplayFunc = f;
	  } else if (f === null){
	    updateValueDisplayFunc = updateValueDisplayFuncDef;
	  }
	}
      }
    });
  }
  RangeSliderInput.prototype.__proto__ = Emitter.prototype;
  RangeSliderInput.prototype.constructor = RangeSliderInput;

  return RangeSliderInput;
});
