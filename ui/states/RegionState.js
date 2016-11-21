
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'd3',
      'handlebars',
      'kit/common/PRng',
      'kit/space/Region',
      'kit/space/StellarBody',
      'ui/common/Emitter',
      'ui/common/DOMEventNotifier',
      'ui/ctrls/HoverPanelCtrl',
      'ui/ctrls/StarEditorCtrl',
      'ui/ctrls/CreateRegionCtrl',
      'ui/view/RegionView'
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
	require('../../kit/space/Region'),
	require('../../kit/space/StellarBody'),
	require('../common/Emitter'),
	require('../common/DOMEventNotifier'),
	require('../ctrls/HoverPanelCtrl'),
	require('../ctrls/StarEditorCtrl'),
	require('../ctrls/CreateRegionCtrl'),
	require('../view/RegionView')
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
      'GSTK.space.Region',
      'GSTK.space.StellarBody',
      'ui.common.Emitter',
      'ui.common.DOMEventNotifier',
      'ui.ctrls.HoverPanelCtrl',
      'ui.ctrls.StarEditorCtrl',
      'ui.ctrls.CreateRegionCtrl',
      'ui.view.RegionView'
    ]) === false){
      throw new Error("Required component not defined.");
    }

    root.$sys.def (root, "ui.states.RegionState", factory(
      root.d3,
      root.handlebars,
      root.GSTK.common.PRng,
      root.GSTK.space.Region,
      root.GSTK.space.StellarBody,
      root.ui.common.Emitter,
      root.ui.common.DOMEventNotifier,
      root.ui.ctrls.HoverPanelCtrl,
      root.ui.ctrls.StarEditorCtrl,
      root.ui.ctrls.CreateRegionCtrl,
      root.ui.view.RegionView
    ));
  }
})(this, function (d3, handlebars, PRng, Region, StellarBody, Emitter, DOMEventNotifier, HoverPanelCtrl, StarEditorCtrl, CreateRegionCtrl, RegionView) {

  function BuildInfoPanel(context){
    var source   = d3.select("#TMPL-Infomation").html();
    var template = handlebars.compile(source);
    var html = template(context);
    var infodiv = d3.select(".hoverPanel.stellarBodyInfo");
    infodiv.selectAll().remove();
    infodiv.html(html);
  };

  function RegionState(dom, options){
    Emitter.call(this);
    var self = this;
    var svg = dom.append('svg')
	.attr("width", "100%")
	.attr("height", "100%");
    var map = svg.append("g");
    
    var mapSize = Math.min(DOMEventNotifier.getWidth(), DOMEventNotifier.getHeight());
    var hmapSize = Math.round(mapSize*0.5);

    var infoPanel = new HoverPanelCtrl(d3.select(".hoverPanel.stellarBodyInfo"));
    infoPanel.edge = HoverPanelCtrl.Edge.Right;
    infoPanel.flipEdge = true;
    infoPanel.offsetY = 20;
    var infoPanelIntervalID = null;

    var regionView = new RegionView(map);
    regionView.pixelsPerParsec = 12;
    regionView.mapSize = mapSize;

    var createRegionPanel = new CreateRegionCtrl(d3.select(".hoverPanel.createRegion"));
    createRegionPanel.edge = HoverPanelCtrl.Edge.Center;

    var menuPanel = new HoverPanelCtrl(d3.select(".hoverPanel.RegionMenu"));
    menuPanel.edge = HoverPanelCtrl.Edge.Left;
    menuPanel.flipEdge = false;

    var selectedPanel = new HoverPanelCtrl(d3.select(".hoverPanel.RegionStarSelection"));
    selectedPanel.edge = HoverPanelCtrl.Edge.VCenter | HoverPanelCtrl.Edge.Right;
    selectedPanel.flipEdge = false;
    var selectedStar = null;

    var starEditorPanel = new StarEditorCtrl(d3.select(".hoverPanel.starEditor"));
    starEditorPanel.edge = HoverPanelCtrl.Edge.VCenter | HoverPanelCtrl.Edge.Right;
    starEditorPanel.flipEdge = false;

    // -------------------------------------------------------------------------------------------------------------------------------
    // Defining createRegionPanel events...
    createRegionPanel.on("createregion", function(){
      if (createRegionPanel.density === 0){
	self.generate({
	  radius: createRegionPanel.radius,
	  emptyRegion:true
	});
      } else {
	self.generate({
	  seed: createRegionPanel.seed,
	  radius: createRegionPanel.radius,
	  density: createRegionPanel.density,
	  systemAtOrigin: true
	});
      }
      createRegionPanel.show(false);
      menuPanel.show(true);
    });
    createRegionPanel.on("cancel", function(){
      createRegionPanel.show(false);
      if (regionView.region === null){
	self.emit("mainmenu");
      } else {
	menuPanel.show(true);
      }
    });
    

    // -------------------------------------------------------------------------------------------------------------------------------
    // Defining menuPanel events...
    menuPanel.on("filters", function(){
      menuPanel.showSection("regionfilters", true, true);
    });
    menuPanel.on("modify", function(){
      menuPanel.showSection("regionmodify", true, true);
    });
    menuPanel.on("regen", function(){
      menuPanel.show(false);
      createRegionPanel.show(true);
    });
    menuPanel.on("clear", function(){
      regionView.region.empty(true);
      regionView.render();
    });
    menuPanel.on("newstar", function(){
      menuPanel.show(false);

      regionView.showPlacerCursor = true;
      regionView.placerCursor = {radius:0, angle:0, z:0};
      regionView.render();
      starEditorPanel.maxRegionRadius = regionView.region.radius;
      starEditorPanel.reset();
      starEditorPanel.show(true);
    });
    menuPanel.on("export", function(){
      self.emit("exportregion", regionView.region.toString(true));
    });
    menuPanel.on("exitregionview", function(){
      self.emit("mainmenu");
    });
    menuPanel.on("back", function(){
      menuPanel.showSection("regionmain", true, true);
    });
    menuPanel.on("showall", function(){
      regionView.displayMode = 0;
      regionView.render();
    });
    menuPanel.on("showempty", function(){
      regionView.displayMode = 1;
      regionView.render();
    });
    menuPanel.on("shownonempty", function(){
      regionView.displayMode = 2;
      regionView.render();
    });
    menuPanel.on("showterrestrial", function(){
      regionView.displayMode = 3;
      regionView.render();
    });
    menuPanel.on("showhabitable", function(){
      regionView.displayMode = 4;
      regionView.render();
    });
    menuPanel.on("showasteroids", function(){
      regionView.displayMode = 5;
      regionView.render();
    });


    // -------------------------------------------------------------------------------------------------------------------------------
    // Defining selectedPanel events....
    selectedPanel.on("view", function(){
      selectedPanel.show(false);
      self.emit("starClicked", selectedStar);
      selectedStar = null;
    });
    selectedPanel.on("report", function(){
      var data = {stars:[]};
      var StarData = function(s){
	var i = {};
	i.name = s.name;
	if (s.localOrbit !== null){
	  i.orbit = {
	    apogee: s.localOrbit.rMin.toFixed(2),
	    perigee: s.localOrbit.rMax.toFixed(2),
	    period: s.localOrbit.period.toFixed(2)
	  };
	}
	i.sequence = s.sequence;
	i.class = s.class;
	i.mass = s.mass.toFixed(4);
	i.radius = s.radius*StellarBody.Convert.AU2KM;
	i.age = s.age.toFixed(2);
	i.temperature = s.temperature.toFixed(2);
	if (s.parent !== null){
	  i.parent = s.parent.name;
	}
	if (s.companionCount > 0){
	  s.companions = [];
	  for (var c=0; c < s.companionCount; s++){
	    s.companions.push(s.companions[c].body.name);
	  }
	}
	if (s.bodyCount > 0){
	  s.body = [];
	  var body = s.bodies;
	  for (var b=0; b < s.bodyCount; b++){
	    s.body.push({
	      type: StellarBody.TypeName(body[b].body.data._type),
	      name: body[b].body.name
	    });
	  }
	}

	return i;
      };

      data.stars.push(StarData(selectedStar));
      for (var i=0; i < selectedStar.companionCount; i++){
	data.stars.push(StarData(selectedStar.companions[i].body));
      }

      self.emit("report", data);
    });
    selectedPanel.on("remove", function(){
      selectedPanel.show(false);
      regionView.region.removeStar(selectedStar);
      regionView.select = null;
      selectedStar = null;
      menuPanel.show(true);
    });
    selectedPanel.on("export", function(){
      self.emit("exportstar", selectedStar.toString(true));
    });
    selectedPanel.on("cancel", function(){
      regionView.select = null;
      selectedStar = null;
      selectedPanel.show(false);
      menuPanel.show(true);
    });


    // -------------------------------------------------------------------------------------------------------------------------------
    // Defining starEditorPanel events...
    starEditorPanel.on("place", function(){
      var ops = {};
      if (starEditorPanel.starConfig !== null){
	ops = JSON.parse(JSON.stringify(starEditorPanel.starConfig));
      } else if (starEditorPanel.starName !== null){
	ops.name = starEditorPanel.starName;
      }
      ops.r = regionView.placerCursorRadius;
      ops.a = regionView.placerCursorAngle*(Math.PI/180);

      regionView.region.addStar(ops);
      regionView.showPlacerCursor = false;
      regionView.render();
      regionView.ping(ops.r, ops.a);
      starEditorPanel.show(false);
      menuPanel.show(true);
    });
    starEditorPanel.on("cancel", function(){
      regionView.showPlacerCursor = false;
      regionView.render();
      starEditorPanel.show(false);
      menuPanel.show(true);
    });
    starEditorPanel.on("regionanglechange", function(node, value){
      regionView.placerCursorAngle = Number(value);
      d3.select(node.parentNode.parentNode).select(".value").html(value);
      regionView.render();
    });
    starEditorPanel.on("regionradiuschange", function(node, value){
      regionView.placerCursorRadius = Number(value);
      d3.select(node.parentNode.parentNode).select(".value").html(value);
      regionView.render();
    });

    // -------------------------------------------------------------------------------------------------------------------------------
    // Defining regionView events...
    regionView.on("starover", function(d, i, event){
      var x = d3.event.x;
      var y = d3.event.y;

      if (selectedPanel.showing() === false){
	if (infoPanelIntervalID === null){
	  infoPanelIntervalID = setTimeout(function(){
	    clearTimeout(infoPanelIntervalID);
	    infoPanelIntervalID = null;

	    BuildInfoPanel({
	      item:
	      [
		{name:"Position", value:"(R:" + d.r.toFixed(2) + ", A:" + d.a.toFixed(2) + ")"},
		{name:"Name", value:d.star.name},
		{name:"Sequence", value:d.star.sequence + " / " + d.star.class},
		{name:"Mass", value:d.star.mass.toFixed(4), unit:"Solar Units"},
		{name:"Radius", value:d.star.radius.toFixed(4), unit:"AU"},
		{name:"Age", value:d.star.age.toFixed(2), unit:"bY"},
		{name:"Temperature", value:d.star.temperature.toFixed(2), unit:"k"}
	      ]
	    });
	    infoPanel.show(true, x, y);
	  }, 1000);
	}
	regionView.select = d;
      }
    });

    regionView.on("starout", function(d, i, event){
      if (infoPanelIntervalID !== null){
	clearTimeout(infoPanelIntervalID);
	infoPanelIntervalID = null;
      }
      if (infoPanel !== null){
	infoPanel.show(false);
      }
      regionView.select = null;
    });

    regionView.on("starclick", function(d, i, event){
      if (selectedPanel.showing() === false){
	menuPanel.show(false);
	selectedStar = d.star;
	var name = selectedStar.name;
	if (name.length > 12){
	  name = name.substr(0, 9) + "...";
	}
	selectedPanel.set({starname:name});
	selectedPanel.show(true);
      }
    });

    regionView.on("stardblclick", function(d, i, event){
      selectedPanel.show(false);
      selectedStar = null;
      self.emit("starClicked", d.star);
    });

    // -------------------------------------------------------------------------------------------------------------------------------
    // Handle Window Resize Events...
    DOMEventNotifier.on("resize", function(width, height){
      mapSize = Math.min(width, height);
      hmapSize = Math.round(mapSize*0.5);
      regionView.mapSize = mapSize;
      regionView.render();
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
	if (regionView.region !== null){
	  menuPanel.showSection("regionmain", true, true);
	  menuPanel.show(true, 0, 0);
	} else {
	  createRegionPanel.show(true);
	}
      } else if (enable === false && dom.classed("hidden") === false){
	dom.classed("hidden", true);
	menuPanel.show(false);
      }
    };

    this.addStar = function(options){
      if (regionView.region !== null && (typeof(options.star) === typeof({}) || typeof(options.star) === 'string')){
	try{
	  regionView.region.addStar(options);
	} catch (e) {
	  this.emit("error", e.message);
	}
      }
    };

    this.generate = function(options){
      if (regionView.region === null){
        regionView.region = new Region();
      }
      options = (typeof(options) === typeof({})) ? options : {};
      
      if (typeof(options.data) === 'string' || typeof(options.data) === typeof({})){
	try{
	  regionView.region.load(options.data);
	} catch (e) {
	  throw e;
	}
      } else {
	var r = regionView.region;
        r.setZBounds(
          (typeof(options.zmin) === 'number') ? options.zmin : 0,
          (typeof(options.zmax) === 'number') ? options.zmax : 0
        );
        r.radius = (typeof(options.radius) === 'number' && options.radius > 0) ? options.radius : 12;

	if (options.emptyRegion !== true){
	  if (typeof(options.seed) !== 'undefined'){
            r.seed = options.seed;
	  }
	  r.generate(
	    (typeof(options.density) === 'number' && options.density >= 0) ? options.density : 0,
	    options.systemAtOrigin === true,
	    true
	  );
	}
      }
      regionView.render();
    };
  }
  RegionState.prototype.__proto__ = Emitter.prototype;
  RegionState.prototype.constructor = RegionState;


  return RegionState;
});
