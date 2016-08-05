(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'kit/Emitter',
      'kit/DOMEventNotifier',
      'kit/space/Star',
      'kit/space/StellarBody',
      'kit/space/GasGiant',
      'kit/space/Terrestrial',
      'kit/space/AsteroidBelt'
    ], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
	require('../kit/Emitter'),
	require('../kit/DOMEventNotifier'),
	require('../kit/space/Star'),
	require('../kit/space/StellarBody'),
	require('../kit/space/GasGiant'),
	require('../kit/space/Terrestrial'),
	require('../kit/space/AsteroidBelt')
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
				  "GSTK.space.Star",
				  "GSTK.space.StellarBody",
				  "GSTK.space.GasGiant",
				  "GSTK.space.Terrestrial",
				  "GSTK.space.AsteroidBelt"
				 ]) === false){
      throw new Error("Required component not defined.");
    }

    if (typeof(root.View) !== typeof({})){
      root.View = {};
    }

    root.GSTK.$.def (root.GSTK, "View.RegionView", factory(
      root.GSTK.Emitter,
      root.GSTK.DOMEventNotifier,
      root.GSTK.space.Star,
      root.GSTK.space.StellarBody,
      root.GSTK.space.GasGiant,
      root.GSTK.space.Terrestrial,
      root.GSTK.space.AsteroidBelt
    ));
  }
})(this, function (Emitter, DOMEventNotifier, Star, StellarBody, GasGiant, Terrestrial, AsteroidBelt) {

  function StarView(d3, svg){
    var scroller = svg.append("g");
    var star = null;
    var mapSize = 1;
    var hmapSize = 1;
    var mapScale = d3.scale.linear().domain([0,1]).range([0,1]);
    var starScale = d3.scale.linear().domain([0.01, 0.5]).range([4, 6]);
    var bodyScale = d3.scale.linear().domain([0.1, 20]).range([2, 4]);

    var renderScale = 1.0;
    var renderRadius = 0;

    var axis = null;
    var xAxis = d3.svg.axis().scale(mapScale);
    var yAxis = d3.svg.axis().scale(mapScale).orient("right");

    var scaleGridPos = [0, 0];


    var self = this;
    function zoomed() {
      var x = d3.event.translate[0];
      var y = d3.event.translate[1];

      renderScale = d3.event.scale;
      renderRadius = star.fullSystemRadius*renderScale;
      var buff = Math.max(1, Math.round(renderRadius*0.1));
      UpdateMapScale();

      scroller.attr("transform", "translate(" + x + ", " + y + ")");
      self.render();
    }
    var zoom = d3.behavior.zoom()
      .scaleExtent([0.25, 1])
      .on("zoom", zoomed);
    zoom.translate([DOMEventNotifier.getWidth()*0.5, DOMEventNotifier.getHeight()*0.5]);
    scroller.attr("transform", "translate(" + (DOMEventNotifier.getWidth()*0.5) + ", " + (DOMEventNotifier.getHeight()*0.5) + ")");

    function UpdateMapScale(){
      var radius = (star !== null) ? renderRadius : 1;
      mapScale.domain([0, radius]).range([0, hmapSize]);
      UpdateScaleGrid();
    }

    Object.defineProperties(this, {
      "star":{
	enumerate:true,
	get:function(){return star;},
	set:function(s){
	  if (s !== null && !(s instanceof Star)){
	    throw new TypeError("Expected Star instance or null.");
	  }
	  if (s !== null){
	    if (s.parent !== null){
	      s = s.parent;
	    }
	  }
	  star = s;
	  if (star !== null){
	    zoom.scaleExtent([1/star.fullSystemRadius, 1]);
	    if (star.fullSystemRadius < renderRadius || renderRadius === 0){
	      renderRadius = star.fullSystemRadius;
	      renderScale = 1.0;
	      zoom.scale(1.0);
	    }
	  }
	  UpdateMapScale();
	}
      },

      "mapSize":{
	enumerate:true,
	get:function(){return mapSize;},
	set:function(size){
	  if (typeof(size) === 'number' && size > 0){
	    mapSize = size;
	    hmapSize = Math.round(mapSize*0.5);
	    UpdateMapScale();
	  }
	}
      },

      "scaleGridShowing":{
	enumerate:true,
	get:function(){return (axis !== null);},
	set:function(enable){
	  if (enable === false && axis !== null){
	    axis.remove();
	    axis = null;
	  } else if (axis === null){
	    axis = svg.append("g")
	      .attr("id", "axis")
	      .attr("class", "grid")
	      .attr("transform", "translate(" + scaleGridPos[0] + ", " + scaleGridPos[1] + ")");
	    axis.append("g").attr("id", "xaxis").call(xAxis);
	    axis.append("g").attr("id", "yaxis").call(yAxis);
	  }
	}
      }
    });

    function UpdateScaleGrid(){
      if (axis !== null){
	axis.select("#xaxis").call(xAxis);
	axis.select("#yaxis").call(yAxis);
      }
    }

    function RenderOrbits(g, objs, clsname, noCircle){
      noCircle = (noCircle === true) ? true : false;
      var group = g.append("g").attr("class", clsname);
      group.selectAll("ellipse")
	.data(objs).enter()
	.append("ellipse")
	.attr("rx", function(d){
	  return mapScale(d.rMin);
	})
	.attr("ry", function(d){
	  return mapScale(d.rMax);
	});

      if (noCircle === false){
	group.selectAll("circle")
	  .data(objs).enter()
	  .append("circle")
	  .attr("cy", function(d){
	    return mapScale(d.rMax);
	  })
	  .attr("r", function(d){
	    return bodyScale(d.body.diameter);
	  });
      }
    }

    function RenderStar(s, g){
      g.append("g")
	.attr("class", "star " + s.sequence.substring(0, 1))
	.append("circle")
	.attr("r", starScale(s.radius));

      if (s.hasBodiesOfType(Terrestrial.Type)){
	RenderOrbits(g, s.getBodiesOfType(Terrestrial.Type), "orbit-terrestrial");
      }

      if (s.hasBodiesOfType(GasGiant.Type)){
	RenderOrbits(g, s.getBodiesOfType(GasGiant.Type), "orbit-gasgiant");
      }

      if (s.hasBodiesOfType(AsteroidBelt.Type)){
	RenderOrbits(g, s.getBodiesOfType(AsteroidBelt.Type), "orbit-asteroids", true);
      }
    }

    this.render = function(options){
      if (star === null){return;}

      svg.call(zoom);
      scroller.selectAll("*").remove();
      
      scroller.append("circle")
	.attr("r", mapScale(star.fullSystemRadius))
	.attr("stroke", "none")
	.attr("fill", "#000");
      scroller.append("circle")
	.attr("r", mapScale(star.fullSystemRadius))
	.attr("stroke", "#9F0")
	.attr("stroke-wdith", "2")
	.attr("fill", "none");

      var primary = scroller.append("g")
	.attr("transform", "translate(" + mapScale(0) + ", " + mapScale(0) + ")");
      RenderStar(star, primary);

      if (star.companionCount > 0){
	var companions = star.companions;
	for (var i=0; i < star.companionCount; i++){
	  var cdata = companions[i];
	  scroller.append("ellipse")
	    .attr("cx", mapScale(0))
	    .attr("cy", mapScale(0))
	    .attr("rx", mapScale(cdata.orbit.rMin))
	    .attr("ry", mapScale(cdata.orbit.rMax))
	    .attr("fill", "none")
	    .attr("stroke", "#FFDD00")
	    .attr("stroke-width", 1);
	  var surf = scroller.append("g")
	    .attr("transform", "translate(" + mapScale(0) + ", " + mapScale(cdata.orbit.rMax) + ")");
	  RenderStar(cdata.body, surf);
	}
      }
    };

    this.scaleGridPosition = function(x, y){
      scaleGridPos[0] = x;
      scaleGridPos[1] = y;
      if (axis !== null){
	axis.attr("transform", "translate(" + scaleGridPos[0] + ", " + scaleGridPos[1] + ")");
      }
    };
  }
  StarView.prototype.constructor = StarView;

  return StarView;
});
