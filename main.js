
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
      var x = d3.event.translate[0] * d3.event.scale;
      var y = d3.event.translate[1] * d3.event.scale;
      scroller.attr("transform", "translate(" + x + ", " + y + ")scale(" + d3.event.scale + ")");
    }
    var zoom = d3.behavior.zoom()
      .scaleExtent([0.25, 4])
      .on("zoom", zoomed);

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
	  if (r !== null){
	    mapScale.domain([0, r.radius]).range([0, hmapSize]);
	  } else {
	    mapScale.domain([0, 1]).range([0, hmapSize]);
	  }
	}
      }
    });


    this.render = function(options){
      if (r === null){return;}
      var CompassRange = d3.range(0, 360, 30);

      svg.attr("transform", "translate(" + hmapSize + "," + hmapSize + ")").call(zoom);
      scroller.selectAll("*").remove();
      var data = r.systems;
	
      scroller.append("rect")
	.attr("x", mapScale(-r.radius)).attr("y", mapScale(-r.radius))
	.attr("width", mapScale(r.radius*2)).attr("height", mapScale(r.radius*2))
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




  function StarSystemRenderer(svg){
    var scroller = svg.append("g");
    var star = null;
    var mapSize = 1;
    var hmapSize = 1;
    var mapScale = d3.scale.linear().domain([0,1]).range([0,1]);

    var starRenderRadius = 6;
    var terrRenderRadius = [0.25, 0.5, 1, 2, 3];
    var ggRenderRadius = [2, 2.75, 3.5, 4.5];

    function zoomed() {
      var x = d3.event.translate[0] * d3.event.scale;
      var y = d3.event.translate[1] * d3.event.scale;
      scroller.attr("transform", "translate(" + x + ", " + y + ")scale(" + d3.event.scale + ")");
    }
    var zoom = d3.behavior.zoom()
      .scaleExtent([0.25, 4])
      .on("zoom", zoomed);

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
	    mapScale.domain([0, star.fullSystemRadius]).range([0, hmapSize]);
	  } else {
	    mapScale.domain([0, 1]).range([0, hmapSize]);
	  }
	}
      },

      "mapSize":{
	enumerate:true,
	get:function(){return mapSize;},
	set:function(size){
	  if (typeof(size) === 'number' && size > 0){
	    mapSize = size;
	    hmapSize = Math.round(mapSize*0.5);
	    if (star !== null){
	      mapScale.domain([0, star.fullSystemRadius]).range([0, hmapSize]);
	    } else {
	      mapScale.domain([0, 1]).range([0, hmapSize]);
	    }
	  }
	}
      }
    });

    function RenderStar(s, g){
      g.append("g")
	.attr("class", "star " + s.type.substring(0, 1))
	.append("circle")
	.attr("r", starRenderRadius);

      if (s.terrestrialCount > 0){
	var terr = g.selectAll("g")
	  .data(s.terrestrials)
	  .enter();

	terr.append("ellipse")
	  .attr("rx", function(d){
	    return mapScale(d.rMin);
	  })
	  .attr("ry", function(d){
	    return mapScale(d.rMax);
	  })
	  .attr("fill", "none")
	  .attr("stroke", "#A37F58")
	  .attr("strokeWidth", 0.1);

	terr.append("circle")
	  .attr("cy", function(d){
	    return mapScale(d.rMax);
	  })
	  .attr("r", function(d){
	    return terrRenderRadius[d.body.sizeIndex];
	  })
	  .attr("fill", "#A37F58")
	  .attr("stroke", "#7D5E3C")
	  .attr("strokeWidth", 0.1);
      }

      if (s.gasGiantCount > 0){
	var gg = g.selectAll("g")
	  .data(s.gasGiants)
	  .enter();

	gg.append("ellipse")
	  .attr("rx", function(d){
	    return mapScale(d.rMin);
	  })
	  .attr("ry", function(d){
	    return mapScale(d.rMax);
	  })
	  .attr("fill", "none")
	  .attr("stroke", "#CBF5E2")
	  .attr("strokeWidth", 0.1);

	gg.append("circle")
	  .attr("cy", function(d){
	    return mapScale(d.rMax);
	  })
	  .attr("r", function(d){
	    return ggRenderRadius[d.body.sizeIndex];
	  })
	  .attr("fill", "#CBF5E2")
	  .attr("stroke", "#89F5C4")
	  .attr("strokeWidth", 0.1);
      }

      if (s.asteroidCount > 0){
	var a = g.selectAll("g")
	  .data(s.asteroids)
	  .enter();

	a.append("ellipse")
	  .attr("rx", function(d){
	    return mapScale(d.rMin);
	  })
	  .attr("ry", function(d){
	    return mapScale(d.rMax);
	  })
	  .attr("fill", "none")
	  .attr("stroke", "#CBF5E2")
	  .attr("strokeWidth", 1.5);
      }
    }

    this.render = function(options){
      if (star === null){return;}

      svg.attr("transform", "translate(" + hmapSize + "," + hmapSize + ")").call(zoom);
      scroller.selectAll("*").remove();
      scroller.append("rect")
	.attr("x", mapScale(-star.fullSystemRadius)).attr("y", mapScale(-star.fullSystemRadius))
	.attr("width", mapScale(star.fullSystemRadius*2)).attr("height", mapScale(star.fullSystemRadius*2))
	.attr("fill", "#000000");

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
	    .attr("rx", mapScale(cdata.rMin))
	    .attr("ry", mapScale(cdata.rMax))
	    .attr("fill", "none")
	    .attr("stroke", "#FFDD00")
	    .attr("strokeWidth", 1);
	  var surf = scroller.append("g")
	    .attr("transform", "translate(" + mapScale(0) + ", " + mapScale(cdata.rMax) + ")");
	  RenderStar(cdata.companion, surf);
	}
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

    /*var btns = svg.selectAll("g")
      .data(options.events)
      .enter()
      .append("g")
      .attr("class", options.menuclass)
      .attr("transform", function (d, i){
	var x = options.x;
	var y = options.y + (i*(options.height + options.padding));
	return "translate(" + x + ", " + y + ")";
      });

    btns.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", options.width)
      .attr("height", options.height);
    
    btns.append("text")
      .attr("dominant-baseline", "middle")
      .attr("x", options.x + options.textoffset)
      .attr("y", options.height*0.5)
      .text(function(d){
	return d.name;
      });

    btns.on("click", function(d){
      self.emit(d.event);
    });*/
    

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
      ]
    });
    var mapSize = Math.min(window.innerWidth, window.innerHeight);
    var hmapSize = Math.round(mapSize*0.5);

    var map = svg.append("g")
      .attr("transform", "translate(" + hmapSize + "," + hmapSize + ") scale(0.9)");

    var regionRenderer = new RegionRenderer(map);
    regionRenderer.pixelsPerParsec = 12;
    regionRenderer.mapSize = Math.min(window.innerWidth, window.innerHeight);

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
    

    d3.select(window).on("resize", function(){
      mapSize = Math.min(window.innerWidth, window.innerHeight);
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
      options = (typeof(options) === typeof({})) ? JSON.parse(JSON.stringify(options)) : {};
      regionRenderer.region = new Region(options);
      regionRenderer.region.generate();
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
    var mapSize = Math.min(window.innerWidth, window.innerHeight);
    var hmapSize = Math.round(mapSize*0.5);

    var map = svg.append("g")
      .attr("transform", "translate(" + hmapSize + "," + hmapSize + ") scale(0.9)");

    var starRenderer = new StarSystemRenderer(map);
    starRenderer.mapSize = Math.min(window.innerWidth, window.innerHeight);

    d3.select(window).on("resize", function(){
      mapSize = Math.min(window.innerWidth, window.innerHeight);
      hmapSize = Math.round(mapSize*0.5);
      starRenderer.mapSize = mapSize;
      starRenderer.render();
    });

    this.hidden = function(){
      return dom.classed("hidden");
    };

    this.show = function(enable){
      enable = (enable === false) ? false : true;
      if (enable && dom.classed("hidden")){
	dom.classed("hidden", false);
      } else if (enable === false && dom.classed("hidden") === false){
	dom.classed("hidden", true);
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
  // MAIN

  ready(function(){
    var regionRadius = 21;
    var seed = "Bryan Miller";

    var starsystemctrl = new StarSystemCtrl("StarsystemPanel");
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

    mainmenu.on("loadRegion", function(){console.log("Load Region!");});
    mainmenu.on("quit", function(){console.log("Quit! ... Ummm, not yet");});
  });

});
