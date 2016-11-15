(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'ui/common/Emitter',
      'ui/common/DOMEventNotifier',
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
	require('../common/Emitter'),
	require('../common/DOMEventNotifier'),
	require('../../kit/space/Star'),
	require('../../kit/space/StellarBody'),
	require('../../kit/space/GasGiant'),
	require('../../kit/space/Terrestrial'),
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
      "ui.common.Emitter",
      "ui.common.DOMEventNotifier",
      "GSTK.space.Star",
      "GSTK.space.StellarBody",
      "GSTK.space.GasGiant",
      "GSTK.space.Terrestrial",
      "GSTK.space.AsteroidBelt"
    ]) === false){
      throw new Error("Required component not defined.");
    }

    root.$sys.def (root, "ui.view.StarView", factory(
      root.ui.common.Emitter,
      root.ui.common.DOMEventNotifier,
      root.GSTK.space.Star,
      root.GSTK.space.StellarBody,
      root.GSTK.space.GasGiant,
      root.GSTK.space.Terrestrial,
      root.GSTK.space.AsteroidBelt
    ));
  }
})(this, function (Emitter, DOMEventNotifier, Star, StellarBody, GasGiant, Terrestrial, AsteroidBelt) {

  function StarView(d3, svg){
    Emitter.call(this);
    var self = this;
    var scroller = svg.append("g");
    var bgLayer = scroller.append("g");
    var fzLayer = scroller.append("g");
    var snowlineLayer = scroller.append("g");
    var goldielocksLayer = scroller.append("g");
    var starLayer = scroller.append("g");
    var planetLayer = scroller.append("g");

    var star = null;
    var focusStar = null;
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

    var animateOrbits = false;
    var lastTimestamp = 0;
    var timeYearsPerSecond = 1;

    var info = {};


    function PositionFromTime(body, rMin, rMax, period, days){
      var res = {x:0, y:0};
      if (body.name in info){
	if (days > 0){
	  info[body.name].days = (info[body.name].days + days)%(period*365.25);
	}
	var time = info[body.name].days / 365.25;
	var progress = (time%period)/period;
	res.x = mapScale(rMin * Math.cos(progress * 2 * Math.PI));
	res.y = mapScale(rMax * Math.sin(progress * 2 * Math.PI));
      }
      return res;
    }

    function OnRenderOrbits(timestamp){
      var dt = 0;
      if (lastTimestamp !== 0){
	dt = (timestamp - lastTimestamp)/1000;
      }
      lastTimestamp = timestamp;
      if (timeYearsPerSecond > 0.0){
	self.emit("updateorbit", (dt * (timeYearsPerSecond*365.25)));
	if (focusStar !== null && focusStar.localOrbit !== null && focusStar.name in info){
	  var orbit = focusStar.localOrbit;
	  var focus = PositionFromTime(focusStar, orbit.rMin, orbit.rMax, orbit.period, 0);
	  scroller.attr("transform", "translate(" + (renderOffset.x - focus.x) + ", " + (renderOffset.y - focus.y) + ")");
	}
      }
    }

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

      var focus = {x:0, y:0};
      if (focusStar !== null && focusStar.localOrbit !== null){
	if (focusStar.name in info){
	  var orbit = focusStar.localOrbit;
	  focus = PositionFromTime(focusStar, orbit.rMin, orbit.rMax, orbit.period, 0);
	}
      }

      scroller.attr("transform", "translate(" + (renderOffset.x - focus.x) + ", " + (renderOffset.y - focus.y) + ")");
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
	enumerable:true,
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

	  info = {};
	  star = s;
	  if (star !== null){
	    if (focusStar !== null){
	      if (focusStar !== star){
		if (star.contains(focusStar) === false){
		  focusStar = star;
		}
	      }
	    } else {
	      focusStar = star;
	    }
	    
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
	  } else {
	    focusStar = null;
	  }
	  UpdateMapScale();
	}
      },

      "focusStar":{
	enumerable: true,
	get:function(){return focusStar;},
	set:function(s){
	  if (s !== null && !(s instanceof Star)){
	    throw new TypeError("Expected Star instance or null.");
	  }
	  if (star !== null){
	    if (s === null || s === star){
	      focusStar = star;
	    } else {
	      if (star.contains(s) === false){
		throw new Error("Star must be a companion of the primary star.");
	      }
	      focusStar = s;
	    }
	  }
	}
      },

      "mapSize":{
	enumerable:true,
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
	enumerable:true,
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
	enumerable:true,
	get:function(){return selectedBody;},
	set:function(b){
	  if (b instanceof StellarBody){
	    if (star !== null && star.hasBody(b) === true){
	      selectedBody = b;
	    }
	  } else if (b === null){
	    selectedBody = null;
	  } else {
	    throw new TypeError("Expected StellarBody instance object or null.");
	  }
	}
      },

      "orbitCursorRadius":{
	enumerable: true,
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
	enumerable: true,
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
	enumerable:true,
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
	enumerable: true,
	get:function(){return showSnowline;},
	set:function(e){
	  if (typeof(e) !== 'boolean'){
	    throw new TypeError("Expected boolean value.");
	  }
	  showSnowline = e;
	}
      },

      "showForbiddenZone":{
	enumerable:true,
	get:function(){return showForbiddenZone;},
	set:function(e){
	  if (typeof(e) !== 'boolean'){
	    throw new TypeError("Expected boolean value.");
	  }
	  showForbiddenZone = e;
	}
      },

      "showGoldielocks":{
	enumerable:true,
	get:function(){return showGoldielocks;},
	set:function(e){
	  if (typeof(e) !== 'boolean'){
	    throw new TypeError("Expected boolean value.");
	  }
	  showGoldielocks = e;
	}
      },

      "enableOrbitAnimation":{
	enumerable:true,
	get:function(){return animateOrbits;},
	set:function(e){
	  if (e === true){
	    animateOrbits = true;
	    lastTimestamp = 0;
	    DOMEventNotifier.on("renderframe", OnRenderOrbits);
	  } else if (e === false){
	    DOMEventNotifier.unlisten("renderframe", OnRenderOrbits);
	  }
	}
      },

      "animationYPS":{ // Animation Years Per Second
	enumerable: true,
	get:function(){return timeYearsPerSecond;},
	set:function(yps){
	  if (typeof(yps) !== 'number'){
	    throw new TypeError("Expected a number.");
	  } else if (yps <= 0){
	    throw new Error("Value must be greater than zero.");
	  }
	  timeYearsPerSecond = yps;
	}
      }
    });

    function UpdateScaleGrid(){
      if (axis !== null){
	axis.select("#xaxis").call(xAxis);
	axis.select("#yaxis").call(yAxis);
      }
    }


    function RenderStar(cdata, g){
      var s = cdata.body;
      var orbit = (typeof(cdata.orbit) !=='undefined') ? cdata.orbit : null;
      var fz = (typeof(cdata.forbiddenZone) !== 'undefined') ? cdata.forbiddenZone : null;

      var g_orbit = (orbit !== null) ? g.append("g") : null;
      var g_star = g.append("g");
      
      if (orbit !== null){
	if (!(s.name in info)){
	  info[s.name] = {days:0};
	}
	self.on("updateorbit", function(days){
	  var res = PositionFromTime(s, orbit.rMin, orbit.rMax, orbit.period, days);
	  g_star.attr("transform", "translate(" + res.x + ", " + res.y + ")");
	});
	(function(){
	  var res = PositionFromTime(s, orbit.rMin, orbit.rMax, orbit.period, 0);
	  g_star.attr("transform", "translate(" + res.x + ", " + res.y + ")");
	})();
      }

      var arc = null;
      if (showSnowline === true && orbit === null){
	arc = d3.svg.arc()
	  .innerRadius(mapScale(s.limit.snowLine))
	  .outerRadius(mapScale(s.fullSystemRadius))
	  .startAngle(0)
	  .endAngle(360*(Math.PI/180));
	g_star.append("g").append("path")
	  .attr("d", arc)
	  .attr("fill", "#007")
	  .attr("stroke", "none")
	  .attr("opacity", 0.25);
      }

      var gl = null;
      if (showGoldielocks === true){
	gl = s.goldielocks;
	var ir = s.limit.innerRadius;
	var or = s.limit.outerRadius;

	// Only render if goldielocks is within the valid planet range of the star.
	if (gl.min >= ir && gl.max <= or){
	  arc = d3.svg.arc()
	    .innerRadius(mapScale(gl.min))
	    .outerRadius(mapScale(gl.max))
	    .startAngle(0)
	    .endAngle(360*(Math.PI/180));
	  g_star.append("g").append("path")
	    .attr("d", arc)
	    .attr("fill", "#070")
	    .attr("stroke", "none")
	    .attr("opacity", 0.25);
	}
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

      if (orbit !== null){
	g_orbit.attr("class", "star " + s.sequence.substring(0, 1))
	  .append("ellipse")
	  .attr("cx", mapScale(0))
	  .attr("cy", mapScale(0))
	  .attr("rx", mapScale(orbit.rMin))
	  .attr("ry", mapScale(orbit.rMax))
	  .on("mouseover", function(){self.emit("starmouseover", s, d3.event);})
	  .on("mouseout", function(){self.emit("starmouseout", s, d3.event);})
	  .on("click", function(){self.emit("starclick", s, d3.event);})
	  .on("dblclick", function(){self.emit("stardblclick", s, d3.event);});
      } else {
	orbit = {rMin: 0, rMax: 0};
      }

      g_star.append("g")
	.attr("class", "star " + s.sequence.substring(0,1))
	.append("circle")
	.attr("r", starScale(s.radius))
	.on("mouseover", function(){self.emit("starmouseover", s, d3.event);})
	.on("mouseout", function(){self.emit("starmouseout", s, d3.event);})
	.on("click", function(){self.emit("starclick", s, d3.event);})
	.on("dblclick", function(){self.emit("stardblclick", s, d3.event);});

      if (s.hasBodiesOfType(Terrestrial.Type)){
	s.getBodiesOfType(Terrestrial.Type).forEach(function(sborbit){
	  RenderOrbit(g_star, sborbit, "orbit-terrestrial");
	});
      }

      if (s.hasBodiesOfType(GasGiant.Type)){
	s.getBodiesOfType(GasGiant.Type).forEach(function(sborbit){
	  RenderOrbit(g_star, sborbit, "orbit-gasgiant");
	});
      }

      if (s.hasBodiesOfType(AsteroidBelt.Type)){
	s.getBodiesOfType(AsteroidBelt.Type).forEach(function(sborbit){
	  RenderOrbit(g_star, sborbit, "orbit-asteroids", true);
	});
      }
    }


    function RenderOrbit(g, orbit, clsname, noCircle){
      noCircle = (noCircle === true) ? true : false;
      var g_group = g.append("g");
      
      if (selectedBody !== null && selectedBody === orbit.body){
	g_group.append("g")
	  .attr("class", "orbit-selected")
	  .append("ellipse")
	  .attr("rx", mapScale(orbit.rMin))
	  .attr("ry", mapScale(orbit.rMax));
      }
      
      // Stellar Body's orbital path...
      g_group.append("g")
	.attr("class", clsname)
	.append("ellipse")
	.attr("rx", mapScale(orbit.rMin))
	.attr("ry", mapScale(orbit.rMax))
      // NOTE: The "0" passed in the emit are there deprecated. Need to update the receiver.
	.on("mouseover", function(){self.emit("bodymouseover", orbit, 0, d3.event);})
	.on("mouseout", function(){self.emit("bodymouseout", orbit, 0, d3.event);})
	.on("click", function(){self.emit("bodyclick", orbit, 0, d3.event);})
	.on("dblclick", function(){self.emit("bodydblclick", orbit, 0, d3.event);});

      
      if (noCircle === false){
	var g_body = g_group.append("g");
	g_body.append("g")
	  .attr("class", clsname)
	  .append("circle")
	  .attr("r", bodyScale(orbit.body.diameter))
	// NOTE: The "0" passed in the emit are there deprecated. Need to update the receiver.
	  .on("mouseover", function(){self.emit("bodymouseover", orbit, 0, d3.event);})
	  .on("mouseout", function(){self.emit("bodymouseout", orbit, 0, d3.event);})
	  .on("click", function(){self.emit("bodyclick", orbit, 0, d3.event);})
	  .on("dblclick", function(){self.emit("bodydblclick", orbit, 0, d3.event);});

	if (!(orbit.body.name in info)){
	  info[orbit.body.name] = {days:0};
	}
	self.on("updateorbit", function(days){
	  var res = PositionFromTime(orbit.body, orbit.rMin, orbit.rMax, orbit.period, days);
	  g_body.attr("transform", "translate(" + res.x + ", " + res.y + ")");
	});
	(function(){
	  var res = PositionFromTime(orbit.body, orbit.rMin, orbit.rMax, orbit.period, 0);
	  g_body.attr("transform", "translate(" + res.x + ", " + res.y + ")");
	})();
      }
    }
    

    this.render = function(options){
      if (star === null){return;}

      self.unlistenEvent("updateorbit"); // Clear all current "updateorbit" listeners.

      svg.call(zoom);
      bgLayer.selectAll("*").remove();
      fzLayer.selectAll("*").remove();
      //snowlineLayer.selectAll("*").remove();
      //goldielocksLayer.selectAll("*").remove();
      starLayer.selectAll("*").remove();
      //planetLayer.selectAll("*").remove();
      
      bgLayer.append("circle")
	.attr("r", mapScale(star.fullSystemRadius))
	.attr("stroke", "#9F0")
	.attr("stroke-width", "2")
	.attr("fill", "#000");

      RenderStar({body:star}, starLayer);

      if (star.companionCount > 0){
	var companions = star.companions;
	for (var i=0; i < star.companionCount; i++){
	  RenderStar(companions[i], starLayer);
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
	  .attr("r", bodyScale(2))
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
  StarView.prototype.__proto__ = Emitter.prototype;
  StarView.prototype.constructor = StarView;

  return StarView;
});
