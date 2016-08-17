
requirejs.config({
  baseUrl:"./"
});

requirejs([
  'kit/Emitter',
  'kit/DOMEventNotifier',
  'kit/PRng',
  'kit/space/Region',
  'kit/space/Star',
  'kit/space/StellarBody',
  'kit/space/GasGiant',
  'kit/space/Terrestrial',
  'kit/space/AsteroidBelt',
  'view/RegionView',
  'view/StarView',
  'd3ui/D3Menu'
], function(Emitter, DOMEventNotifier, PRng, Region, Star, StellarBody, GasGiant, Terrestrial, AsteroidBelt, RegionView, StarView, D3Menu){

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

  DOMEventNotifier.initialize(d3, window);

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

  function HoverPanelCtrl(dom){
    Emitter.call(this);
    if (dom.classed("hoverPanel") === false){
      throw new Error("Element does not contain required class");
    }

    var self = this;
    (function(){
      var events = {};
      var menus = dom.selectAll("ul.menu").each(function(){
	d3.select(this).selectAll("a").each(function(){
	  var a = d3.select(this);
	  var event = a.attr("id");
	  if (event !== null && !(event in events)){
	    events[event] = true;
	    a.on("click", (function(ename){
	      return function(d){
		self.emit(ename, d);
	      };
	    })(event));
	  }
	});
      });
    })();

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

      x += posOffsetX;
      y += posOffsetY;

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

    this.showSection = function(secname){
      var sec = dom.select(".section." +secname);
      if (sec.empty() === false){
	if (sec.classed("hidden") === true){
	  dom.selectAll(".section").classed("hidden", true);
	  sec.classed("hidden", false);
	  if (dom.classed("hidden") === false){
	    var rect = dom.node().getBoundingClientRect();
	    this.position(rect.x, rect.y);
	  }
	}
      }
    };

    this.showing = function(){
      return (dom.classed("hidden") === false);
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

  // -------------------------------------------------------------------------------------------------------------------------------------

  function RegionCtrl(domID, options){
    Emitter.call(this);
    var self = this;
    var dom = d3.select("#" + domID);
    var svg = d3.select("#" + domID)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%");
    var mapSize = Math.min(DOMEventNotifier.getWidth(), DOMEventNotifier.getHeight());
    var hmapSize = Math.round(mapSize*0.5);

    var map = svg.append("g");

    var regionView = new RegionView(d3, map);
    regionView.pixelsPerParsec = 12;
    regionView.mapSize = mapSize;

    var infoPanel = new HoverPanelCtrl(d3.select(".hoverPanel.star"));
    infoPanel.edge = HoverPanelCtrl.Edge.Right;
    infoPanel.flipEdge = true;
    infoPanel.offsetY = 20;
    var infoPanelIntervalID = null;

    function SetDisplayMode(mode){
      regionView.displayMode = mode;
      regionView.render({
	mouseOver:handleMouseOver,
	mouseOut:handleMouseOut,
	click:handleClick
      });
    }

    var menuPanel = new HoverPanelCtrl(d3.select(".hoverPanel.RegionMenu"));
    menuPanel.edge = HoverPanelCtrl.Edge.Right;
    menuPanel.flipEdge = true;
    menuPanel.on("filters", function(){
      menuPanel.showSection("regionfilters");
    });
    menuPanel.on("modify", function(){
      menuPanel.showSection("regionmodify");
    });
    menuPanel.on("export", function(){
      self.emit("exportJSON", regionView.region.toString(true));
    });
    menuPanel.on("exitregionview", function(){
      self.emit("mainmenu");
    });
    menuPanel.on("back", function(){
      menuPanel.showSection("regionmain");
    });
    menuPanel.on("showall", function(){
      SetDisplayMode(0);
    });
    menuPanel.on("showempty", function(){
      SetDisplayMode(1);
    });
    menuPanel.on("shownonempty", function(){
      SetDisplayMode(2);
    });
    menuPanel.on("showterrestrial", function(){
      SetDisplayMode(3);
    });
    menuPanel.on("showhabitable", function(){
      SetDisplayMode(4);
    });
    menuPanel.on("showasteroids", function(){
      SetDisplayMode(5);
    });
    
    function handleMouseOver(d, i){
      var star = d.star;
      var id = "STARTEXT_"+i;
      var id2 = "STARPARSEC_" + i;

      var x = d3.event.x;
      var y = d3.event.y;

      if (infoPanelIntervalID === null){
	infoPanelIntervalID = window.setTimeout(function(){
	  window.clearTimeout(infoPanelIntervalID);
	  infoPanelIntervalID = null;

	  infoPanel.set({
	    position:"(R:" + d.r.toFixed(2) + ", A:" + d.a.toFixed(2) + ")",
	    name: d.star.name,
	    sequence: d.star.sequence + " / " + d.star.class,
	    mass: "" + d.star.mass,
	    radius: "" + d.star.radius.toFixed(4),
	    age: "" + d.star.age.toFixed(2),
	    temperature: "" + d.star.temperature,
	    orbitals: "(" + 
	      d.star.companionCount + " / " + 
	      d.star.countBodiesOfType(GasGiant.Type) + " / " + 
	      d.star.countBodiesOfType(Terrestrial.Type) + " / " + 
	      d.star.countBodiesOfType(AsteroidBelt.Type) + ")"
	  });
	  infoPanel.show(true, x, y);
	}, 1000);
      }

      d3.select(this)
	.append("circle")
	.attr("id", id2)
	.attr("r", regionView.mapScale(3))
	.attr("fill", "none")
	.attr("stroke", "#F00")
	.attr("strokeWidth", 0.5);

      d3.select("#circle_" + i)
	.attr("r", regionView.starScale(0.01*AU));
    }

    function handleMouseOut(d, i){
      var id = "STARTEXT_"+i;
      var id2 = "STARPARSEC_" + i;
      d3.select("#" + id).remove();
      d3.select("#" + id2).remove();

      if (infoPanelIntervalID !== null){
	window.clearTimeout(infoPanelIntervalID);
	infoPanelIntervalID = null;
      }
      infoPanel.show(false);

      d3.select("#circle_" + i)
	.attr("r", regionView.starScale(d.star.radius*AU));
    }

    function handleClick(d, i){
      self.emit("starClicked", d.star);
    }
    
    DOMEventNotifier.on("resize", function(width, height){
      mapSize = Math.min(width, height);
      hmapSize = Math.round(mapSize*0.5);
      regionView.mapSize = mapSize;
      regionView.render({
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
	menuPanel.show(true, 0, 0);
      } else if (enable === false && dom.classed("hidden") === false){
	dom.classed("hidden", true);
	menuPanel.show(false);
      }
    };

    this.generate = function(options){
      if (typeof(options.jsonString) === 'string'){
	try{
	  regionView.region = new Region();
	  regionView.region.generate(options.jsonString);
	} catch (e) {
	  throw e;
	}
      } else {
	options = (typeof(options) === typeof({})) ? JSON.parse(JSON.stringify(options)) : {};
	regionView.region = new Region(options);
	regionView.region.generate();
      }
      regionView.render({
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
    var mapSize = Math.min(DOMEventNotifier.getWidth(), DOMEventNotifier.getHeight());
    var hmapSize = Math.round(mapSize*0.5);

    var map = svg.append("g");
    var starView = new StarView(d3, map);
    starView.mapSize = mapSize;
    starView.onBodyMouseOver = function(d, i){
      var body = d.body;

      var x = d3.event.x;
      var y = d3.event.y;

      if (infoPanelIntervalID === null){
	infoPanelIntervalID = window.setTimeout(function(){
	  window.clearTimeout(infoPanelIntervalID);
	  infoPanelIntervalID = null;

	  infoPanel.set({
	    apogee: d.rMax.toFixed(4),
	    perigee: d.rMin.toFixed(4),
	    name: body.name,
	    size: body.size
	  });

	  if (body instanceof GasGiant){
	    infoPanel.set({
	      body: "Gas Giant",
	      orbit: d.period.toFixed(2),
	      blackbody: body.blackbody.toFixed(2),
	      period: body.rotationalPeriod.toFixed(4),
	      tilt: body.axialTilt.toFixed(1),
	      mass: body.mass.toFixed(4),
	      density: body.density.toFixed(4),
	      diameter: body.diameterKM.toFixed(4),
	      gravity: body.surfaceGravity.toFixed(2)
	    });
	    infoPanel.showSection("gasgiant");
	  } else if (body instanceof AsteroidBelt){
	    infoPanel.set({
	      body: "Asteroid Belt",
	      temperature: body.temperature.toFixed(2),
	      resources: body.resources
	    });
	    infoPanel.showSection("asteroidbelt");
	  } else if (body instanceof Terrestrial){
	    var atm = body.atmosphere;
	    infoPanel.set({
	      body: "Terrestrial",
	      orbit: d.period.toFixed(2),
	      temperature: body.temperature.toFixed(2),
	      period: body.rotationalPeriod.toFixed(4),
	      tilt: body.axialTilt.toFixed(1),
	      mass: body.mass.toFixed(4),
	      density: body.density.toFixed(4),
	      diameter: body.diameterKM.toFixed(4),
	      gravity: body.surfaceGravity.toFixed(2),
	      cls: body.class,
	      resources: body.resources,
	      hydrographics: body.hydrographics.toFixed(2),
              breathable: (atm.breathable === true) ? "True" : "False",
	      suffocating: (atm.suffocating === true) ? "True" : "False",
	      corrosive: (atm.corrosive === true) ? "True" : "False",
	      toxic: (typeof(atm.toxicity) === 'number' && atm.toxicity === 0) ? "None" : (atm.toxicity === 1) ? "Mild" : (atm.toxicity === 2) ? "Thick" : "Heavy",
	      toxin: (typeof(atm.marginal) === true && typeof(atm.toxin) !== 'undefined') ? atm.toxin.join(", ") : "None",
	      composition: (typeof(atm.composition) !== 'undefined') ? atm.composition.join(", ") : "None",
	      affinity: body.affinity
	    });
	    infoPanel.showSection("terrestrial");
	  }

	  infoPanel.show(true, x, y + 20);
	}, 1000);
      }
    };

    starView.onBodyMouseOut = function(d, i){
      if (infoPanelIntervalID !== null){
	window.clearTimeout(infoPanelIntervalID);
	infoPanelIntervalID = null;
      }
      infoPanel.show(false);
    };

    var infoPanel = new HoverPanelCtrl(d3.select(".hoverPanel.planet"));
    var infoPanelIntervalID = null;

    map.on("mousemove", function(){
      var pos = d3.mouse(this);
      starView.scaleGridPosition(pos[0], pos[1]);
    });

    DOMEventNotifier.on("resize", function(width, height){
      infoPanel.show(false);
      mapSize = Math.min(width, height);
      hmapSize = Math.round(mapSize*0.5);
      starView.mapSize = mapSize;
      starView.render();
    });

    DOMEventNotifier.on("keydown", function(event){
      if (event.ctrlKey){
	starView.scaleGridShowing = true;
      }
    });

    DOMEventNotifier.on("keyup", function(event){
      if (event.ctrlKey === false && starView.scaleGridShowing === true){
	starView.scaleGridShowing = false;
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
        infoPanel.show(false);
      }
    };

    this.setStar = function(star){
      starView.star = star;
      starView.render();
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
    /*var region = new Region({
      seed: seed,
      radius: regionRadius,
      autoGenerate: true
    });
    console.log(region);
    return;*/ // Temporary cutoff!

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
