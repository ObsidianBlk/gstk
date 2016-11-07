
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
  'ui/states/RegionState',
  'ui/states/StarSystemState'
], function(d3, Handlebars, Emitter, DOMEventNotifier, HoverPanelCtrl, RangeSliderInput, DialogBoxCtrl, FileIOCtrl, RegionState, StarSystemState){

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
  DOMEventNotifier.enableRenderFrames();


  // -------------------------------------------------------------------------------------------------------------------------------------
  // MAIN

  ready(function(){

    var dialogBox = new DialogBoxCtrl(d3.select(".hoverPanel.DialogBox"));
    dialogBox.edge = HoverPanelCtrl.Edge.Center;
    dialogBox.flipEdge = false;

    var loader = new FileIOCtrl(d3.select(".hoverPanel.FileIO"));
    loader.edge = HoverPanelCtrl.Edge.Center;
    loader.flipEdge = false;

    function LoadRegion(){
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
    }


    function LoadStarSystem(){
      loader.show(false);
      regionctrl.addStar({star:loader.data});
    }

    function LoadPlanet(){

    }

    var starsystemctrl = new StarSystemState(d3.select("#StarsystemPanel"));
    starsystemctrl.on("region", function(){
      starsystemctrl.show(false);
      regionctrl.show(true);
    });
    starsystemctrl.on("error", function(msg){
      dialogBox.show(true, msg);
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
    regionctrl.on("exportregion", function(jstr){
      regionctrl.show(false);
      loader.data = jstr;
      loader.showSection("export", true, true);
      loader.show(true);
      loader.on("close", function(){
	loader.show(false);
	regionctrl.show(true);
      });
    });
    regionctrl.on("exportstar", function(data){
      regionctrl.show(false);
      loader.data = data;
      loader.unlistenEvent("load");
      loader.unlistenEvent("close");
      loader.showSection("export", true, true);
      loader.once("close", function(){
	loader.show(false);
	regionctrl.show(true);
      });
      loader.show(true);
    });
    regionctrl.on("error", function(msg){
      dialogBox.show(true, msg);
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
      loader.unlistenEvent("load");
      loader.unlistenEvent("close");
      loader.once("load", LoadRegion);
      loader.once("close", function(){
	loader.show(false);
	mainmenu.show(true);
      });
      loader.show(true);
    });
    mainmenu.on("quitapp", function(){
      dialogBox.show(true, "Quit! ... Ummmm, not yet.");
    });
    mainmenu.show(true);

    


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
      RenderOpeningScreen();
    });
    RenderOpeningScreen();
  });
});
