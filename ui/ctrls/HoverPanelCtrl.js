
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'ui/common/Emitter',
      'ui/common/DOMEventNotifier'
    ], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
	require('../common/Emitter'),
	require('../common/DOMEventNotifier')
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
      'ui.common.Emitter',
      'ui.common.DOMEventNotifier'
    ]) === false){
      throw new Error("Required component not defined.");
    }

    root.$sys.def (root, "ui.ctrls.HoverPanelCtrl", factory(
      root.ui.common.Emitter,
      root.ui.common.DOMEventNotifier
    ));
  }
})(this, function (Emitter, DOMEventNotifier) {

  function HoverPanelCtrl(dom){
    Emitter.call(this);
    if (dom.classed("hoverPanel") === false){
      throw new Error("Element does not contain required class");
    }
    var BTNEvents = [];

    function onMenuLink(){
      d3.select(this).selectAll("a").each(function(){
	var parent = d3.select(this.parentNode.parentNode);
	var isTab = parent.classed("tabs");
	var a = d3.select(this);
	var event = a.attr("id");
	BTNEvents.push((isTab === true) ? "tab-" + event : event);
	a.on("click", (function(ename){
	  return function(){
	    if (isTab === false || a.classed("selected") === false){
	      parent.selectAll(".selected").classed("selected", false);
	      a.classed("selected", true);
	      self.emit((isTab === true) ? "tab-" + ename : ename);
	    }
	  };
	})(event));
      });
    }

    var self = this;
    (function(){
      dom.selectAll("ul.menu").each(onMenuLink);
      dom.selectAll("ul.hmenu").each(onMenuLink);
    })();

    DOMEventNotifier.on("resize", function(width, height){
      self.position(lastPosition[0], lastPosition[1], lastPosition[2]);
    });

    var lastPosition = [0, 0, false];
    var posOffsetX = 0;
    var posOffsetY = 0;
    var stickyEdge = 0x0000;
    var stickyFlipEnabled = true; // If true, the sticky edge will flip if entity overlaps mouse position.

    Object.defineProperties(this, {
      "offsetX":{
	enumerate: true,
	get:function(){return posOffsetX;},
	set:function(ox){
	  if (typeof(ox) !== 'number'){
	    throw new TypeError("Value expected to be a number.");
	  }
	  posOffsetX = Math.floor(ox);
	}
      },

      "offsetY":{
	enumerate: true,
	get:function(){return posOffsetY;},
	set:function(oy){
	  if (typeof(oy) !== 'number'){
	    throw new TypeError("Value expected to be a number.");
	  }
	  posOffsetY = Math.floor(oy);
	}
      },

      "edge":{
	enumerate: true,
	get:function(){return stickyEdge;},
	set:function(se){
	  if (typeof(se) !== 'number'){
	    throw new TypeError("Value expected to be a number.");
	  } else if (se < 0 || se > 0x1111){
	    throw new RangeError("Value out of bounds.");
	  }
	  stickyEdge = se;
	}
      },

      "flipEdge":{
	enumerate: true,
	get:function(){return stickyFlipEnabled;},
	set:function(e){
	  if (typeof(e) !== 'boolean'){
	    throw new TypeError("Value expected to be boolean.");
	  }
	  stickyFlipEnabled = e;
	}
      },

      "events":{
	enumerate: true,
	get:function(){return BTNEvents;}
      }
    });

    this.set = function(name_or_dict, value){
      if (typeof(name_or_dict) === typeof({})){
	Object.keys(name_or_dict).forEach((function(key){
	  this.set(key, name_or_dict[key]);
	}).bind(this));
      } else {
	var item = dom.selectAll("#" + name_or_dict);
	if (item.empty() === false){
	  item.html(value);
	}
      }
    };

    this.position = function(x, y, ignoreEdges){
      var rect = dom.node().getBoundingClientRect();
      var dwidth = DOMEventNotifier.getWidth();
      var dheight = DOMEventNotifier.getHeight();
      var _x = dwidth - rect.width;
      var _y = dheight - rect.height;
      ignoreEdges = (ignoreEdges === true) ? true : false;

      lastPosition[0] = x;
      lastPosition[1] = y;
      lastPosition[2] = ignoreEdges;

      x += posOffsetX;
      y += posOffsetY;

      if (ignoreEdges !== true){
	if (stickyEdge > 0){
	  if ((stickyEdge & HoverPanelCtrl.Edge.HCenter) === HoverPanelCtrl.Edge.HCenter){
	    x =  Math.floor((dwidth*0.5) - (rect.width*0.5));
	  } else {
	    if ((stickyEdge & HoverPanelCtrl.Edge.Left) !== 0){
	      x = (stickyFlipEnabled === true && x < rect.width && x < _x) ? _x : 0;
	    } else if ((stickyEdge & HoverPanelCtrl.Edge.Right) !== 0){
	      x = (stickyFlipEnabled === true && x > _x && x < rect.width) ? 0 : _x;
	    }
	  }

	  if ((stickyEdge & HoverPanelCtrl.Edge.VCenter) === HoverPanelCtrl.Edge.VCenter){
	    y = Math.floor((dheight*0.5) - (rect.height*0.5));
	  } else {
	    if ((stickyEdge & HoverPanelCtrl.Edge.Top) !== 0){
	      y = (stickyFlipEnabled === true && y < rect.height && y < _y) ? _y : 0;
	    } else if ((stickyEdge & HoverPanelCtrl.Edge.Bottom) !== 0){
	      y = (stickyFlipEnabled === true && y > _y && y < rect.height) ? 0 : _y;
	    }
	  }
	}
      }

      if (x < 0){
	x = 0;
      } else if (x > _x){
	x = _x;
      }

      if (y < 0){
	y = 0;
      } else if (y > _y){
	y = _y;
      }

      dom.style("left", x + "px");
      dom.style("top", y + "px");
    };

    this.show = function(enable, x, y){
      enable = (enable === false) ? false : true;
      if (enable && dom.classed("hidden")){
	dom.classed("hidden", false);
	this.position(
	  (typeof(x) === 'number') ? x : 0,
	  (typeof(y) === 'number') ? y : 0
	);
      } else if (enable === false && dom.classed("hidden") === false){
	dom.classed("hidden", true);
      }
    };

    this.showSection = function(secname, enable, hideOthers){
      enable = (enable === false) ? false : true;
      hideOthers = (hideOthers === true) ? true : false; // NOTE: hideOthers is used only when enabling other sections.

      // If secname is an array, it's assumed to be an array of section names, and all of those sections will be shown or hidden as requested.
      if (secname instanceof Array){
	if (enable === true && hideOthers === true){
	  dom.selectAll(".section").classed("hidden", true);
	}
	for (var i=0; i < secname.length; i++){
	  this.showSection(secname[i], enable, false);
	}
      } else if (typeof(secname) === 'string'){ // The secname is a string
	if (secname === "*"){ // If secname is "*" (wildcard for everything), enable or hide all!
	  dom.selectAll(".section").classed("hidden", !enable);
	} else { // secname is a named section and will enable/disable the section as desired.
	  var sec = dom.select(".section." +secname);
	  if (sec.empty() === false){ // Check to see if we have a section of the given name.
	    if (enable === true){
	      if (sec.classed("hidden") === true){
		if (hideOthers === true){
		  dom.selectAll(".section").classed("hidden", true);
		}
		sec.classed("hidden", false);
		if (dom.classed("hidden") === false){
		  var rect = dom.node().getBoundingClientRect();
		  this.position(rect.x, rect.y);
		}
	      }
	    } else if (sec.classed("hidden") === false){
	      sec.classed("hidden", true);
	    }
	  }
	}
      }
    };

    this.showing = function(){
      return (dom.classed("hidden") === false);
    };

    this.sectionShowing = function(secname){
      var sec = dom.select(".section." +secname);
      if (sec.empty() === false){
	return !sec.classed("hidden");
      }
      return false;
    };
  }
  HoverPanelCtrl.prototype.__proto__ = Emitter.prototype;
  HoverPanelCtrl.prototype.constructor = HoverPanelCtrl;
  HoverPanelCtrl.Edge = {
    Left: 0x1000,
    Right: 0x0100,
    Top: 0x0010,
    Bottom: 0x0001,
    // Shorthands...
    HCenter: 0x1100,
    VCenter: 0x0011,
    Center: 0x1111
  };


  return HoverPanelCtrl;
});
