
module.exports = (function(){

  var PRng = require('./kit/PRng');
  var Star = require('./kit/space/Star');
  var StellarBody = require('./kit/space/StellarBody');

  return {
    run:function(){
      var rng = new PRng();
      //rng.seed(Math.random().toString());
      rng.seed("Bryan Miller");
      console.log(rng.state);

      var s = new Star(rng, {supportGardenWorlds:true});
      s.generateStellarBodies();

      console.log(s.data);
    }
  };
  
})();
