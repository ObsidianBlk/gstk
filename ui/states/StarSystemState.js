
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'd3',
      'handlebars',
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
	require('handlebars'),
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
      'handlebars',
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
      root.handlebars,
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
})(this, function (d3, handlebars, PRng, StellarBody, Terrestrial, GasGiant, AsteroidBelt, Emitter, DOMEventNotifier, HoverPanelCtrl, BodyEditorCtrl, StarView){

  function BuildInfoPanel(context){
    var source   = d3.select("#TMPL-Infomation").html();
    var template = handlebars.compile(source);
    var html = template(context);
    var infodiv = d3.select(".hoverPanel.stellarBodyInfo");
    infodiv.selectAll().remove();
    infodiv.html(html);
  };

  
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

    var infoPanel = new HoverPanelCtrl(d3.select(".hoverPanel.stellarBodyInfo"));
    infoPanel.edge = HoverPanelCtrl.Edge.Right;
    infoPanel.flipEdge = true;
    var infoPanelIntervalID = null;

    /*var starPanel = new HoverPanelCtrl(d3.select(".hoverPanel.star"));
    starPanel.edge = HoverPanelCtrl.Edge.Right;
    starPanel.flipEdge = true;
    var starPanelIntervalID = null;*/

    var starViewMenu = new HoverPanelCtrl(d3.select(".hoverPanel.StarViewMenu"));
    starViewMenu.edge = HoverPanelCtrl.Edge.Left;
    starViewMenu.flipEdge = false;
    
    var starView = new StarView(d3, map);
    starView.mapSize = mapSize;
    starView.enableOrbitAnimation = true;

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

	  if (body instanceof GasGiant){
	    BuildInfoPanel({
	      item:
	      [
		{name:"Name", value:body.name},
		{name:"Type", value:"Gas Giant"},
		{name:"Size", value:body.size},
		{name:"Apogee", value:d.rMax.toFixed(4), unit:"AU"},
		{name:"Perigee", value:d.rMin.toFixed(4), unit:"AU"},
		{name:"Orbital Period", value:d.period.toFixed(2), unit:"earth years"},
		{name:"Rotation Period", value:body.rotationalPeriod.toFixed(4), unit:"earth days"},
		{name:"Blackbody Temperature", value:body.blackbody.toFixed(2), unit:"k"},
		{name:"Axial Tilt", value:body.axialTilt.toFixed(1), unit:"degrees"},
		{name:"Mass", value:body.mass.toFixed(4), unit:"earths"},
		{name:"Density", value:body.density.toFixed(4), unit:"earths"},
		{name:"Diameter", value:body.diameterKM.toFixed(4), unit:"km"},
		{name:"Gravity", value:body.surfaceGravity.toFixed(2), unit:"earths"}
	      ]
	    });
	  } else if (body instanceof AsteroidBelt){
	    BuildInfoPanel({
	      item:
	      [
		{name:"Name", value:body.name},
		{name:"Type", value:"Asteroid Belt"},
		{name:"Size", value:body.size},
		{name:"Apogee", value:d.rMax.toFixed(4), unit:"AU"},
		{name:"Perigee", value:d.rMin.toFixed(4), unit:"AU"},
		{name:"Temperature", item:[
		  {value:body.temperature.toFixed(2), unit:"k"},
		  {value:StellarBody.Kelvin2C(body.temperature).toFixed(2), unit:"c"},
		  {value:StellarBody.Kelvin2F(body.temperature).toFixed(2), unit:"f"}
		]},
		{name:"Resources", value:body.resources}
	      ]
	    });
	  } else if (body instanceof Terrestrial){
	    var atm = body.atmosphere;
	    BuildInfoPanel({
	      item:
	      [
		{name:"Name", value:body.name},
		{name:"Type", value:"Terrestrial"},
		{name:"Class", value:body.class},
		{name:"Size", value:body.size},
		{name:"Apogee", value:d.rMax.toFixed(4), unit:"AU"},
		{name:"Perigee", value:d.rMin.toFixed(4), unit:"AU"},
		{name:"Orbital Period", value:d.period.toFixed(2), unit:"earth years"},
		{name:"Rotation Period", value:body.rotationalPeriod.toFixed(4), unit:"earth days"},
		{name:"Axial Tilt", value:body.axialTilt.toFixed(1), unit:"degrees"},
		{name:"Blackbody Temperature", value:body.blackbody.toFixed(2), unit:"k"},
		{name:"Temperature", item:[
		  {value:body.temperature.toFixed(2), unit:"k"},
		  {value:StellarBody.Kelvin2C(body.temperature).toFixed(2), unit:"c"},
		  {value:StellarBody.Kelvin2F(body.temperature).toFixed(2), unit:"f"}
		]},
		{name:"Mass", value:body.mass.toFixed(4), unit:"earths"},
		{name:"Density", value:body.density.toFixed(4), unit:"earths"},
		{name:"Diameter", value:body.diameterKM.toFixed(4), unit:"km"},
		{name:"Gravity", value:body.surfaceGravity.toFixed(2), unit:"earths"},
		{name:"Hydrographics", value:body.hydrographics.toFixed(2), unit:"%"},
		{name:"Atmosphere:", item:[
		  {name:"Breathable", value:(atm.breathable === true) ? "True" : "False"},
		  {name:"Suffocating", value:(atm.suffocating === true) ? "True" : "False"},
		  {name:"Corrosive", value:(atm.corrosive === true) ? "True" : "False"},
		  {name:"Toxic", value:(typeof(atm.toxicity) === 'number' && atm.toxicity === 0) ? "None" : (atm.toxicity === 1) ? "Mild" : (atm.toxicity === 2) ? "Thick" : "Heavy"},
		  {name:"Toxin", value:(typeof(atm.marginal) === true && typeof(atm.toxin) !== 'undefined') ? atm.toxin.join(", ") : "None"},
		  {name:"Composition", value:(typeof(atm.composition) !== 'undefined') ? atm.composition.join(", ") : "None"}
		]},
		{name:"Resources", value:body.resources},
		{name:"Affinity", value:body.affinity}
	      ]
	    });
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
      

      if (bodySelectedMenu.showing() === false && infoPanelIntervalID === null){
	infoPanelIntervalID = setTimeout(function(){
	  clearTimeout(infoPanelIntervalID);
	  infoPanelIntervalID = null;

	  var items = [];
	  items.push({name:"Name", value:s.name});
	  
	  if (s.parent !== null){
	    var orb = s.localOrbit;
	    items.push({name:"Apogee", value:orb.rMax.toFixed(2), unit:"AU"});
	    items.push({name:"Perigee", value:orb.rMin.toFixed(2), unit:"AU"});
	    items.push({name:"Orbit Type", value:s.localPosition});
	    items.push({name:"Orbital Period", value:orb.period, unit:"earth years"});
	  } else {
	    items.push({name:"Position", value:s.localPosition});
	  }

	  items.push({name:"Sequence", value:s.sequence + " / " + s.class});
	  items.push({name:"Mass", value:s.mass.toFixed(4), unit:"Solar Units"});
	  items.push({name:"Radius", value:s.radius.toFixed(4), unit:"AU"});
	  items.push({name:"Age", value:s.age.toFixed(2), unit:"bY"});
	  items.push({name:"Temperature", value:s.temperature.toFixed(2), unit:"k"});

	  BuildInfoPanel({
	    item:items
	  });

	  infoPanel.show(true, x, y);
	}, 1000);
      }
    });

    starView.on("starmouseout", function(s, event){
      if (infoPanelIntervalID !== null){
	clearTimeout(infoPanelIntervalID);
	infoPanelIntervalID = null;
      }
      infoPanel.show(false);
    });

    starView.on("starclick", function(s, event){
      /* No event as of yet */
    });

    starView.on("stardblclick", function(s, event){
      if (starView.focusStar !== s){
	starView.focusStar = s;
      } else if (s.parent !== null){
	starView.focusStar = s.parent;
      }
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


