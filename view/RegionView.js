(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'kit/Emitter',
      'kit/DOMEventNotifier',
      'kit/space/Region'
    ], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
	require('../kit/Emitter'),
	require('../kit/DOMEventNotifier'),
	require('../kit/space/Region')
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

    if (root.GSTK.$.exists(root, ["GSTK.Emitter",
				  "GSTK.DOMEventNotifier",
				  "GSTK.space.Region"
				 ]) === false){
      throw new Error("Required component not defined.");
    }

    if (typeof(root.View) !== typeof({})){
      root.View = {};
    }

    root.GSTK.$.def (root.GSTK, "View.RegionView", factory(
      root.GSTK.Emitter,
      root.GSTK.DOMEventNotifier,
      root.GSTK.space.Region
    ));
  }
})(this, function (Emitter, DOMEventNotifier, Region) {

  var AU = Number("1.496e8");

  function RegionView(d3, svg){

    var scroller = svg.append("g");
    var mapSize = 1;
    var hmapSize = 1;
    var mapScale = d3.scale.linear().domain([0,1]).range([0,1]);
    var starScale = d3.scale.linear()
      .domain([0, 0.01*AU])
      .range([1.0, 6.0]);
    var displayMode = 0; // All stars in region.
    var r = null;

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

      if (typeof(options.mouseOver) === 'function'){
	starGroups.on("mouseover", options.mouseOver);
      }
      if (typeof(options.mouseOut) === 'function'){ 
	starGroups.on("mouseout", options.mouseOut);
      }
      if (typeof(options.click) === 'function'){
	starGroups.on("click", options.click);
      }

      starGroups.append("circle")
	.attr("id", function(d, i){
	  return "circle_" + i;
	})
	.attr("r", function(d){
	  return starScale(d.star.radius*AU);
	});

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
