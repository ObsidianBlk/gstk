
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define(factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory();
    }
  } else {
    /* -------------------------------------------------
       Standard Browser style connection.
       ------------------------------------------------- */
    if (typeof(root.d3ui) !== typeof({})){
      root.D3UI = {};
    }
    root.D3UI = factory();
  }
})(this, function () {

  function D3Menu(svg, options){
    var menu = null;

    this.hidden = function(){
      return menu === null;
    };

    this.show = function(enable){
      enable = (enable === false) ? false : true;
      if (enable && menu === null){
	menu = svg.append("g");
	var btns = menu.selectAll("g")
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
	  if (typeof(d.callback) === 'function'){
	    d.callback(d.event);
	  }
	});
      }

      else if (enable === false && menu !== null){
	menu.remove();
        menu = null;
      }
    };
  }
  D3Menu.prototype.constructor = D3Menu;

  return D3Menu;

});
