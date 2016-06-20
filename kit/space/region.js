

module.exports = (function(){

  function Region(radius, zmin, zmax, density, sysAtOrigin){
    sysAtOrigin = (sysAtOrigin === true) ? true : false;

    var parsecCount = Math.PI*(radius*radius)*(zmax - zmin);
    var totalStars = Math.floor(totalStars*density);
    if (totalStars <= 0){totalStars = 1;}

    var systems = [];
  }
  Region.prototype.constructor = Region;

  return Region;
})();
