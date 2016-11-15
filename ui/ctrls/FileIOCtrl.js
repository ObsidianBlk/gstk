
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    /* -------------------------------------------------
       AMD style connection.
       ------------------------------------------------- */
    define([
      'd3',
      'ui/common/Emitter',
      'ui/ctrls/HoverPanelCtrl'
    ], factory);
  } else if (typeof exports === 'object') {
    /* -------------------------------------------------
       CommonJS style connection.
       ------------------------------------------------- */
    if(typeof module === "object" && module.exports){
      module.exports = factory(
	require('d3'),
	require('../common/Emitter'),
	require('./HoverPanelCtrl')
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
      'ui.common.Emitter',
      'ui.ctrls.HoverPanelCtrl'
    ]) === false){
      throw new Error("Required component not defined.");
    }

    root.$sys.def (root, "ui.ctrls.DialogBoxCtrl", factory(
      root.d3,
      root.ui.common.Emitter,
      root.ui.ctrls.HoverPanelCtrl
    ));
  }
})(this, function (d3, Emitter, HoverPanelCtrl) {

  function FileIOCtrl(dom){
    HoverPanelCtrl.call(this, dom);
    var self = this;
    var source = dom.select("#srcdata");
    var etarget = dom.select("div.section.export").select("#export");

    var exportFilename = "export.json";
    var exportDescription = "Export JSON";
    
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

    function DefineExport(d){
      if (d !== null){
	var blob = new Blob([d], {type: "application/json"});
	var url  = URL.createObjectURL(blob);

	etarget.attr("download", exportFilename)
	  .attr("href", url)
	  .text(exportDescription);
      }
    };

    Object.defineProperties(this, {
      "filename":{
	enumerable:true,
	get:function(){return exportFilename;},
	set:function(filename){
	  if (typeof(filename) !== 'string'){
	    throw new TypeError("Expected string value.");
	  }
	  exportFilename = filename;
	  DefineExport(source.node().value);
	}
      },

      "description":{
	enumerable:true,
	get:function(){return exportDescription;},
	set:function(description){
	  if (typeof(description) !== 'string'){
	    throw new TypeError("Expected string value.");
	  }
	  exportDescription = description;
	  DefineExport(source.node().value);
	}
      },
      
      "data":{
	enumerable: true,
	get:function(){
	  return source.node().value;
	},
	set:function(d){
	  if (d !== null && typeof(d) !== 'string'){
	    throw new TypeError("Expected a string or null value.");
	  }
	  source.node().value = (d === null) ? "" : d;
	  DefineExport(d);
	}
      }
    });
  }
  FileIOCtrl.prototype.__proto__ = HoverPanelCtrl.prototype;
  FileIOCtrl.prototype.constructor = FileIOCtrl;

  return FileIOCtrl;
  
});
