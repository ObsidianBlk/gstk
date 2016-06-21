
module.exports = (function(){

  var PRng = require('../PRng');
  var Star = require('./Star');

  function GenerateCompanions(rng, star, options){
    var stars = [];
    var count = (typeof(options.companionCount) === 'number' && options.companionCount >= 0) ? Math.floor(options.companionCount) : Math.floor(rng.value(0, 2));
    if (count <= 0){return;} // Nothing to do.
    if (count > 2){
      count = 2;
    }

    for (var i=0; i < count; i++){
      star.generateCompanion();
    }
  }



  function StarSystem(rng, options){
    var primaryStar = new Star(rng, options);
    GenerateCompanions(rng, primaryStar, options);
  }
  StarSystem.prototype.constructor = StarSystem;

  return StarSystem;
})();
