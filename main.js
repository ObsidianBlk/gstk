
requirejs.config({
  baseUrl:"./",
  paths:{
    handlebars:'./node_modules/handlebars/dist/handlebars',
    d3:'./node_modules/d3/d3.min'
  },
  shim: {
    d3: {
      exports: 'd3'
    }
  }
});

requirejs([
  'd3',
  'handlebars',
  'ui/common/Emitter',
  'ui/common/DOMEventNotifier',
  'ui/ctrls/HoverPanelCtrl',
  'ui/ctrls/RangeSliderInput',
  'ui/ctrls/DialogBoxCtrl',
  'ui/ctrls/FileIOCtrl',
  'ui/ctrls/BodyEditorCtrl',
  'ui/states/RegionState',
  'kit/common/PRng',
  'kit/space/Region',
  'kit/space/Star',
  'kit/space/StellarBody',
  'kit/space/GasGiant',
  'kit/space/Terrestrial',
  'kit/space/AsteroidBelt',
  'ui/view/StarView'
], function(d3, Handlebars, Emitter, DOMEventNotifier, HoverPanelCtrl, RangeSliderInput, DialogBoxCtrl, FileIOCtrl, BodyEditorCtrl, RegionState, PRng, Region, Star, StellarBody, GasGiant, Terrestrial, AsteroidBelt, StarView){

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
  // -------------------------------------------------------------------------------------------------------------------------------------



  // -------------------------------------------------------------------------------------------------------------------------------------

  function StarSystemCtrl(domID, options){
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

    var starView = new StarView(d3, map);
    starView.mapSize = mapSize;
    starView.onBodyMouseOver = function(d, i){
      var body = d.body;

      var x = d3.event.x;
      var y = d3.event.y;

      if (bodySelectedMenu.showing() === false && infoPanelIntervalID === null){
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
	    infoPanel.showSection("gasgiant", true, true);
	  } else if (body instanceof AsteroidBelt){
	    infoPanel.set({
	      body: "Asteroid Belt",
	      temperature: body.temperature.toFixed(2),
	      temperatureC: StellarBody.Kelvin2C(body.temperature).toFixed(2),
	      temperatureF: StellarBody.Kelvin2F(body.temperature).toFixed(2),
	      resources: body.resources
	    });
	    infoPanel.showSection("asteroidbelt", true, true);
	  } else if (body instanceof Terrestrial){
	    var atm = body.atmosphere;
	    infoPanel.set({
	      body: "Terrestrial",
	      orbit: d.period.toFixed(2),
	      temperature: body.temperature.toFixed(2),
	      temperatureC: StellarBody.Kelvin2C(body.temperature).toFixed(2),
	      temperatureF: StellarBody.Kelvin2F(body.temperature).toFixed(2),
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
	    infoPanel.showSection("terrestrial", true, true);
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

    starView.onBodyClicked = function(d){
      starView.selectBody = d.body;
      starViewMenu.show(false);
      infoPanel.show(false);
      bodyEditorPanel.show(false);
      var name = d.body.name;
      if (name.length > 12){
	name = name.substr(0, 9) + "...";
      }
      bodySelectedMenu.set({
	bodyname:name
      });
      starView.render();
      bodySelectedMenu.show(true);
    };

    starView.onStarMouseOver = function(s){
      var x = d3.event.x;
      var y = d3.event.y;

      if (bodySelectedMenu.showing() === false && starPanelIntervalID === null){
	starPanelIntervalID = window.setTimeout(function(){
	  window.clearTimeout(starPanelIntervalID);
	  starPanelIntervalID = null;

	  var posDesc = s.localPosition;
	  if (s.parent !== null){
	    var orb = s.localOrbit;
	    posDesc = "\"" + posDesc + "\" - Perigee: " + orb.rMin.toFixed(2) + " AU  |  Apogee: " + orb.rMax.toFixed(2) + " AU"; 
	  }

	  starPanel.set({
	    position: posDesc,
	    name: s.name,
	    sequence: s.sequence + " / " + s.class,
	    mass: "" + s.mass,
	    radius: "" + s.radius.toFixed(4),
	    age: "" + s.age.toFixed(2),
	    temperature: "" + s.temperature,
	    orbitals: "(" + 
	      s.companionCount + " / " + 
	      s.countBodiesOfType(GasGiant.Type) + " / " + 
	      s.countBodiesOfType(Terrestrial.Type) + " / " + 
	      s.countBodiesOfType(AsteroidBelt.Type) + ")"
	  });
	  starPanel.show(true, x, y);
	}, 1000);
      }
    };

    starView.onStarMouseOut = function(){
      if (starPanelIntervalID !== null){
	window.clearTimeout(starPanelIntervalID);
	starPanelIntervalID = null;
      }
      starPanel.show(false);
    };

    var bodyEditorPanel = new BodyEditorCtrl(d3.select(".hoverPanel.bodyEditor"));
    bodyEditorPanel.edge = HoverPanelCtrl.Edge.VCenter | HoverPanelCtrl.Edge.Right;
    bodyEditorPanel.flipEdge = false;
    bodyEditorPanel.on("place", function(){
      var ops = {};
      switch(bodyEditorPanel.generationType){
      case 0: // Random Anything!
	if (bodyEditorPanel.bodyName !== null){
	  ops.name = bodyEditorPanel.bodyName;
	}
	starView.star.generateBody(
	  bodyEditorPanel.orbitalRadius,
	  bodyEditorPanel.orbitalEccentricity,
	  Math.floor(Math.random()*3),
	  ops
	);
	break;
      case 1: // Custom Gas Giant
	starView.star.generateBody(
	  bodyEditorPanel.orbitalRadius,
	  bodyEditorPanel.orbitalEccentricity,
	  0,
	  bodyEditorPanel.gasGiantConfig
	);
	break;
      case 2: // Custom Terrestrial
	starView.star.generateBody(
	  bodyEditorPanel.orbitalRadius,
	  bodyEditorPanel.orbitalEccentricity,
	  1,
	  bodyEditorPanel.terrestrialConfig
	);
	break;
      case 3: // Custom Asteroid Belt
	starView.star.generateBody(
	  bodyEditorPanel.orbitalRadius,
	  bodyEditorPanel.orbitalEccentricity,
	  2,
	  bodyEditorPanel.asteroidBeltConfig
	);
      }
      starView.showOrbitCursor = false;
      bodyEditorPanel.show(false);
      starViewMenu.show(true);
      starView.render();
    });
    bodyEditorPanel.on("cancel", function(){
      starView.showOrbitCursor = false;
      bodyEditorPanel.show(false);
      starViewMenu.show(true);
      starView.render();
    });
    bodyEditorPanel.on("orbitradiuschange", function(node, value){
      starView.orbitCursorRadius = Number(value);
      d3.select(node.parentNode.parentNode).select(".value").html(value);
      starView.render();
    });
    bodyEditorPanel.on("orbiteccentricitychange", function(node, value){
      starView.orbitCursorEccentricity = Number(value);
      d3.select(node.parentNode.parentNode).select(".value").html(value);
      starView.render();
    });

    var infoPanel = new HoverPanelCtrl(d3.select(".hoverPanel.planet"));
    infoPanel.edge = HoverPanelCtrl.Edge.Right;
    infoPanel.flipEdge = true;
    var infoPanelIntervalID = null;

    var starPanel = new HoverPanelCtrl(d3.select(".hoverPanel.star"));
    starPanel.edge = HoverPanelCtrl.Edge.Right;
    starPanel.flipEdge = true;
    var starPanelIntervalID = null;

    var starViewMenu = new HoverPanelCtrl(d3.select(".hoverPanel.StarViewMenu"));
    starViewMenu.edge = HoverPanelCtrl.Edge.Left;
    starViewMenu.flipEdge = false;
    starViewMenu.on("toggle", function(){
      starViewMenu.showSection("infotoggle", true, true);
    });
    starViewMenu.on("modify", function(){
      starViewMenu.showSection("modify", true, true);
    });
    starViewMenu.on("exitStarView", function(){
      self.emit("region");
    });
    starViewMenu.on("back", function(){
      starViewMenu.showSection("starviewmain", true, true);
    });
    starViewMenu.on("togglegoldie", function(){
      starView.showGoldielocks = !starView.showGoldielocks;
      starView.render();
    });
    starViewMenu.on("togglesnowline", function(){
      starView.showSnowline = !starView.showSnowline;
      starView.render();
    });
    starViewMenu.on("toggleforbiddenzone", function(){
      starView.showForbiddenZone = !starView.showForbiddenZone;
      starView.render();
    });
    starViewMenu.on("newbody", function(){
      starView.showOrbitCursor = true;
      bodyEditorPanel.star = starView.star;
      bodyEditorPanel.show(true);
      starViewMenu.show(false);
    });

    var bodySelectedMenu = new HoverPanelCtrl(d3.select(".hoverPanel.StarBodySelection"));
    bodySelectedMenu.edge = HoverPanelCtrl.Edge.VCenter | HoverPanelCtrl.Edge.Right;
    bodySelectedMenu.flipEdge = false;
    bodySelectedMenu.on("remove", function(){
      bodySelectedMenu.show(false);
      starView.star.removeBody(starView.selectBody);
      starView.selectBody = null;
      starView.render();
      starViewMenu.show(true);
    });
    bodySelectedMenu.on("cancel", function(){
      bodySelectedMenu.show(false);
      starView.selectBody = null;
      starView.render();
      starViewMenu.show(true);
    });

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
	starViewMenu.showSection("starviewmain", true, true);
	starViewMenu.show(true);
      } else if (enable === false && dom.classed("hidden") === false){
	dom.classed("hidden", true);
	starViewMenu.show(false);
        infoPanel.show(false);
	starView.resetZoom();
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
  // MAIN

  ready(function(){
    //var regionRadius = 21;
    //var seed = "Bryan Miller";
    var dialogBox = new DialogBoxCtrl(d3.select(".hoverPanel.DialogBox"));
    dialogBox.edge = HoverPanelCtrl.Edge.Center;
    dialogBox.flipEdge = false;

    var starsystemctrl = new StarSystemCtrl("StarsystemPanel");
    starsystemctrl.on("region", function(){
      starsystemctrl.show(false);
      regionctrl.show(true);
    });
    
    var regionctrl = new RegionState(d3.select("#RegionPanel"));
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
      loader.data = jstr;
      loader.showSection("export", true, true);
      loader.show(true);
      loader.on("close", function(){
	loader.show(false);
	regionctrl.show(true);
      });
    });
    regionctrl.on("export-star", function(data){
      regionctrl.show(false);
      loader.data = data;
      loader.showSection("export", true, true);
      loader.show(true);
      loader.on("close", function(){
	loader.show(false);
	regionctrl.show(true);
      });
    });

    var mainmenu = new HoverPanelCtrl(d3.select(".hoverPanel.MainMenu"));
    mainmenu.edge = HoverPanelCtrl.Edge.Center;
    mainmenu.flipEdge = false;
    mainmenu.on("region", function(){
      mainmenu.show(false);
      regionctrl.show(true);
    });
    mainmenu.on("import", function(){
      mainmenu.show(false);
      loader.showSection("import", true, true);
      loader.show(true);
    });
    mainmenu.on("quitapp", function(){
      dialogBox.show(true, "Quit! ... Ummmm, not yet.");
    });
    mainmenu.show(true);


    //var loader = new JSONControl("jsonsrc");
    //var loader = new HoverPanelCtrl(d3.select(".hoverPanel.FileIO"));
    var loader = new FileIOCtrl(d3.select(".hoverPanel.FileIO"));
    loader.edge = HoverPanelCtrl.Edge.Center;
    loader.flipEdge = false;

    loader.on("load", function(jstr){
      loader.show(false);
      try{
	if (loader.data !== null){
	  regionctrl.generate({data:loader.data});
	}
      } catch (e){
	dialogBox.show(true, e.message);
	dialogBox.once("ok", function(){
	  mainmenu.show(true);
	});
	return;
      }

      regionctrl.show(true);
    });


    /*
      Drawing the logo!
     */
    function RenderOpeningScreen(){
      var logo_padding_left = 10;
      var logo_padding_right = 10;
      var svg = d3.select("#OpeningScreenSVG");
      if (svg.empty() === true){
	svg = d3.select("#MainMenu")
	  .append("svg")
	  .attr("id", "OpeningScreenSVG")
	  .attr("width", "100%")
	  .attr("height", "100%");
      }
      svg.selectAll("*").remove();

      var GLogoText = svg.append("text")
	.attr("x", 0).attr("y", 0)
	.attr("font-family", "Cormorant")
	.attr("font-size", "40")
	.attr("text-anchor", "middle")
	.attr("alignment-baseline", "middle")
	.attr("stroke", "none")
	.attr("fill", "#09F")
	.text("GURPS");
      // NOTE: Because text is aligned middle (horizontal and verticle), the X,Y position will be changed from the 0 value given.

      var GLBox = GLogoText.node().getBBox(); // Getting the current BBox
      GLogoText.attr("x", GLBox.x + GLBox.width + logo_padding_left + 40); // Adjusting to the correct X position, given a middle alignment
      GLogoText.attr("y", GLBox.y + GLBox.height + 20);
      GLBox = GLogoText.node().getBBox(); // Getting the updated BBox.

      svg.append("rect")
	.attr("x", 0).attr("y", GLBox.y + (GLBox.height*0.25))
	.attr("width", GLBox.x - logo_padding_left).attr("height", GLBox.height*0.5)
	.attr("fill", "#09F")
	.attr("stroke", "none");

      svg.append("rect")
	.attr("x", GLBox.x + GLBox.width + logo_padding_right).attr("y", GLBox.y + (GLBox.height*0.25))
	.attr("width", DOMEventNotifier.getWidth() - (GLBox.x + GLBox.width + logo_padding_right))
	.attr("height", GLBox.height*0.5)
	.attr("fill", "#09F")
	.attr("stroke", "none");

      var hexCage = [
	{x:GLBox.x - logo_padding_left, y:GLBox.y + (GLBox.height*0.25)},
	{x:GLBox.x, y:GLBox.y},
	{x:GLBox.x + GLBox.width, y:GLBox.y},
	{x:GLBox.x + GLBox.width + logo_padding_right, y:GLBox.y + (GLBox.height*0.25)},
	{x:GLBox.x + GLBox.width + logo_padding_right, y:GLBox.y + (GLBox.height*0.75)},
	{x:GLBox.x + GLBox.width, y:GLBox.y + GLBox.height},
	{x:GLBox.x, y:GLBox.y + GLBox.height},
	{x:GLBox.x - logo_padding_left, y:GLBox.y + (GLBox.height*0.75)}
      ];
      
      var d3line2 = d3.svg.line()
	.x(function(d){return d.x;})
	.y(function(d){return d.y;})
	.interpolate("linear");

      svg.append("svg:path")
	.attr("d", d3line2(hexCage))
	.style("stroke-width", 3)
	.style("stroke", "#09F")
	.style("fill", "none");

      var SubLogos = svg.append("g");

      var SLogoText = SubLogos.append("text")
	.attr("x", 0).attr("y", 0)
	.attr("font-family", "Coda")
	.attr("font-size", "60")
	.attr("alignment-baseline", "hanging")
	.attr("stroke", "none")
	.attr("fill", "#09F")
	.text("SPACE");
      var SLBox = SLogoText.node().getBBox();
      
      var ToolkitText = SubLogos.append("text")
	.attr("x", SLBox.width + 4).attr("y", 3)
	.attr("font-family", "Coda")
	.attr("font-size", "30")
	.attr("alignment-baseline", "hanging")
	.attr("stroke", "none")
	.attr("fill", "#09F")
	.text("Toolkit");

      // Now getting the SubLogos group bbox.
      SLBox = SubLogos.node().getBBox();
      var slx = (DOMEventNotifier.getWidth()*0.5) - (SLBox.width*0.5);
      var sly = GLBox.y + GLBox.height + 10;
      SubLogos.attr("transform", "translate(" + slx + ", " + sly + ")");
    }

    DOMEventNotifier.on("resize", function(width, height){
      console.log("ping");
      RenderOpeningScreen();
    });
    RenderOpeningScreen();
  });
});
