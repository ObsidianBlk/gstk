
module.exports = (function(){

  var PRng = require('./kit/PRng');
  var Star = require('./kit/space/Star');
  var StellarBody = require('./kit/space/StellarBody');

  return {
    run:function(){
      var rng = new PRng();
      //rng.seed(Math.random().toString());
      //rng.seed("Bryan Miller");
      rng.seed("sadf");
      console.log(rng.state);

      var s = new Star(rng.spawn(), {supportGardenWorlds:true});
      if (rng.uniform() > 0.75){
        s.generateCompanion();
        if (rng.uniform() > 0.75){
          s.generateCompanion();
        }
      }
      s.generateStellarBodies();

      console.log(s.data);
    }
  };
  
})();
