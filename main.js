
module.exports = (function(){

  var PRng = require('./kit/PRng');
  var Star = require('./kit/space/Star');
  var StellarBody = require('./kit/space/StellarBody');

  return {
    run:function(){
      var rng = new PRng();
      rng.seed(Math.random().toString());
      console.log(rng.state);

      var sb = new StellarBody(rng);
      console.log(sb.data);
    }
  };
  
})();
