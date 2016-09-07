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
    var bgLayer = scroller.append("g");
    var fzLayer = scroller.append("g");
    var snowlineLayer = scroller.append("g");
    var goldielocksLayer = scroller.append("g");
    var starLayer = scroller.append("g");
    var planetLayer = scroller.append("g");

    var star = null;
    var mapSize = 1;
    var hmapSize = 1;
    var mapScale = d3.scale.linear().domain([0,1]).range([0,1]);
    var starScale = d3.scale.linear().domain([0.01, 0.5]).range([4, 6]);
    var bodyScale = d3.scale.linear().domain([0.1, 20]).range([2, 4]);

    var renderScale = 1.0;
    var renderOffset = {x:DOMEventNotifier.getWidth()*0.5, y:DOMEventNotifier.getHeight()*0.5};
    var renderRadius = 0;
    var showSnowline = false;
    var showForbiddenZone = false;
    var showGoldielocks = false;

    var axis = null;
    var xAxis = d3.svg.axis().scale(mapScale);
    var yAxis = d3.svg.axis().scale(mapScale).orient("right");

    var scaleGridPos = [0, 0];

    var showOrbitCursor = false;
    var ocursorRadius = 0;
    var ocursorEccentricity = 0;

    var selectedBody = null;

    var starEvents = {
      mouseOver:null,
      mouseOut:null,
      clicked:null
    };

    var bodyEvents = {
      mouseOver:null,
      mouseOut:null,
      clicked:null
    };


    var self = this;
    function zoomed() {
      var nscale = d3.event.scale;
      if (renderScale !== nscale){
	var oldRadius = mapScale(renderRadius)*(1/renderScale);
	renderScale = nscale;
	renderRadius = star.fullSystemRadius*renderScale;
	UpdateMapScale();
	var newRadius = mapScale(renderRadius)*(1/renderScale);

	var offscale = ((d3.event.sourceEvent.clientX - renderOffset.x)/oldRadius);
	renderOffset.x = d3.event.sourceEvent.clientX - (newRadius*offscale);
	offscale = ((d3.event.sourceEvent.clientY - renderOffset.y)/oldRadius);
	renderOffset.y = d3.event.sourceEvent.clientY - (newRadius*offscale);
      }

      renderOffset.x += d3.event.sourceEvent.movementX;
      renderOffset.y += d3.event.sourceEvent.movementY;

      scroller.attr("transform", "translate(" + renderOffset.x + ", " + renderOffset.y + ")");
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
	    ocursorRadius = star.limit.innerRadius;
	    selectedBody = null;
	    var minExtent = star.limit.innerRadius/star.fullSystemRadius;
	    //minExtent = (minExtent >= 0.0001) ? minExtent : 0.0001;
	    zoom.scaleExtent([minExtent, 1]);
	    if (star.fullSystemRadius < renderRadius || renderRadius === 0){
	      renderRadius = star.fullSystemRadius;
	      renderScale = 1.0;
	      zoom.scale(1.0);
	    }
	  }
	  UpdateMapScale();
	}
      },

      "onBodyMouseOver":{
        enumerate:true,
        get:function(){return bodyEvents.mouseOver;},
        set:function(f){
          if ((typeof(f) === 'function' || f === null) && f !== bodyEvents.mouseOver){
            bodyEvents.mouseOver = f;
          }
        }
      },

      "onBodyMouseOut":{
        enumerate:true,
        get:function(){return bodyEvents.mouseOut;},
        set:function(f){
          if ((typeof(f) === 'function' || f === null) && f !== bodyEvents.mouseOut){
            bodyEvents.mouseOut = f;
          }
        }
      },

      "onBodyClicked":{
        enumerate:true,
        get:function(){return bodyEvents.clicked;},
        set:function(f){
          if ((typeof(f) === 'function' || f === null) && f !== bodyEvents.clicked){
            bodyEvents.clicked = f;
          }
        }
      },

      "onStarMouseOver":{
        enumerate:true,
        get:function(){return bodyEvents.mouseOver;},
        set:function(f){
          if ((typeof(f) === 'function' || f === null) && f !== bodyEvents.mouseOver){
            starEvents.mouseOver = f;
          }
        }
      },

      "onStarMouseOut":{
        enumerate:true,
        get:function(){return bodyEvents.mouseOut;},
        set:function(f){
          if ((typeof(f) === 'function' || f === null) && f !== bodyEvents.mouseOut){
            starEvents.mouseOut = f;
          }
        }
      },

      "onStarClicked":{
        enumerate:true,
        get:function(){return bodyEvents.clicked;},
        set:function(f){
          if ((typeof(f) === 'function' || f === null) && f !== bodyEvents.clicked){
            starEvents.clicked = f;
          }
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
      },

      "selectBody":{
	enumerate:true,
	get:function(){return selectedBody;},
	set:function(i){
	  if (typeof(i) === 'number'){
	    if (star !== null){
	      if (i >= 0 && i < star.bodyCount){
		selectedBody = i;
	      }
	    }
	  } else if (i === null){

	  } else {
	    throw new TypeError("Expected number value or null.");
	  }
	}
      },

      "orbitCursorRadius":{
	enumerate: true,
	get:function(){return ocursorRadius;},
	set:function(r){
	  if (typeof(r) !== 'number'){
	    throw new TypeError("Expected number value.");
	  }
	  if (r < 0){
	    throw new RangeError("Value must be zero or greater.");
	  }
	  if (star !== null){
	    if (r < star.limit.innerRadius){
	      ocursorRadius = star.limit.innerRadius;
	    } else if (r > star.limit.outerRadius){
	      ocursorRadius = star.limit.outerRadius;
	    } else {
	      ocursorRadius = r;
	    }
	  } else {
	    ocursorRadius = r;
	  }
	}
      },

      "orbitCursorEccentricity":{
	enumerate: true,
	get:function(){return ocursorEccentricity;},
	set:function(e){
	  if (typeof(e) !== 'number'){
	    throw new TypeError("Expected number value.");
	  }
	  if (e < 0 || e > 0.95){
	    throw new RangeError("Value out of range.");
	  }
	  ocursorEccentricity = e;
	}
      },

      "showOrbitCursor":{
	enumerate:true,
	get:function(){return showOrbitCursor;},
	set:function(e){
	  if (typeof(e) !== 'boolean'){
	    throw new TypeError("Expected boolean value.");
	  }
	  showOrbitCursor = e;
	  if (star !== null){
	    ocursorRadius = star.limit.innerRadius;
	    ocursorEccentricity = 0;
	  }
	}
      },

      "showSnowline":{
	enumerate: true,
	get:function(){return showSnowline;},
	set:function(e){
	  if (typeof(e) !== 'boolean'){
	    throw new TypeError("Expected boolean value.");
	  }
	  showSnowline = e;
	}
      },

      "showForbiddenZone":{
	enumerate:true,
	get:function(){return showForbiddenZone;},
	set:function(e){
	  if (typeof(e) !== 'boolean'){
	    throw new TypeError("Expected boolean value.");
	  }
	  showForbiddenZone = e;
	}
      },

      "showGoldielocks":{
	enumerate:true,
	get:function(){return showGoldielocks;},
	set:function(e){
	  if (typeof(e) !== 'boolean'){
	    throw new TypeError("Expected boolean value.");
	  }
	  showGoldielocks = e;
	}
      }
    });

    function UpdateScaleGrid(){
      if (axis !== null){
	axis.select("#xaxis").call(xAxis);
	axis.select("#yaxis").call(yAxis);
      }
    }

    function RenderOrbits(orbit, objs, clsname, noCircle){
      noCircle = (noCircle === true) ? true : false;
      var group = planetLayer.append("g")
	.attr("class", clsname)
	.attr("transform", "translate(" + mapScale(0) + ", " + mapScale(orbit.rMax) + ")");

      var ellipses = group.selectAll("ellipse")
	.data(objs).enter()
	.append("ellipse")
	.attr("rx", function(d){
	  return mapScale(d.rMin);
	})
	.attr("ry", function(d){
	  return mapScale(d.rMax);
	});
      if (bodyEvents.mouseOver){
	ellipses.on("mouseover", bodyEvents.mouseOver);
      }
      if (bodyEvents.mouseOut){
	ellipses.on("mouseout", bodyEvents.mouseOut);
      }
      if (bodyEvents.click){
	ellipses.on("click", bodyEvents.click);
      }

      if (noCircle === false){
	var circles = group.selectAll("circle")
	  .data(objs).enter()
	  .append("circle")
	  .attr("cy", function(d){
	    return mapScale(d.rMax);
	  })
	  .attr("r", function(d){
	    return bodyScale(d.body.diameter);
	  });

	if (bodyEvents.mouseOver){
	  circles.on("mouseover", bodyEvents.mouseOver);
	}
	if (bodyEvents.mouseOut){
	  circles.on("mouseout", bodyEvents.mouseOut);
	}
	if (bodyEvents.click){
	  circles.on("click", bodyEvents.click);
	}
      }
    }

    function RenderStar(cdata, g){
      var s = cdata.body;
      var orbit = (typeof(cdata.orbit) !=='undefined') ? cdata.orbit : null;
      var fz = (typeof(cdata.forbiddenZone) !== 'undefined') ? cdata.forbiddenZone : null;

      var arc = null;
      // NOTE: We only want to render the snowline for the primary star
      // TODO: Perhaps there can be a method for selecting which star to render the snowline around?
      if (showSnowline === true && orbit === null){
	arc = d3.svg.arc()
	  .innerRadius(mapScale(s.limit.snowLine))
	  .outerRadius(mapScale(s.fullSystemRadius))
	  .startAngle(0)
	  .endAngle(360*(Math.PI/180));
	snowlineLayer.append("path")
	  .attr("d", arc)
	  .attr("fill", "#007")
	  .attr("stroke", "none")
	  .attr("opacity", 0.25);
      }

      var gl = null;
      if (showGoldielocks === true){
	gl = s.goldielocks;
	arc = d3.svg.arc()
	  .innerRadius(mapScale(gl.min))
	  .outerRadius(mapScale(gl.max))
	  .startAngle(0)
	  .endAngle(360*(Math.PI/180));
	goldielocksLayer.append("g")
	  .attr("transform", "translate(" + mapScale(0) + ", " + mapScale((orbit !== null) ? orbit.rMax : 0) + ")")
	  .append("path")
	  .attr("d", arc)
	  .attr("fill", "#070")
	  .attr("stroke", "none")
	  .attr("opacity", 0.25);
      }

      if (showForbiddenZone === true && fz !== null){
	for (var i=0; i < star.companionCount; i++){
	  arc = d3.svg.arc()
	    .innerRadius(mapScale(fz.innerRadius))
	    .outerRadius(mapScale(fz.outerRadius))
	    .startAngle(0)
	    .endAngle(360*(Math.PI/180));
	  var path = fzLayer.append("path")
	    .attr("d", arc)
	    .attr("fill", "#700")
	    .attr("stroke", "none")
	    .attr("opacity", 0.25);
	}
      }

      g.attr("class", "star " + s.sequence.substring(0, 1));
      if (orbit !== null){
	g.append("ellipse")
	  .attr("cx", mapScale(0))
	  .attr("cy", mapScale(0))
	  .attr("rx", mapScale(orbit.rMin))
	  .attr("ry", mapScale(orbit.rMax));
      } else {
	orbit = {rMin: 0, rMax: 0};
      }

      g.append("circle")
	.attr("cy", mapScale(orbit.rMax))
	.attr("r", starScale(s.radius));
      if (starEvents.mouseOver){
	g.on("mouseover", function(){starEvents.mouseOver(s);});
      }
      if (starEvents.mouseOut){
	g.on("mouseout", starEvents.mouseOut);
      }
      if (starEvents.click){
	g.on("click", function(){starEvents.click(s);});
      }

      if (s.hasBodiesOfType(Terrestrial.Type)){
	RenderOrbits(orbit, s.getBodiesOfType(Terrestrial.Type), "orbit-terrestrial");
      }

      if (s.hasBodiesOfType(GasGiant.Type)){
	RenderOrbits(orbit, s.getBodiesOfType(GasGiant.Type), "orbit-gasgiant");
      }

      if (s.hasBodiesOfType(AsteroidBelt.Type)){
	RenderOrbits(orbit, s.getBodiesOfType(AsteroidBelt.Type), "orbit-asteroids", true);
      }
    }

    this.render = function(options){
      if (star === null){return;}

      svg.call(zoom);
      //scroller.selectAll("*").remove();
      bgLayer.selectAll("*").remove();
      fzLayer.selectAll("*").remove();
      snowlineLayer.selectAll("*").remove();
      goldielocksLayer.selectAll("*").remove();
      starLayer.selectAll("*").remove();
      planetLayer.selectAll("*").remove();
      
      bgLayer.append("circle")
	.attr("r", mapScale(star.fullSystemRadius))
	.attr("stroke", "#9F0")
	.attr("stroke-width", "2")
	.attr("fill", "#000");

      var primary = starLayer.append("g")
	.attr("transform", "translate(" + mapScale(0) + ", " + mapScale(0) + ")");
      RenderStar({body:star}, primary);

      if (star.companionCount > 0){
	var companions = star.companions;
	for (var i=0; i < star.companionCount; i++){
	  var cdata = companions[i];
	  var surf = starLayer.append("g");
	  RenderStar(cdata, surf);
	}
      }

      if (showOrbitCursor === true){
	var ocolor = (star.orbitRadiusAllowed(ocursorRadius, ocursorEccentricity) === true) ? "#0F0" : "#F00";
	var rmin = (1-ocursorEccentricity) * ocursorRadius;
	var rmax = (1+ocursorEccentricity) * ocursorRadius;
	planetLayer.append("ellipse")
	  .attr("rx", mapScale(rmin))
	  .attr("ry", mapScale(rmax))
	  .attr("fill", "none")
	  .attr("stroke", ocolor)
	  .attr("stroke-width", 2);
	planetLayer.append("circle")
	  .attr("cy", mapScale(rmax))
	  .attr("r", mapScale(6))
	  .attr("fill", ocolor)
	  .attr("stroke", "none");
      }
    };

    this.scaleGridPosition = function(x, y){
      scaleGridPos[0] = x;
      scaleGridPos[1] = y;
      if (axis !== null){
	axis.attr("transform", "translate(" + scaleGridPos[0] + ", " + scaleGridPos[1] + ")");
      }
    };

    this.resetZoom = function(){
      zoom.scale(1);
      zoom.translate([DOMEventNotifier.getWidth()*0.5, DOMEventNotifier.getHeight()*0.5]);
      renderScale = 1.0;
      renderRadius = star.fullSystemRadius;
    };
  }
  StarView.prototype.constructor = StarView;

  return StarView;
});
