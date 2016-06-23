
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
    var rng = new PRng();
    rng.seed("buffalo");
    var r = new Region(rng, 40, -2, 2);

    console.log(r.data);
  });

});
