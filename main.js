
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
  'view/StarView'
], function(Emitter, DOMEventNotifier, PRng, Region, Star, StellarBody, GasGiant, Terrestrial, AsteroidBelt, RegionView, StarView){

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

  function RangeSliderInput(dom){
    Emitter.call(this);
    var valueDispNode = d3.select(dom.node().parentNode.parentNode).select(".value");
    var self = this;
    var fixedSize = 4;
    var updateValueDisplayFuncDef = function(d3node, value){
      if (d3node.empty() === false){
	d3node.html(Number(value).toFixed(fixedSize));
      }
    };
    var updateValueDisplayFunc = updateValueDisplayFuncDef;
    
    function HandleChange(){
      var node = d3.select(this).node();
      var value = d3.select(this).node().value;
      updateValueDisplayFunc(d3.select(node.parentNode.parentNode).select(".value"), value);
      self.emit("change", this, value);
    }

    function ForceRefresh(){
      dom.node().value++;
      dom.node().value--;
      updateValueDisplayFuncDef(valueDispNode, dom.node().value);
    }

    dom.on("change", HandleChange)
      .on("input", HandleChange);

    Object.defineProperties(this, {
      "value":{
        enumerate:true,
        get:function(){return Number(dom.node().value);},
        set:function(v){
          if (typeof(v) !== 'number'){
	    throw new TypeError("Expected a number value.");
	  }
	  dom.node().value = v;
	  updateValueDisplayFuncDef(valueDispNode, v);
	  self.emit("change", dom.node(), v);
        }
      },

      "max":{
	enumerate:true,
	get:function(){return Number(dom.attr("max"));},
	set:function(m){
	  if (typeof(m) !== 'number'){
	    throw new TypeError("Expected number value.");
	  }
	  var val = Number(dom.attr("value"));
	  if (m < val){
	    dom.attr("value", m);
	  }
	  dom.attr("max", m);
	  ForceRefresh();
	}
      },

      "min":{
	enumerate:true,
	get:function(){return Number(dom.attr("min"));},
	set:function(m){
	  if (typeof(m) !== 'number'){
	    throw new TypeError("Expected number value.");
	  }
	  var val = Number(dom.attr("value"));
	  if (m > val){
	    dom.attr("value", m);
	  }
	  dom.attr("min", m);
	  ForceRefresh();
	}
      },

      "fixedSize":{
	enumerate:true,
	get:function(){return fixedSize;},
	set:function(fs){
	  if (typeof(fs) !== 'number'){
	    throw new TypeError("Expected number value.");
	  }
	  if (fs < 0){
	    throw new RangeError("Value must be zero or greater.");
	  }
	  fixedSize = fs;
	  ForceRefresh();
	}
      },

      "updateValueDisplayFunc":{
	get:function(){return updateValueDisplayFunc;},
	set:function(f){
	  if (typeof(f) === 'function'){
	    updateValueDisplayFunc = f;
	  } else if (f === null){
	    updateValueDisplayFunc = updateValueDisplayFuncDef;
	  }
	}
      }
    });
  }
  RangeSliderInput.prototype.__proto__ = Emitter.prototype;
  RangeSliderInput.prototype.constructor = RangeSliderInput;


  // -------------------------------------------------------------------------------------------------------------------------------------
  // STATES
  // -------------------------------------------------------------------------------------------------------------------------------------

  function HoverPanelCtrl(dom){
    Emitter.call(this);
    if (dom.classed("hoverPanel") === false){
      throw new Error("Element does not contain required class");
    }
    var BTNEvents = [];

    function onMenuLink(){
      d3.select(this).selectAll("a").each(function(){
	var parent = d3.select(this.parentNode.parentNode);
	var isTab = parent.classed("tabs");
	var a = d3.select(this);
	var event = a.attr("id");
	BTNEvents.push((isTab === true) ? "tab-" + event : event);
	a.on("click", (function(ename){
	  return function(){
	    if (isTab === false || a.classed("selected") === false){
	      parent.selectAll(".selected").classed("selected", false);
	      a.classed("selected", true);
	      self.emit((isTab === true) ? "tab-" + ename : ename);
	    }
	  };
	})(event));
      });
    }

    var self = this;
    (function(){
      dom.selectAll("ul.menu").each(onMenuLink);
      dom.selectAll("ul.hmenu").each(onMenuLink);
    })();

    DOMEventNotifier.on("resize", function(width, height){
      self.position(lastPosition[0], lastPosition[1], lastPosition[2]);
    });

    var lastPosition = [0, 0, false];
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
      },

      "events":{
	enumerate: true,
	get:function(){return BTNEvents;}
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
      ignoreEdges = (ignoreEdges === true) ? true : false;

      lastPosition[0] = x;
      lastPosition[1] = y;
      lastPosition[2] = ignoreEdges;

      x += posOffsetX;
      y += posOffsetY;

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

      if (x < 0){
	x = 0;
      } else if (x > _x){
	x = _x;
      }

      if (y < 0){
	y = 0;
      } else if (y > _y){
	y = _y;
      }

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

    this.showSection = function(secname, enable, hideOthers){
      enable = (enable === false) ? false : true;
      hideOthers = (hideOthers === true) ? true : false; // NOTE: hideOthers is used only when enabling other sections.

      // If secname is an array, it's assumed to be an array of section names, and all of those sections will be shown or hidden as requested.
      if (secname instanceof Array){
	if (enable === true && hideOthers === true){
	  dom.selectAll(".section").classed("hidden", true);
	}
	for (var i=0; i < secname.length; i++){
	  this.showSection(secname[i], enable, false);
	}
      } else if (typeof(secname) === 'string'){ // The secname is a string
	if (secname === "*"){ // If secname is "*" (wildcard for everything), enable or hide all!
	  dom.selectAll(".section").classed("hidden", !enable);
	} else { // secname is a named section and will enable/disable the section as desired.
	  var sec = dom.select(".section." +secname);
	  if (sec.empty() === false){ // Check to see if we have a section of the given name.
	    if (enable === true){
	      if (sec.classed("hidden") === true){
		if (hideOthers === true){
		  dom.selectAll(".section").classed("hidden", true);
		}
		sec.classed("hidden", false);
		if (dom.classed("hidden") === false){
		  var rect = dom.node().getBoundingClientRect();
		  this.position(rect.x, rect.y);
		}
	      }
	    } else if (sec.classed("hidden") === false){
	      sec.classed("hidden", true);
	    }
	  }
	}
      }
    };

    this.showing = function(){
      return (dom.classed("hidden") === false);
    };

    this.sectionShowing = function(secname){
      var sec = dom.select(".section." +secname);
      if (sec.empty() === false){
	return !sec.classed("hidden");
      }
      return false;
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

  function DialogPanelCtrl(dom){
    HoverPanelCtrl.call(this, dom);
    var self = this;
    var msgspan = dom.select(".heading");

    var Show = this.show.bind(this);
    this.show = function(enable, msg, x, y){
      msg = (typeof(msg) === 'string') ? msg : null;
      if (msg !== null){
	msgspan.text((enable === true) ? msg : "");
      }
      Show(enable, x, y);
    };

    this.events.forEach(function(evt){
      self.on(evt, function(){
	self.show(false);
      });
    });
  }
  DialogPanelCtrl.prototype.__proto__ = HoverPanelCtrl.prototype;
  DialogPanelCtrl.prototype.constructor = DialogPanelCtrl;

  // -------------------------------------------------------------------------------------------------------------------------------------

  function FileIOPanelCtrl(dom){
    HoverPanelCtrl.call(this, dom);
    var self = this;
    var source = dom.select("#srcdata");
    var etarget = dom.select("#export-target");
    
    source.on("drop", function(){
      var event = d3.event;
      event.stopPropagation();
      event.preventDefault();

      var files = event.dataTransfer.files; // FileList object.
      if (files.length > 0){
	var reader = new FileReader();  
	reader.onload = function(e) {            
          self.data = e.target.result;
	};
	reader.readAsText(files[0],"UTF-8");
      }
    });

    Object.defineProperties(this, {
      "data":{
	enumerate: true,
	get:function(){
	  return source.node().value;
	},
	set:function(d){
	  if (d !== null && typeof(d) !== 'string'){
	    throw new TypeError("Expected a string or null value.");
	  }
	  source.node().value = (d === null) ? "" : d;

	  etarget.select("*").remove();

	  if (d !== null){
	    var blob = new Blob([d], {type: "application/json"});
	    var url  = URL.createObjectURL(blob);

	    etarget.append("a")
	      .attr("download", "region.json")
	      .attr("href", url)
	      .text("Region JSON");
	  }
	}
      }
    });
  }
  FileIOPanelCtrl.prototype.__proto__ = HoverPanelCtrl.prototype;
  FileIOPanelCtrl.prototype.constructor = FileIOPanelCtrl;


  // -------------------------------------------------------------------------------------------------------------------------------------

  function StarEditorPanelCtrl(dom){
    HoverPanelCtrl.call(this, dom);
    var self = this;

    var usingConfig = false;
    var config = {
      arrangement: 0,
      companions: 0,
      maxBodies: 0
    };

    var AngleRange = new RangeSliderInput(d3.select("#region-cursor-angle"));
    AngleRange.on("change", function(node, value){
      self.emit("regionanglechange", node, value);
    });

    var RadiusRange = new RangeSliderInput(d3.select("#region-cursor-radius"));
    RadiusRange.on("change", function(node, value){
      self.emit("regionradiuschange", node, value);
    });

    var AgeRange = new RangeSliderInput(d3.select("#star-age"));
    AgeRange.on("change", function(node, value){
      config.age = Number(value);
      self.emit("staragechange", node, value);
    });

    var MassRange = new RangeSliderInput(d3.select("#star-mass"));
    MassRange.on("change", function(node, value){
      config.mass = Number(value);
      self.emit("starmasschange", node, value);
    });

    var CompanionRange = new RangeSliderInput(d3.select("#star-companions"));
    CompanionRange.on("change", function(node, value){
      config.companions = Number(value);
      self.emit("starcompanionschange", node, value);
    });

    var BodiesRange = new RangeSliderInput(d3.select("#star-bodies"));
    BodiesRange.on("change", function(node, value){
      config.maxBodies = Number(value);
      self.emit("starbodieschange", node, value);
    });

    var ArrangementRange = new RangeSliderInput(d3.select("#star-arrangement"));
    ArrangementRange.on("change", function(node, value){
      config.arrangement = Number(value);
      self.emit("stararrangementchange", node, value);
    });

    this.on("tab-genrandom", function(){
      usingConfig = false;
      self.showSection("fulleditor", false);
    });

    this.on("tab-gencustom", function(){
      usingConfig = true;
      self.showSection("fulleditor", true);
    });

    Object.defineProperties(this, {
      "maxRegionRadius":{
	enumerate: true,
	get:function(){return RadiusRange.max;},
	set:function(r){
	  if (typeof(r) !== 'number'){
	    throw new TypeError("Expected a number value.");
	  }
	  if (r <= 0){
	    throw new RangeError();
	  }
	  RadiusRange.value = 0;
	  RadiusRange.max = r;
	}
      },

      "regionRadius":{
	enumerate:true,
	get:function(){return RadiusRange.value;},
	set:function(r){
	  if (typeof(r) !== 'number'){
	    throw new TypeError("Expected a number value.");
	  }
	  if (r <= 0 || r > RadiusRange.max){
	    throw new RangeError();
	  }
	  RadiusRange.value = r;
	}
      },

      "regionAngle":{
	enumerate:true,
	get:function(){return AngleRange.value;},
	set:function(ang){
	  if (typeof(ang) !== 'number'){
	    throw new TypeError("Expected a number value.");
	  }
	  ang = (ang >= 0) ? ang%360.0 : 360 - (ang%360);
	  AngleRange.value = ang;
	}
      },

      "starName":{
	enumerate:true,
	get:function(){
	  var value = d3.select("#star-name").node().value;
	  if (value.length <= 0){
	    value = null;
	  }
	  return value;
	}
      },

      "starConfig":{
	enumerate:true,
	get:function(){
	  if (usingConfig === true){
	    var sname = d3.select("#star-name").node().value;
	    if (sname.length <= 0){
	      delete config.name;
	    } else {
	      config.name = sname;
	    }
	    return config;
	  }
	  return null;
	}
      }
    });


    this.reset = function(){
      RadiusRange.value = 0;
      AngleRange.value = 0;
    };
  }
  StarEditorPanelCtrl.prototype.__proto__ = HoverPanelCtrl.prototype;
  StarEditorPanelCtrl.prototype.constructor = StarEditorPanelCtrl;

  // -------------------------------------------------------------------------------------------------------------------------------------

  function BodyEditorPanelCtrl(dom){
    HoverPanelCtrl.call(this, dom);
    var self = this;

    var star = null;
    var NoUpdate = false;
    var genType = 0; // 0 = Random | 1 = Gas Giant | 2 = Terrestrial | 3 = Asteroid Belt
    var terrClass = 0;

    function UpdateTerrestrialClass(){
      var makeGarden = GardenRange.value >= 1;
      terrClass = Terrestrial.GetClassFromBlackbody(TerrSizeRange.value, BlackbodyRange.value, makeGarden, 0);
      var orbPeriod = star.bodyOrbitalPeriodFromRadius(OrbitRange.value) * 365; // Convert earth years to earth days.
      PeriodRange.max = orbPeriod;
      var drng = Terrestrial.GetDensityRange(TerrSizeRange.value, terrClass);
      DiameterRange.min = drng.min;
      DiameterRange.max = drng.max;
      self.set({terrclass: Terrestrial.ClassToName(terrClass)});
    }

    function UpdateGGMassDensityRanges(){
      var rng = GasGiant.MassDensityRangeFromIndexAndSize(
	GGMassIndexRange.value,
	GGSizeRange.value
      );
      GGMassRange.min = rng.massMin;
      GGMassRange.max = rng.massMax;
      GGDensityRange.min = rng.densityMin;
      GGDensityRange.max = rng.densityMax;
    }

    var OrbitRange = new RangeSliderInput(d3.select("#body-orbit"));
    OrbitRange.on("change", function(node, value){
      self.emit("orbitradiuschange", node, value);
      if (NoUpdate === false){
	if (star !== null){
	  NoUpdate = true;
	  BlackbodyRange.value = star.blackbodyFromOrbitRadius(Number(value));
	}
      } else {
	NoUpdate = false;
      }
      UpdateTerrestrialClass();
    });

    var EccentricityRange = new RangeSliderInput(d3.select("#body-oecc"));
    EccentricityRange.on("change", function(node, value){
      self.emit("orbiteccentricitychange", node, value);
    });

    var BlackbodyRange = new RangeSliderInput(d3.select("#body-blackbody"));
    BlackbodyRange.on("change", function(node, value){
      self.emit("blackbodychange", node, value);
      if (NoUpdate === false){
	if (star !== null){
	  NoUpdate = true;
	  OrbitRange.value = star.orbitRadiusFromBlackbody(Number(value));
	  console.log(OrbitRange.value);
	}
      } else {
	NoUpdate = false;
      }
      UpdateTerrestrialClass();
    });

    var TerrSizeRange = new RangeSliderInput(d3.select("#body-terrsize"));
    TerrSizeRange.updateValueDisplayFunc = function(d3node, value){
      if (d3node.empty() === false){
	d3node.html(Terrestrial.SizeToName(Number(value)));
      }
    };
    TerrSizeRange.on("change", function(node, value){
      self.emit("terrestrialsizechange", node, value);
      UpdateTerrestrialClass();
    });

    var DiameterRange = new RangeSliderInput(d3.select("#body-diameter"));
    DiameterRange.on("change", function(node, value){
      self.emit("diameterchange", node, value);
    });

    var AtmmassRange = new RangeSliderInput(d3.select("#body-atmmass"));
    AtmmassRange.on("change", function(node, value){
      self.emit("atmmasschange", node, value);
    });

    var HydroRange = new RangeSliderInput(d3.select("#body-hydro"));
    HydroRange.on("change", function(node, value){
      self.emit("hydrographicchange", node, value);
    });

    var PeriodRange = new RangeSliderInput(d3.select("#body-period"));
    PeriodRange.on("change", function(node, value){
      self.emit("rotperiodchange", node, value);
    });

    var AxisRange = new RangeSliderInput(d3.select("#body-axis"));
    AxisRange.on("change", function(node, value){
      self.emit("axischange", node, value);
    });

    var GardenRange = new RangeSliderInput(d3.select("#body-garden"));
    GardenRange.on("change", function(node, value){
      self.emit("gardenchange", node, value);
      UpdateTerrestrialClass();
    });

    var AstSizeRange = new RangeSliderInput(d3.select("#ast-size"));
    AstSizeRange.on("change", function(node, value){
      self.emit("asteroidsizechange", node, value);
      self.set({astsize: AsteroidBelt.SizeToName(Number(value))});
    });

    var ResourceIndexRange = new RangeSliderInput(d3.select("#resourceindex"));
    ResourceIndexRange.on("change", function(node, value){
      self.emit("resourceindexchange", node, value);
      var v = Number(value);
      if (v >= 0 && v < StellarBody.Table.ResourceValueTable.length){
	self.set({resourcedesc: StellarBody.Table.ResourceValueTable[v].desc});
      } else {
	self.set({resourcedesc: "UNKNOWN"});
      }
    });

    var GGSizeRange = new RangeSliderInput(d3.select("#gg-size"));
    GGSizeRange.on("change", function(node, value){
      self.emit("gasgiantsizechange", node, value);
      var v = Number(value);
      if (v === 0){
	self.set({ggsize: "Small"});
      } else if (v === 1){
	self.set({ggsize: "Standard"});
      } else if (v === 2){
	self.set({ggsize: "Large"});
      } else {
	self.set({ggsize: "UNKNOWN"});
      }
      UpdateGGMassDensityRanges();
    });

    var GGMassIndexRange = new RangeSliderInput(d3.select("#gg-mdindex"));
    GGMassIndexRange.on("change", function(node, value){
      self.emit("gasgiantmassindexchange", node, value);
      UpdateGGMassDensityRanges();
    });

    var GGMassRange = new RangeSliderInput(d3.select("#gg-mass"));
    GGMassIndexRange.on("change", function(node, value){
      self.emit("gasgiantmasschange", node, value);
    });

    var GGDensityRange = new RangeSliderInput(d3.select("#gg-density"));
    GGMassIndexRange.on("change", function(node, value){
      self.emit("gasgiantdensitychange", node, value);
    });

    this.on("tab-genrandom", function(){
      genType = 0;
      self.showSection("basiceditor", true, true);
    });

    this.on("tab-gengasgiant", function(){
      genType = 1;
      self.showSection(["basiceditor", "gasgianteditor", "orientationeditor"], true, true);
    });

    this.on("tab-genterrestrial", function(){
      genType = 2;
      self.showSection(["basiceditor", "terrestrialeditor", "orientationeditor", "resourceeditor"], true, true);
    });

    this.on("tab-genasteroidbelt", function(){
      genType = 3;
      self.showSection(["basiceditor", "asteroideditor", "resourceeditor"], true, true);
    });

    Object.defineProperties(this, {
      "bodyName":{
	enumerate:true,
	get:function(){
	  var value = d3.select("#body-name").node().value;
	  if (value.length <= 0){
	    value = null;
	  }
	  return value;
	}
      },

      "star":{
	enumerate:true,
	get:function(){return star;},
	set:function(s){
	  if (s === null){
	    star = null;
	  } else if (s instanceof Star){
	    star = s;
	    OrbitRange.min = star.limit.innerRadius;
	    OrbitRange.max = star.limit.outerRadius;
	    OrbitRange.value = star.limit.innerRadius;

	    BlackbodyRange.max = star.blackbodyFromOrbitRadius(star.limit.innerRadius);
	    BlackbodyRange.min = star.blackbodyFromOrbitRadius(star.limit.outerRadius);
	    BlackbodyRange.value = BlackbodyRange.max;
	  }
	}
      },

      "orbitalRadius":{
	enumerate:true,
	get:function(){return OrbitRange.value;}
      },

      "orbitalEccentricity":{
	enumerate:true,
	get:function(){return EccentricityRange.value;}
      },

      "terrestrialConfig":{
	enumerate:true,
	get:function(){
	  var ops = {
	    size: TerrSizeRange.value,
	    class: terrClass,
	    diameter: DiameterRange.value,
	    hydrographicPercent: HydroRange.value,
	    atmmass: AtmmassRange.value,
	    rotationPeriod: PeriodRange.value,
	    axialTile: AxisRange.value,
	    resourceIndex: ResourceIndexRange.value
	  };
	  var name = this.bodyName;
	  if (name !== null){
	    ops.name = name;
	  }
	  return ops;
	}
      },

      "asteroidBeltConfig":{
	enumerate:true,
	get:function(){
	  var ops = {
	    resourceIndex: ResourceIndexRange.value,
	    size: AstSizeRange.value
	  };
	  var name = this.bodyName;
	  if (name !== null){
	    ops.name = name;
	  }
	  return ops;
	}
      },

      "gasGiantConfig":{
	enumerate:true,
	get:function(){
	  var ops = {
	    size: GGSizeRange.value,
	    mass: GGMassRange.value,
	    density: GGDensityRange.value,
	    rotationPeriod: PeriodRange.value,
	    axialTile: AxisRange.value
	  };
	  var name = this.bodyName;
	  if (name !== null){
	    ops.name = name;
	  }
	  return ops;
	}
      },

      "blackbody":{
	enumerate:true,
	get:function(){return BlackbodyRange.value;}
      },

      "terrestrialClass":{
	enumerate:true,
	get:function(){return terrClass;}
      },

      "terrestrialSize":{
	enumerate:true,
	get:function(){return TerrSizeRange.value;}
      },

      "terrestrialDiameter":{
	enumerate:true,
	get:function(){return DiameterRange.value;}
      },

      "hydrographics":{
	enumerate:true,
	get:function(){return HydroRange.value;}
      },

      "atmosphericMass":{
	enumerate:true,
	get:function(){return AtmmassRange.value;}
      },

      "generationType":{
	enumerate:true,
	get:function(){return genType;}
      }
    });
  }
  BodyEditorPanelCtrl.prototype.__proto__ = HoverPanelCtrl.prototype;
  BodyEditorPanelCtrl.prototype.constructor = BodyEditorPanelCtrl;


  // -------------------------------------------------------------------------------------------------------------------------------------

  function NewRegionPanel(dom){
    HoverPanelCtrl.call(this, dom);
    var self = this;

    var RegRadiusRange = new RangeSliderInput(d3.select("#region-radius"));
    RegRadiusRange.on("change", function(node, value){
      self.emit("regionradiuschange", node, value);
    });

    var RegDensityRange = new RangeSliderInput(d3.select("#region-density"));
    RegRadiusRange.on("change", function(node, value){
      self.emit("regiondensitychange", node, value);
    });

    Object.defineProperties(this, {
      "radius":{
	enumerate:true,
	get:function(){return RegRadiusRange.value;}
      },

      "density":{
	enumerate:true,
	get:function(){return RegDensityRange.value;}
      }
    });
  }
  NewRegionPanel.prototype.__proto__ = HoverPanelCtrl.prototype;
  NewRegionPanel.prototype.constructor = NewRegionPanel;

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

    var selectedStar = null;

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
      if (typeof(mode) === 'number'){
	regionView.displayMode = mode;
      }
      regionView.render({
	mouseOver:handleMouseOver,
	mouseOut:handleMouseOut,
	click:handleClick
      });
    }

    var starSelectionPanel = new HoverPanelCtrl(d3.select(".hoverPanel.RegionStarSelection"));
    starSelectionPanel.edge = HoverPanelCtrl.Edge.VCenter | HoverPanelCtrl.Edge.Right;
    starSelectionPanel.flipEdge = false;
    starSelectionPanel.on("view", function(){
      starSelectionPanel.show(false);
      self.emit("starClicked", selectedStar);
      selectedStar = null;
    });
    starSelectionPanel.on("remove", function(){
      starSelectionPanel.show(false);
      regionView.region.removeStar(selectedStar);
      selectedStar = null;
      SetDisplayMode();
      menuPanel.show(true);
    });
    starSelectionPanel.on("export", function(){
      starSelectionPanel.show(false);
      regionView.region.removeStar(selectedStar);
      SetDisplayMode();
      self.emit("export-star", selectedStar.toString(true));
      selectedStar = null;
    });
    starSelectionPanel.on("cancel", function(){
      selectedStar = null;
      starSelectionPanel.show(false);
      menuPanel.show(true);
    });

    var starEditorPanel = new StarEditorPanelCtrl(d3.select(".hoverPanel.starEditor"));
    starEditorPanel.edge = HoverPanelCtrl.Edge.VCenter | HoverPanelCtrl.Edge.Right;
    starEditorPanel.flipEdge = false;
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
      SetDisplayMode();
      starEditorPanel.show(false);
      menuPanel.show(true);
    });
    starEditorPanel.on("cancel", function(){
      regionView.showPlacerCursor = false;
      SetDisplayMode();
      starEditorPanel.show(false);
      menuPanel.show(true);
    });
    starEditorPanel.on("regionanglechange", function(node, value){
      regionView.placerCursorAngle = Number(value);
      d3.select(node.parentNode.parentNode).select(".value").html(value);
      SetDisplayMode();
    });
    starEditorPanel.on("regionradiuschange", function(node, value){
      regionView.placerCursorRadius = Number(value);
      d3.select(node.parentNode.parentNode).select(".value").html(value);
      SetDisplayMode();
    });


    var createRegionPanel = new NewRegionPanel(d3.select(".hoverPanel.createRegion"));
    createRegionPanel.edge = HoverPanelCtrl.Edge.Center;
    createRegionPanel.on("createregion", function(){
      if (createRegionPanel.density === 0){
	self.generate({
	  radius: createRegionPanel.radius,
	  emptyRegion:true
	});
      } else {
	self.generate({
	  seed: "Bryan Miller",
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

    var menuPanel = new HoverPanelCtrl(d3.select(".hoverPanel.RegionMenu"));
    menuPanel.edge = HoverPanelCtrl.Edge.Left;
    menuPanel.flipEdge = false;
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
      SetDisplayMode();
    });
    menuPanel.on("newstar", function(){
      menuPanel.show(false);

      regionView.showPlacerCursor = true;
      regionView.placerCursor = {radius:0, angle:0, z:0};
      SetDisplayMode();
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

      if (starSelectionPanel.showing() === false){
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
      if (starSelectionPanel.showing() === false){
	menuPanel.show(false);
	selectedStar = d.star;
	var name = selectedStar.name;
	if (name.length > 12){
	  name = name.substr(0, 9) + "...";
	}
	starSelectionPanel.set({starname:name});
	starSelectionPanel.show(true);
      }
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
      SetDisplayMode();
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

    var bodyEditorPanel = new BodyEditorPanelCtrl(d3.select(".hoverPanel.bodyEditor"));
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
    var dialogBox = new DialogPanelCtrl(d3.select(".hoverPanel.DialogBox"));
    dialogBox.edge = HoverPanelCtrl.Edge.Center;
    dialogBox.flipEdge = false;

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
    var loader = new FileIOPanelCtrl(d3.select(".hoverPanel.FileIO"));
    loader.edge = HoverPanelCtrl.Edge.Center;
    loader.flipEdge = false;
    /*loader.on("close", function(){
      loader.show(false);
      mainmenu.show(true);
    });*/

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
