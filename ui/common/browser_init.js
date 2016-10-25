
if (typeof module === "object" && module.exports){
  throw new Error("Browser init in a NodeJS module context is not possible.");
} else if (typeof define === 'function' && define.amd){
  if (this.IgnoreCommonJS === true){
    console.error("CommonJS import system present. This may confuse objects loaded using the HTML <script> method.");
  } else {
    throw new Error("CommonJS import system exists. Will not initialize for browser.");
  }
}

if (typeof(this.$sys) === 'undefined'){
  var root = this;
  root.$sys = {
    exists: function(r, path){
      if (path instanceof Array){
        for (var i=0; i < path.length; i++){
          if (typeof(path[i]) === 'string'){
            if (root.$sys.exists(r, path[i]) === false){
              return false;
            }
          }
        }
        return true;
      }
      
      var pos = path.indexOf(".");
      if (pos < 0){
	return (typeof(r[path]) !== 'undefined');
      }

      var spath = path.substr(0, pos);
      if (typeof(r[spath]) === typeof({})){
	return root.$sys.exists(r[spath], path.substr(pos+1));
      }
      return false;
    },

    
    def: function(r, path, item){
      var pos = path.indexOf(".");
      if (pos < 0){
	r[path] = item;
      }

      var spath = path.substr(0, pos);
      if (typeof(r[spath]) !== typeof({})){
	r[spath] = {};
      }
      root.$sys.def (r[spath], path.substr(pos+1), item);
    }
  };
} else {
  console.error("Object '$sys' already defined. Either a second initialization attempt has been called, or there is a potential conflict in loaded scripts.");
}


