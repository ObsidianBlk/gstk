
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'd3',
      'kit/common/PRng',
      'kit/space/StellarBody',
      'kit/space/Terrestrial',
      'kit/space/GasGiant',
      'kit/space/AsteroidBelt',
      'ui/common/Emitter',
      'ui/common/DOMEventNotifier',
      'ui/ctrls/HoverPanelCtrl',
      'ui/ctrls/BodyEditorCtrl',
      'ui/view/StarView'
    ], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
	require('d3'),
	require('../../kit/common/PRng'),
	require('../../kit/space/StellarBody'),
	require('../../kit/space/Terrestrial'),
	require('../../kit/space/GasGiant'),
	require('../../kit/space/AsteroidBelt'),
	require('../common/Emitter'),
	require('../common/DOMEventNotifier'),
	require('../ctrls/HoverPanelCtrl'),
	require('../ctrls/BodyEditorCtrl'),
	require('../view/StarView')
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
      'GSTK.common.PRng',
      'GSTK.space.StellarBody',
      'GSTK.space.Terrestrial',
      'GSTK.space.GasGiant',
      'GSTK.space.AsteroidBelt',
      'ui.common.Emitter',
      'ui.common.DOMEventNotifier',
      'ui.ctrls.HoverPanelCtrl',
      'ui.ctrls.BodyEditorCtrl',
      'ui.view.StarView'
    ]) === false){
      throw new Error("Required component not defined.");
    }

    root.$sys.def (root, "ui.states.StarSystemState", factory(
      root.d3,
      root.GSTK.common.PRng,
      root.GSTK.space.StellarBody,
      root.GSTK.space.Terrestrial,
      root.GSTK.space.GasGiant,
      root.GSTK.space.AsteroidBelt,
      root.ui.common.Emitter,
      root.ui.common.DOMEventNotifier,
      root.ui.ctrls.HoverPanelCtrl,
      root.ui.ctrls.BodyEditorCtrl,
      root.ui.view.StarView
    ));
  }
})(this, function (d3, PRng, StellarBody, Terrestrial, GasGiant, AsteroidBelt, Emitter, DOMEventNotifier, HoverPanelCtrl, BodyEditorCtrl, StarView){

  function StarSystemState(dom){
    Emitter.call(this);
    var self = this;

    var svg = dom.append('svg')
	.attr("width", "100%")
	.attr("height", "100%");
    var map = svg.append("g");

    var mapSize = Math.min(DOMEventNotifier.getWidth(), DOMEventNotifier.getHeight());
    var hmapSize = Math.round(mapSize*0.5);

    
    // -------------------------------------------------------------------------------------------------------------------------------
    // Defining core state objects (but their events, yet)...

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
    
    var starView = new StarView(d3, map);
    starView.mapSize = mapSize;

    var bodyEditorPanel = new BodyEditorCtrl(d3.select(".hoverPanel.bodyEditor"));
    bodyEditorPanel.edge = HoverPanelCtrl.Edge.VCenter | HoverPanelCtrl.Edge.Right;
    bodyEditorPanel.flipEdge = false;

    var bodySelectedMenu = new HoverPanelCtrl(d3.select(".hoverPanel.StarBodySelection"));
    bodySelectedMenu.edge = HoverPanelCtrl.Edge.VCenter | HoverPanelCtrl.Edge.Right;
    bodySelectedMenu.flipEdge = false;

    
    // -------------------------------------------------------------------------------------------------------------------------------
    // Defining bodyEditorPanel events...
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

    
    // -------------------------------------------------------------------------------------------------------------------------------
    // Defining bodySelectedMenu events...
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

    
    // -------------------------------------------------------------------------------------------------------------------------------
    // Defining starViewMenu events...
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
    
    // -------------------------------------------------------------------------------------------------------------------------------
    // Defining starView events...
    starView.on("bodymouseover", function(d, i, event){
      var body = d.body;

      var x = d3.event.x;
      var y = d3.event.y;

      if (bodySelectedMenu.showing() === false && infoPanelIntervalID === null){
	infoPanelIntervalID = setTimeout(function(){
	  clearTimeout(infoPanelIntervalID);
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
    });

    starView.on("bodymouseout", function(d, i, event){
      if (infoPanelIntervalID !== null){
	clearTimeout(infoPanelIntervalID);
	infoPanelIntervalID = null;
      }
      infoPanel.show(false);
    });

    starView.on("bodyclick", function(d, i, event){
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
    });

    starView.on("bodydblclick", function(d, i, event){
      /* No event as of yet */
    });


    starView.on("starmouseover", function(s, event){
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
    });

    starView.on("starmouseout", function(s, event){
      if (starPanelIntervalID !== null){
	window.clearTimeout(starPanelIntervalID);
	starPanelIntervalID = null;
      }
      starPanel.show(false);
    });

    starView.on("starclick", function(s, event){
      /* No event as of yet */
    });

    starView.on("stardblclick", function(s, event){
      /* No event as of yet */
    });



    
    // -------------------------------------------------------------------------------------------------------------------------------
    // Handle Window Resize & Keyboard Events...
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


    // -------------------------------------------------------------------------------------------------------------------------------
    // Misc event handling!
    map.on("mousemove", function(){
      var pos = d3.mouse(this);
      starView.scaleGridPosition(pos[0], pos[1]);
    });

    
    // -------------------------------------------------------------------------------------------------------------------------------
    // Main "class" methods...

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
  StarSystemState.prototype.__proto__ = Emitter.prototype;
  StarSystemState.prototype.constructor = StarSystemState;


  return StarSystemState;
});

