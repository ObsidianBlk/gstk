
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
    if (dom.classed("hoverPanel") === false){
      throw new Error("Element does not contain required class");
    }

    this.set = function(name_or_dict, value){
      if (typeof(name_or_dict) === typeof({})){
	Object.keys(name_or_dict).forEach((function(key){
	  this.set(key, name_or_dict[key]);
	}).bind(this));
      } else {
	var item = dom.select("#" + name_or_dict);
	if (item.empty() === false){
	  item.html(value);
	}
      }
    };

    this.position = function(x, y){
      dom.style("left", x + "px");
      dom.style("top", y + "px");
    };

    this.show = function(enable, x, y){
      enable = (enable === false) ? false : true;
      if (enable && dom.classed("hidden")){
	this.position(
	  (typeof(x) === 'number') ? x : 0,
	  (typeof(y) === 'number') ? y : 0
	);
	dom.classed("hidden", false);
      } else if (enable === false && dom.classed("hidden") === false){
	dom.classed("hidden", true);
      }
    };

    this.showing = function(){
      return (dom.classed("hidden") === false);
    };
  }
  HoverPanelCtrl.prototype.constructor = HoverPanelCtrl;

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
    var infoPanelIntervalID = null;

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
	    self.emit(event, regionView.region.toString(true));
	  }
	},
        {
          name: "All",
          event: "allStars",
          callback:function(event){
            regionView.displayMode = 0;
            regionView.render({
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
            regionView.displayMode = 1;
            regionView.render({
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
            regionView.displayMode = 2;
            regionView.render({
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
            regionView.displayMode = 3;
            regionView.render({
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
            regionView.displayMode = 4;
            regionView.render({
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
            regionView.displayMode = 5;
            regionView.render({
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
	  infoPanel.show(true, x, y + 20);
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
	d3m.show(true);
      } else if (enable === false && dom.classed("hidden") === false){
	dom.classed("hidden", true);
	d3m.show(false);
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

    map.on("mousemove", function(){
      var pos = d3.mouse(this);
      starView.scaleGridPosition(pos[0], pos[1]);
    });

    DOMEventNotifier.on("resize", function(width, height){
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
