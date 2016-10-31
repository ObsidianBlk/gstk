
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'd3',
      'kit/common/PRng',
      'kit/space/Region',
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
	require('../../kit/common/PRng'),
	require('../../kit/space/Region'),
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
      'GSTK.common.PRng',
      'GSTK.space.Region',
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
      root.GSTK.common.PRng,
      root.GSTK.space.Region,
      root.ui.common.Emitter,
      root.ui.common.DOMEventNotifier,
      root.ui.ctrls.HoverPanelCtrl,
      root.ui.ctrls.StarEditorCtrl,
      root.ui.ctrls.CreateRegionCtrl,
      root.ui.view.RegionView
    ));
  }
})(this, function (d3, PRng, Region, Emitter, DOMEventNotifier, HoverPanelCtrl, StarEditorCtrl, CreateRegionCtrl, RegionView) {

  function RegionState(dom, options){
    Emitter.call(this);
    var self = this;
    var svg = dom.append('svg')
	.attr("width", "100%")
	.attr("height", "100%");
    var map = svg.append("g");
    
    var mapSize = Math.min(DOMEventNotifier.getWidth(), DOMEventNotifier.getHeight());
    var hmapSize = Math.round(mapSize*0.5);

    var infoPanel = new HoverPanelCtrl(d3.select(".hoverPanel.star"));
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
	  seed: "Bryan Miller", // TODO: Add a "seed" field to the region generator!
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
      self.emit("exportJSON", regionView.region.toString(true));
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
    selectedPanel.on("remove", function(){
      selectedPanel.show(false);
      regionView.region.removeStar(selectedStar);
      regionView.select = null;
      selectedStar = null;
      menuPanel.show(true);
    });
    selectedPanel.on("export", function(){
      self.emit("export-star", selectedStar.toString(true));
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

	    infoPanel.set({
	      position:"(R:" + d.r.toFixed(2) + ", A:" + d.a.toFixed(2) + ")",
	      name: d.star.name,
	      sequence: d.star.sequence + " / " + d.star.class,
	      mass: "" + d.star.mass,
	      radius: d.star.radius.toFixed(4),
	      age: d.star.age.toFixed(2),
	      temperature: "" + d.star.temperature,
	      orbitals:"unknown"
	      /*orbitals: "(" + 
		d.star.companionCount + " / " + 
		d.star.countBodiesOfType(GasGiant.Type) + " / " + 
		d.star.countBodiesOfType(Terrestrial.Type) + " / " + 
		d.star.countBodiesOfType(AsteroidBelt.Type) + ")"*/
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
      infoPanel.show(false);
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
        r.empty(true);
        r.setZBounds(
          (typeof(options.zmin) === 'number') ? options.zmin : 0,
          (typeof(options.zmax) === 'number') ? options.zmax : 0
        );
        r.radius = (typeof(options.radius) === 'number' && options.radius > 0) ? options.radius : 10;

	if (options.emptyRegion !== true){
          var rng = new PRng({seed:(typeof(options.seed) !== 'undefined') ? options.seed : Math.random().toString(), initDepth:5000});
          var volume = Math.PI*(r.radius*r.radius)*r.depth;
          var count = 1; // Adding one to make sure we always generate at least one!
	  if (typeof(options.density) === 'number' && options.density > 0){
	    count += (options.density*0.01)*volume;
	  } else {
	    count += Math.round(rng.value(volume*0.1, volume*0.95));
	  }

          if (options.systemAtOrigin === true){
            r.addStar({
              fullSystemGeneration:true,
              r:0,
              a:0
            });
            count -= 1;
          }
          for (var i=0; i < count; i++){
            r.addStar({fullSystemGeneration:true});
          }
	}
      }
      regionView.render();
    };
  }
  RegionState.prototype.__proto__ = Emitter.prototype;
  RegionState.prototype.constructor = RegionState;


  return RegionState;
});
