
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
    var regionRadius = 40;
    //var seed = "Bryan Miller";
    var seed = Math.random().toString();
    var r = new Region(seed, regionRadius, -2, 2, {systemAtOrigin: true});

    var mapScale = d3.scale.linear()
      .domain([-regionRadius, regionRadius])
      .range([0, mapSize]);
    var gridScale = d3.scale.linear()
      .domain([0, regionRadius])
      .range([0, mapSize*0.5]);
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

    var stars = svg.append("g");
    var grid = svg.append("g");

    // Rendering stars
    stars.selectAll("circle")
      .data(r.systems)
      .enter()
      .append("circle")
      .attr("cx", function(d){
	return mapScale(d.r*Math.cos(d.a));
      })
      .attr("cy", function(d){
	return mapScale(d.r*Math.sin(d.a));
      })
      .attr("r", function(d){
	console.log(starScale(d.star.radius*AU));
	return starScale(d.star.radius*AU);
      })
      .attr("fill", "#FFFFFF");

    // Rendering grid
    var majorRadius = 5;
    for (var i=1; i <= regionRadius; i++){
      if (i%majorRadius !== 0 && i !== regionRadius){
	grid.append("circle")
	  .attr("cx", mapScale(0)).attr("cy", mapScale(0))
	  .attr("r", gridScale(i))
	  .attr("fill", "none")
	  .attr("strokeWidth", 0.1)
	  .attr("stroke", "#000044");
      } else {
	grid.append("circle")
	  .attr("cx", mapScale(0)).attr("cy", mapScale(0))
	  .attr("r", gridScale(i))
	  .attr("fill", "none")
	  .attr("strokeWidth", 2)
	  .attr("stroke", "#0000FF");
      }
    }

    for (i=0; i < 360; i += 30){
      var x = regionRadius*Math.cos(i*(Math.PI/180));
      var y = regionRadius*Math.sin(i*(Math.PI/180));
      grid.append("line")
	.attr("x1", mapScale(0))
	.attr("y1", mapScale(0))
	.attr("x2", mapScale(x))
	.attr("y2", mapScale(y))
	.attr("strokeWidth", 1)
	.attr("stroke", "#0000FF");
    }
  });

});
