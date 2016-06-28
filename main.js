
requirejs.config({
  baseUrl:"./"
});

requirejs([
  'kit/PRng',
  'kit/space/Region',
  'kit/space/Star',
  'kit/space/StellarBody'
], function(PRng, Region, Star, StellarBody){

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
  // Application functions...
  var AU = Number("1.496e8");

  function TrimNameLength(name, maxlen){
    if (name.length > maxlen){
      return name.substring(0, maxlen-3) + "...";
    }
    return name;
  }

  function RegionRenderer(svg){

    var mapSize = 1;
    var hmapSize = 1;
    var mapScale = d3.scale.linear().domain([0,1]).range([0,1]);
    var starScale = d3.scale.linear()
      .domain([0, 0.01*AU])
      .range([1.0, 6.0]);
    var displayMode = 0; // All stars in region.
    var r = null;

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

      svg.attr("transform", "translate(" + hmapSize + "," + hmapSize + ") scale(0.9)");
      svg.selectAll("*").remove();
      var data = r.systems;

      var stars = svg.append("g");
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

      starGroups.append("circle")
	.attr("id", function(d, i){
	  return "circle_" + i;
	})
	.attr("r", function(d){
	  return starScale(d.star.radius*AU);
	});


      // Rendering grid
      var grid = svg.append("g").attr("class", "region-axis");

      grid.selectAll("circle")
	.data(d3.range(0, r.radius+1, 3))
	.enter()
	.append("circle")
	.attr("r", function(d){return mapScale(d);});

      var a = grid.selectAll("g")
	.data(d3.range(0, 360, 30))
	.enter().append("g")
	.attr("class", "region-axis")
	.attr("transform", function(d) { return "rotate(" + -d + ")"; });

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
    var star = null;
    var mapSize = 1;
    var hmapSize = 1;
    var mapScale = d3.scale.linear().domain([0,1]).range([0,1]);

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
	}
      },

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
      }
    });

    this.renderer = function(options){
      if (star === null){return;}

      svg.selectAll("*").remove();
      svg.attr("transform", "translate(" + hmapSize + "," + hmapSize + ") scale(0.9)");
    };
  }
  StarSystemRenderer.prototype.constructor = StarSystemRenderer;




  // -------------------------------------------------------------------------------------------------------------------------------------
  // MAIN

  ready(function(){
    var mapSize = 1000;
    var hmapSize = Math.round(mapSize*0.5);
    var regionRadius = 42;
    //var seed = "Bryan Miller";
    var seed = Math.random().toString();
    var r = new Region(seed, regionRadius, -2, 2, {systemAtOrigin: true});
    r.generate();

    var svg = d3.select("#RegionPanel")
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%");
      //.attr("preserveAspectRatio", "xMinYMin meet")
      //.attr("viewbox", "0 0 " + (regionRadius+20) + " " + (regionRadius+20));

    // Background
    /*svg.append("g").append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", mapSize)
      .attr("height", mapSize)
      .attr("fill", "#000000");*/

    var map = svg.append("g")
      .attr("transform", "translate(" + hmapSize + "," + hmapSize + ") scale(0.9)");

    var regionRenderer = new RegionRenderer(map);
    regionRenderer.region = r;
    regionRenderer.mapSize = Math.min(window.innerWidth, window.innerHeight);
    

    d3.select(window).on("resize", function(){
      mapSize = Math.min(window.innerWidth, window.innerHeight);
      regionRenderer.mapSize = mapSize;
      regionRenderer.render({
	mouseOver:mouseOver,
	mouseOut:mouseOut
      });
    });

    function mouseOver(d, i){
      var star = d.star;
      var id = "STARTEXT_"+i;

      d3.select(this)
	.append("text")
	.attr("id", id)
	.attr("x", 6)
	.attr("dominant-baseline", "middle")
	.text("(" + d.r.toFixed(2) + ", " + d.a.toFixed(2) + ")");

      d3.select("#circle_" + i)
	.attr("r", regionRenderer.starScale(0.01*AU));
    }

    function mouseOut(d, i){
      var id = "STARTEXT_"+i;
      d3.select("#" + id).remove();

      d3.select("#circle_" + i)
	.attr("r", regionRenderer.starScale(d.star.radius*AU));
    }

    regionRenderer.render({
      mouseOver:mouseOver,
      mouseOut:mouseOut
    });

    // -----------------
    // EVENT HANDLERS...

    console.log(r);
  });

});
