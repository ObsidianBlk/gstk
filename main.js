
requirejs.config({
  baseUrl:"./"
});

requirejs([
  'kit/PRng',
  'kit/space/Region'
], function(PRng, Region){

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



  ready(function(){
    var AU = Number("1.496e8");
    var mapSize = 1000;
    var hmapSize = Math.round(mapSize*0.5);
    var regionRadius = 42;
    //var seed = "Bryan Miller";
    var seed = Math.random().toString();
    var r = new Region(seed, regionRadius, -2, 2, {systemAtOrigin: true});
    r.generate();


    var mapScale = d3.scale.linear()
      .domain([0, regionRadius])
      .range([0, hmapSize]);
    var starScale = d3.scale.linear()
      .domain([0, 0.005*AU])
      .range([1.0, 3.0]);

    var svg = d3.select("body").append("svg").attr("width", mapSize).attr("height", mapSize);

    // Background
    svg.append("g").append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", mapSize)
      .attr("height", mapSize)
      .attr("fill", "#000000");

    var map = svg.append("g")
      .attr("transform", "translate(" + (mapSize*0.5) + "," + (mapSize*0.5) + ") scale(0.9)");

    var stars = map.append("g");

    // Rendering stars
    stars.selectAll("g")
      .data(r.systems)
      .enter()
      .append("g")
      .attr("class", function(d){
	return "star " + d.star.type.substring(0, 1);
      })
      .attr("transform", function(d){
	var x = mapScale(d.r*Math.cos(d.a));
	var y = mapScale(d.r*Math.sin(d.a));
	return "translate(" + x + ", " + y + ")";
      })
      .on("mouseover", handleStarMouseOver)
      .on("mouseout", handleStarMouseOut)
      .append("circle")
      .attr("id", function(d, i){
	return "circle_" + i;
      })
      .attr("r", function(d){
	return starScale(d.star.radius*AU);
      });


    // Rendering grid
    var majorRadius = 5;
    var grid = map.append("g").attr("class", "region-axis");

    grid.selectAll("circle")
      .data(d3.range(0, regionRadius+1, 3))
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
      .attr("x2", mapScale(regionRadius));

    a.append("text")
      .attr("x", mapScale(regionRadius + 1))
      .attr("dy", ".35em")
      .style("text-anchor", function(d) { return d < 270 && d > 90 ? "end" : null; })
      .attr("transform", function(d) { return d < 270 && d > 90 ? "rotate(180 " + mapScale(regionRadius + 1) + ", 0)" : null; })
      .text(function(d) { return d + "°"; });


    function TrimNameLength(name){
      if (name.length > 25){
	return name.substring(0, 22) + "...";
      }
      return name;
    }

    // -----------------
    // EVENT HANDLERS...
    function handleStarMouseOver(d, i){
      var star = d.star;
      var id = "STARTEXT_"+i;

      d3.select(this)
	.append("text")
	.attr("id", id)
	.attr("x", 6)
	.attr("dominant-baseline", "middle")
	.text("(" + d.r.toFixed(2) + ", " + d.a.toFixed(2) + ")\n" + TrimNameLength(star.name));

      d3.select("#circle_" + i)
	.attr("r", 5);
    }


    function handleStarMouseOut(d, i){
      var id = "STARTEXT_"+i;
      d3.select("#" + id).remove();

      d3.select("#circle_" + i)
	.attr("r", starScale(d.star.radius*AU));
    }

    console.log(r);
  });

});
