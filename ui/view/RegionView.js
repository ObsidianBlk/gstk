(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'd3',
      'ui/common/Emitter',
      'ui/common/DOMEventNotifier',
      'kit/space/Region'
    ], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
	require('d3'),
	require('../common/Emitter'),
	require('../common/DOMEventNotifier'),
	require('../../kit/space/Region')
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
      "ui.common.Emitter",
      "ui.common.DOMEventNotifier",
      "GSTK.space.Region"
    ]) === false){
      throw new Error("Required component not defined.");
    }

    root.$sys.def (root, "ui.view.RegionView", factory(
      root.d3,
      root.ui.common.Emitter,
      root.ui.common.DOMEventNotifier,
      root.GSTK.space.Region
    ));
  }
})(this, function (d3, Emitter, DOMEventNotifier, Region) {

  var AU = Number("1.496e8");

  function RegionView(svg){
    Emitter.call(this);
    var self = this;
    
    var scroller = svg.append("g");
    var mapSize = 1;
    var hmapSize = 1;
    var mapScale = d3.scale.linear().domain([0,1]).range([0,1]);
    var starScale = d3.scale.linear()
      .domain([0, 0.01*AU])
      .range([1.0, 6.0]);
    var displayMode = 0; // All stars in region.
    var r = null;

    var selected = null;

    var showStarPlacerCursor = false;
    var placerCursorPos = [0, 0, 0];

    function zoomed() {
      var x = d3.event.translate[0];
      var y = d3.event.translate[1];
      scroller.attr("transform", "translate(" + x + ", " + y + ")scale(" + d3.event.scale + ")");
    }
    var zoom = d3.behavior.zoom()
      .scaleExtent([0.25, 4])
      .on("zoom", zoomed);
    zoom.translate([DOMEventNotifier.getWidth()*0.5, DOMEventNotifier.getHeight()*0.5]);
    scroller.attr("transform", "translate(" + (DOMEventNotifier.getWidth()*0.5) + ", " + (DOMEventNotifier.getHeight()*0.5) + ")");

    Object.defineProperties(this, {
      "mapSize":{
	enumerate:true,
	get:function(){return mapSize;},
	set:function(size){
	  if (typeof(size) === 'number' && size > 0){
	    mapSize = size;
	    hmapSize = Math.round(mapSize*0.5);
	    if (r !== null){
	      mapScale.domain([0, r.radius]).range([0, hmapSize]);
	    } else {
	      mapScale.domain([0, 1]).range([0, hmapSize]);
	    }
	  }
	}
      },

      "displayMode":{
        enumerate:true,
        get:function(){return displayMode;},
        set:function(mode){
          if (typeof(mode) !== 'number'){
            throw new TypeError("Expected a number.");
          }
          mode = Math.floor(mode);
          for (var i=0; i < RegionView.DISPLAY_TYPES.length; i++){
            var type = RegionView.DISPLAY_TYPES[i];
            if (RegionView.DISPLAY_INFO[type] === mode){
              displayMode = mode;
              return;
            }
          }

          throw new RangeError("Unknown display mode.");
        }
      },

      "mapScale":{
	enumerate:true,
	get:function(){return mapScale;}
      },

      "starScale":{
	enumerate:true,
	get:function(){return starScale;}
      },

      "region":{
	enumerate:true,
	get:function(){return r;},
	set:function(reg){
	  if (reg !== null && !(reg instanceof Region)){
	    throw new TypeError("Expected a Region instance or null.");
	  }
	  r = reg;
	}
      },

      "select":{
	enumerate: true,
	get:function(){return (selected !== null) ? {r:selected.r, a:selected.a} : null;},
	set:function(s){
	  if (s !== null && typeof(s) !== typeof({})){
	    throw new TypeError("Expected null or object value.");
	  }
	  if (s !== null && typeof(s.r) === 'number' && typeof(s.a) === 'number'){
	    if (selected === null || selected.r !== s.r || selected.a !== s.a){
	      selected = {r: s.r, a:s.a};
	      this.render();
	    }
	  } else if (selected !== null){
	    selected = null;
	    this.render();
	  }
	}
      },

      "showPlacerCursor":{
	enumerate: true,
	get:function(){return showStarPlacerCursor;},
	set:function(e){
	  if (typeof(e) !== 'boolean'){
	    throw new TypeError("Value expected to be boolean.");
	  }
	  showStarPlacerCursor = e;
	}
      },

      "placerCursorRadius":{
	enumerate:true,
	get:function(){return placerCursorPos[0];},
	set:function(rad){
	  if (typeof(rad) !== 'number'){
	    throw new TypeError("Value expected to be a number.");
	  }
	  if (rad < 0 || rad > r.radius){
	    throw new RangeError("Value out of bounds");
	  }
	  placerCursorPos[0] = rad;
	}
      },

      "placerCursorAngle":{
	enumerate:true,
	get:function(){return placerCursorPos[1];},
	set:function(ang){
	  if (typeof(ang) !== 'number'){
	    throw new TypeError("Value expected to be a number.");
	  }
	  if (ang < 0){
	    while (ang < 0){
	      ang += 360.0;
	    }
	  } else if (ang > 360.0){
	    while (ang > 360.0){
	      ang -= 360.0;
	    }
	  }
	  placerCursorPos[1] = ang;
	}
      },

      "placerCursor":{
	enumerate:true,
	get:function(){
	  return {
	    radius: placerCursorPos[0],
	    angle: placerCursorPos[1],
	    z: placerCursorPos[2]
	  };
	},
	set:function(pc){
	  if (typeof(pc) === typeof({})){
	    if (typeof(pc.radius) === 'number'){
	      if (pc.radius < 0 || pc.radius > r.radius){
		throw new RangeError("Value out of bounds");
	      }
	      placerCursorPos[0] = pc.radius;
	    }

	    if (typeof(pc.angle) === 'number'){
	      if (pc.angle < 0){
		while (pc.angle < 0){
		  pc.angle += 360.0;
		}
	      } else if (pc.angle > 360.0){
		while (pc.angle > 360.0){
		  pc.angle -= 360.0;
		}
	      }
	      placerCursorPos[1] = pc.angle;
	    }

	    if (typeof(pc.z) === 'number'){
	      placerCursorPos[2] = pc.z;
	    }
	  }
	}
      }
    });


    this.render = function(options){
      if (r === null){return;}
      var CompassRange = d3.range(0, 360, 30);
      mapScale.domain([0, r.radius]).range([0, hmapSize]);

      svg.call(zoom);
      scroller.selectAll("*").remove();
      var data = null;
      switch (displayMode){
      case 0:
        data = r.systems; break;
      case 1:
        data = r.emptySystems; break;
      case 2:
        data = r.nonEmptySystems; break;
      case 3:
        data = r.terrestrialSystems; break;
      case 4:
        data = r.habitableSystems; break;
      case 5:
	data = r.asteroidSystems; break;
      }
	
      scroller.append("circle")
	.attr("r", mapScale(r.radius))
	.attr("stroke", "none")
	.attr("fill", "#000000");

      var stars = scroller.append("g");
      // Rendering stars
      var starGroups = stars.selectAll("g")
	.data(data)
	.enter()
	.append("g")
	.attr("class", function(d){
	  return "star " + d.star.sequence.substring(0, 1);
	})
	.attr("transform", function(d){
	  var x = mapScale(d.r*Math.cos(d.a));
	  var y = mapScale(d.r*Math.sin(d.a));
	  return "translate(" + x + ", " + y + ")";
	});

      starGroups.append("circle")
	.attr("id", function(d, i){
	  return "circle_" + i;
	})
	.attr("r", function(d){
	  if (selected === null || selected.r !== d.r || selected.a !== d.a){
	    return starScale(d.star.radius*AU);
	  } else {
	    return starScale(0.01*AU); // This is a selected star!
	  }
	})
	.on("mouseover", function(d, i){
	  self.emit("starover", d, i, d3.event);
	})
	.on("mouseout", function(d, i){
	  self.emit("starout", d, i, d3.event);
	})
	.on("click", function(d, i){
	  self.emit("starclick", d, i, d3.event);
	});

      
      if (selected !== null){
	var x = mapScale(selected.r*Math.cos(selected.a));
	var y = mapScale(selected.r*Math.sin(selected.a));
	stars.append("circle")
	  .attr("id", "STAR_SELECTOR")
	  .attr("r", mapScale(3))
	  .attr("fill", "none")
	  .attr("stroke", "#F00")
	  .attr("strokeWidth", 0.5)
	  .attr("transform", "translate(" + x + ", " + y + ")");
      }

      if (showStarPlacerCursor === true){
	var cursor = scroller.append("g");
	var cr = placerCursorPos[0];
	var ca = placerCursorPos[1]*(Math.PI/180);
	var color = (r.canPlaceStar(cr, ca, placerCursorPos[2]) === true) ? "#0F0" : "#F00";

	cursor.append("circle")
	  .attr("r", mapScale(cr))
	  .attr("fill", "none")
	  .attr("stroke", color)
	  .attr("stroke-width", 1);

	var cx = mapScale(cr*Math.cos(ca));
	var cy = mapScale(cr*Math.sin(ca));

	cursor.append("circle")
	  .attr("cx", cx).attr("cy", cy)
	  .attr("r", mapScale(0.25))
	  .attr("fill", color)
	  .attr("stroke", "none");

	cursor.append("circle")
	  .attr("cx", cx).attr("cy", cy)
	  .attr("r", mapScale(3))
	  .attr("fill", "none")
	  .attr("stroke", "#FA0")
	  .attr("stroke-width", 2);
      }

      var rangeOverlay = scroller.append("g").attr("class", "range-axis");
      rangeOverlay.selectAll("circle")
	.data(d3.range(0, r.radius+1, 3))
	.enter()
	.append("circle")
	.attr("r", function(d){return mapScale(d);});

      var a = rangeOverlay.selectAll("g")
	.data(CompassRange)
	.enter().append("g")
	.attr("class", "range-axis")
	.attr("transform", function(d) { return "rotate(" + d + ")"; });
      a.append("line")
	.attr("x1", mapScale(1))
	.attr("x2", mapScale(r.radius));
      a.append("text")
	.attr("x", mapScale(r.radius + 1))
	.attr("dy", ".35em")
	.style("text-anchor", function(d) { return d < 270 && d > 90 ? "end" : null; })
	.attr("transform", function(d) { return d < 270 && d > 90 ? "rotate(180 " + mapScale(r.radius + 1) + ", 0)" : null; })
	.text(function(d) { return d + "°"; });
    };
  }
  RegionView.prototype.__proto__ = Emitter.prototype;
  RegionView.prototype.constructor = RegionView;
  RegionView.DISPLAY_INFO = {
    "ALL": 0,
    "NOBODIES": 1,
    "BODIES": 2,
    "TERRESTRIAL": 3,
    "BREATHABLE": 4,
    "ASTEROIDS": 5
  };
  RegionView.DISPLAY_TYPES = Object.keys(RegionView.DISPLAY_INFO);

  return RegionView;
});
