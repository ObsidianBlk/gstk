
requirejs.config({
  baseUrl:"./"
});

requirejs([
  'kit/Emitter',
  'kit/PRng',
  'kit/space/Region',
  'kit/space/Star',
  'kit/space/StellarBody',
  'd3ui/D3Menu'
], function(Emitter, PRng, Region, Star, StellarBody, D3Menu){

  // --------------------------------
  // Defining a "Document Ready" function. This is only garanteed to work on Chrome at the moment.
  function ready(callback){
    if (document.readyState === "complete"){
      callback();
    } else {
      document.addEventListener('DOMContentLoaded', function (){
	callback();
      });
    }
  }

  // -------------------------------------------------------------------------------------------------------------------------------------
  // Global Variables...
  var AU = Number("1.496e8");

  // -------------------------------------------------------------------------------------------------------------------------------------
  // Application functions...

  function TrimNameLength(name, maxlen){
    if (name.length > maxlen){
      return name.substring(0, maxlen-3) + "...";
    }
    return name;
  }


  function DOMEventNotifier(){
    Emitter.call(this);
    d3.select(window).on("resize", (function(){
      this.emit("resize", window.innerWidth, window.innerHeight);
    }).bind(this));

    d3.select("body").on("keydown", (function(){
      this.emit("keydown", d3.event);
    }).bind(this));

    d3.select("body").on("keyup", (function(){
      this.emit("keyup", d3.event);
    }).bind(this));

    this.getWidth = function(){
      return window.innerWidth;
    };

    this.getHeight = function(){
      return window.innerHeight;
    };
  }
  DOMEventNotifier.prototype.__proto__ = Emitter.prototype;
  DOMEventNotifier.prototype.constructor = DOMEventNotifier;
  var DOMEN = new DOMEventNotifier();






  function RegionRenderer(svg){

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
    zoom.translate([DOMEN.getWidth()*0.5, DOMEN.getHeight()*0.5]);
    scroller.attr("transform", "translate(" + (DOMEN.getWidth()*0.5) + ", " + (DOMEN.getHeight()*0.5) + ")");

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
          for (var i=0; i < RegionRenderer.DISPLAY_TYPES.length; i++){
            var type = RegionRenderer.DISPLAY_TYPES[i];
            if (RegionRenderer.DISPLAY_INFO[type] === mode){
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
	  return "star " + d.star.type.substring(0, 1);
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
  RegionRenderer.prototype.constructor = RegionRenderer;
  RegionRenderer.DISPLAY_INFO = {
    "ALL": 0,
    "NOBODIES": 1,
    "BODIES": 2,
    "TERRESTRIAL": 3,
    "BREATHABLE": 4,
    "ASTEROIDS": 5
  };
  RegionRenderer.DISPLAY_TYPES = Object.keys(RegionRenderer.DISPLAY_INFO);




  function StarSystemRenderer(svg){
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
    zoom.translate([DOMEN.getWidth()*0.5, DOMEN.getHeight()*0.5]);
    scroller.attr("transform", "translate(" + (DOMEN.getWidth()*0.5) + ", " + (DOMEN.getHeight()*0.5) + ")");

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
	    if (s.primaryStar !== null){
	      s = s.primaryStar;
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
	.attr("class", "star " + s.type.substring(0, 1))
	.append("circle")
	.attr("r", starScale(s.radius));

      if (s.terrestrialCount > 0){
	RenderOrbits(g, s.terrestrials, "orbit-terrestrial");
      }

      if (s.gasGiantCount > 0){
	RenderOrbits(g, s.gasGiants, "orbit-gasgiant");
      }

      if (s.asteroidCount > 0){
	RenderOrbits(g, s.asteroids, "orbit-asteroids", true);
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
	  RenderStar(cdata.companion, surf);
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
  StarSystemRenderer.prototype.constructor = StarSystemRenderer;


  // -------------------------------------------------------------------------------------------------------------------------------------
  // STATES

  function MainMenu(domID, options){
    Emitter.call(this);
    var self = this;
    var mm = d3.select("#" + domID);
    var svg = mm.append("svg")
      .attr("width", "100%")
      .attr("height", "100%");
    var d3m = new D3Menu(svg, options);
    d3m.show(true);
    

    this.hidden = function(){
      return mm.classed("hidden");
    };

    this.show = function(enable){
      enable = (enable === false) ? false : true;
      if (enable && mm.classed("hidden")){
	mm.classed("hidden", false);
	d3m.show(true);
      } else if (enable === false && mm.classed("hidden") === false){
	mm.classed("hidden", true);
	d3m.show(false);
      }
    };
  }
  MainMenu.prototype.__proto__ = Emitter.prototype;
  MainMenu.prototype.constructor = MainMenu;


  // -------------------------------------------------------------------------------------------------------------------------------------

  function RegionCtrl(domID, options){
    Emitter.call(this);
    var self = this;
    var dom = d3.select("#" + domID);
    var svg = d3.select("#" + domID)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%");
    var mapSize = Math.min(DOMEN.getWidth(), DOMEN.getHeight());
    var hmapSize = Math.round(mapSize*0.5);

    var map = svg.append("g");

    var regionRenderer = new RegionRenderer(map);
    regionRenderer.pixelsPerParsec = 12;
    regionRenderer.mapSize = mapSize;

    var d3m = new D3Menu(svg, {
      menuclass:"menu",
      textoffset: 2,
      x: 10,
      y: 20,
      padding: 4,
      width:128,
      height:16,
      events:[
	{
	  name: "Back",
	  event:"mainmenu",
	  callback:function(event){
	    self.emit(event);
	  }
	},
	{
	  name: "Export",
	  event: "exportJSON",
	  callback:function(event){
	    self.emit(event, regionRenderer.region.toString(true));
	  }
	},
        {
          name: "All",
          event: "allStars",
          callback:function(event){
            regionRenderer.displayMode = 0;
            regionRenderer.render({
	      mouseOver:handleMouseOver,
	      mouseOut:handleMouseOut,
	      click:handleClick
            });
          }
        },
        {
          name: "Empty",
          event: "emptyStars",
          callback:function(event){
            regionRenderer.displayMode = 1;
            regionRenderer.render({
	      mouseOver:handleMouseOver,
	      mouseOut:handleMouseOut,
	      click:handleClick
            });
          }
        },
        {
          name: "Non-Empty",
          event: "nonemptyStars",
          callback:function(event){
            regionRenderer.displayMode = 2;
            regionRenderer.render({
	      mouseOver:handleMouseOver,
	      mouseOut:handleMouseOut,
	      click:handleClick
            });
          }
        },
        {
          name: "Terrestrial",
          event: "terrestrialStars",
          callback:function(event){
            regionRenderer.displayMode = 3;
            regionRenderer.render({
	      mouseOver:handleMouseOver,
	      mouseOut:handleMouseOut,
	      click:handleClick
            });
          }
        },
        {
          name: "Habitable",
          event: "habitableWorlds",
          callback:function(event){
            regionRenderer.displayMode = 4;
            regionRenderer.render({
	      mouseOver:handleMouseOver,
	      mouseOut:handleMouseOut,
	      click:handleClick
            });
          }
        },
	{
          name: "Asteroid",
          event: "asteroidWorlds",
          callback:function(event){
            regionRenderer.displayMode = 5;
            regionRenderer.render({
	      mouseOver:handleMouseOver,
	      mouseOut:handleMouseOut,
	      click:handleClick
            });
          }
        }
      ]
    });
    

    function handleMouseOver(d, i){
      var star = d.star;
      var id = "STARTEXT_"+i;
      var id2 = "STARPARSEC_" + i;

      d3.select(this)
	.append("text")
	.attr("id", id)
	.attr("x", 6)
	.attr("dominant-baseline", "middle")
	.text("(" + d.r.toFixed(2) + ", " + d.a.toFixed(2) + ")");

      d3.select(this)
	.append("circle")
	.attr("id", id2)
	.attr("r", regionRenderer.mapScale(3))
	.attr("fill", "none")
	.attr("stroke", "#F00")
	.attr("strokeWidth", 0.5);

      d3.select("#circle_" + i)
	.attr("r", regionRenderer.starScale(0.01*AU));
    }

    function handleMouseOut(d, i){
      var id = "STARTEXT_"+i;
      var id2 = "STARPARSEC_" + i;
      d3.select("#" + id).remove();
      d3.select("#" + id2).remove();

      d3.select("#circle_" + i)
	.attr("r", regionRenderer.starScale(d.star.radius*AU));
    }

    function handleClick(d, i){
      self.emit("starClicked", d.star);
    }
    
    DOMEN.on("resize", function(width, height){
      mapSize = Math.min(width, height);
      hmapSize = Math.round(mapSize*0.5);
      regionRenderer.mapSize = mapSize;
      regionRenderer.render({
	mouseOver:handleMouseOver,
	mouseOut:handleMouseOut,
	click:handleClick
      });
    });

    this.hidden = function(){
      return dom.classed("hidden");
    };

    this.show = function(enable){
      enable = (enable === false) ? false : true;
      if (enable && dom.classed("hidden")){
	dom.classed("hidden", false);
	d3m.show(true);
      } else if (enable === false && dom.classed("hidden") === false){
	dom.classed("hidden", true);
	d3m.show(false);
      }
    };

    this.generate = function(options){
      if (typeof(options.jsonString) === 'string'){
	try{
	  regionRenderer.region = new Region();
	  regionRenderer.region.generate(options.jsonString);
	} catch (e) {
	  throw e;
	}
      } else {
	options = (typeof(options) === typeof({})) ? JSON.parse(JSON.stringify(options)) : {};
	regionRenderer.region = new Region(options);
	regionRenderer.region.generate();
      }
      regionRenderer.render({
	mouseOver:handleMouseOver,
	mouseOut:handleMouseOut,
	click:handleClick
      });
    };
  }
  RegionCtrl.prototype.__proto__ = Emitter.prototype;
  RegionCtrl.prototype.constructor = RegionCtrl;



  // -------------------------------------------------------------------------------------------------------------------------------------

  function StarSystemCtrl(domID, options){
    Emitter.call(this);
    var self = this;
    var dom = d3.select("#" + domID);
    var svg = d3.select("#" + domID)
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%");
    var d3m = new D3Menu(svg, {
      menuclass:"menu",
      textoffset: 2,
      x: 10,
      y: 20,
      padding: 4,
      width:128,
      height:16,
      events:[
	{
	  name: "Back",
	  event:"region",
	  callback:function(event){
	    self.emit(event);
	  }
	},
      ]
    });
    var mapSize = Math.min(DOMEN.getWidth(), DOMEN.getHeight());
    var hmapSize = Math.round(mapSize*0.5);

    var map = svg.append("g");
    var starRenderer = new StarSystemRenderer(map);
    starRenderer.mapSize = mapSize;

    map.on("mousemove", function(){
      var pos = d3.mouse(this);
      starRenderer.scaleGridPosition(pos[0], pos[1]);
    });

    DOMEN.on("resize", function(width, height){
      mapSize = Math.min(width, height);
      hmapSize = Math.round(mapSize*0.5);
      starRenderer.mapSize = mapSize;
      starRenderer.render();
    });

    DOMEN.on("keydown", function(event){
      if (event.ctrlKey){
	starRenderer.scaleGridShowing = true;
      }
    });

    DOMEN.on("keyup", function(event){
      if (event.ctrlKey === false && starRenderer.scaleGridShowing === true){
	starRenderer.scaleGridShowing = false;
      }
    });

    this.hidden = function(){
      return dom.classed("hidden");
    };

    this.show = function(enable){
      enable = (enable === false) ? false : true;
      if (enable && dom.classed("hidden")){
	dom.classed("hidden", false);
        d3m.show(true);
      } else if (enable === false && dom.classed("hidden") === false){
	dom.classed("hidden", true);
        d3m.show(false);
      }
    };

    this.setStar = function(star){
      starRenderer.star = star;
      starRenderer.render();
    };
  }
  StarSystemCtrl.prototype.__proto__ = Emitter.prototype;
  StarSystemCtrl.prototype.constructor = StarSystemCtrl;



  // -------------------------------------------------------------------------------------------------------------------------------------

  function JSONControl(domID){
    Emitter.call(this);

    var self = this;
    var dom = d3.select("#" + domID);
    dom.select("#btn_jsonload").on("click", function(){
      self.emit("load", dom.select("#jsonsrc").property("value"));
    });

    dom.select("#btn_close").on("click", function(){
      self.emit("close");
    });

    this.show = function(enable, data){
      enable = (enable === false) ? false : true;
      if (enable && dom.classed("hidden")){
	dom.classed("hidden", false);
	if (typeof(data) === 'string'){
	  dom.select("#jsonsrc").property("value", data);
	}
      } else if (enable === false && dom.classed("hidden") === false){
	dom.classed("hidden", true);
      }
    };
  }
  JSONControl.prototype.__proto__ = Emitter.prototype;
  JSONControl.prototype.constructor = JSONControl;



  // -------------------------------------------------------------------------------------------------------------------------------------
  // MAIN

  ready(function(){
    var regionRadius = 21;
    var seed = "Bryan Miller";
    var region = new Region({
      seed: seed,
      radius: regionRadius,
      autoGenerate: true
    });
    console.log(region);
    return; // Temporary cutoff!

    var starsystemctrl = new StarSystemCtrl("StarsystemPanel");
    starsystemctrl.on("region", function(){
      starsystemctrl.show(false);
      regionctrl.show(true);
    });
    
    var regionctrl = new RegionCtrl("RegionPanel");
    regionctrl.on("starClicked", function(s){
      regionctrl.show(false);
      starsystemctrl.show(true);
      starsystemctrl.setStar(s);
    });
    regionctrl.on("mainmenu", function(){
      regionctrl.show(false);
      mainmenu.show(true);
    });
    regionctrl.on("exportJSON", function(jstr){
      regionctrl.show(false);
      loader.show(true, jstr);
    });

    var mainmenu = new MainMenu("MainMenu", {
      menuclass:"menu",
      textoffset: 2,
      x: 10,
      y: 20,
      padding: 4,
      width:128,
      height:16,
      events:[
	{name: "Generate Region", event:"genRegion", callback:function(event){mainmenu.emit(event);}},
	{name: "Load Region", event:"loadRegion", callback:function(event){mainmenu.emit(event);}},
	{name: "Quit", event:"quit", callback:function(event){mainmenu.emit(event);}}
      ]
    });

    mainmenu.on("genRegion", function(){
      mainmenu.show(false);
      regionctrl.show(true);
      regionctrl.generate({
	seed: seed,
	radius: regionRadius,
	zmin: -2,
	zmax: 2,
	systemAtOrigin: true
      });
    });

    mainmenu.on("loadRegion", function(){
      mainmenu.show(false);
      loader.show(true);
    });
    mainmenu.on("quit", function(){console.log("Quit! ... Ummm, not yet");});


    var loader = new JSONControl("jsonsrc");
    loader.on("close", function(){
      loader.show(false);
      mainmenu.show(true);
    });

    loader.on("load", function(jstr){
      loader.show(false);
      try{
	regionctrl.generate({jsonString:jstr});
      } catch (e){
	console.error(e);
	mainmenu.show(true);
	return;
      }

      regionctrl.show(true);
    });
  });

});
