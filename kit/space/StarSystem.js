
module.exports = (function(){

  var PRng = require('../PRng');

  var StellarEvolutionTable = [
    {mass: 0.10, type: "M7", temp: 3100, Lmin: 0.0012, Lmax: null, Mspan: null, Sspan: null, Gspan: null},
    {mass: 0.15, type: "M6", temp: 3200, Lmin: 0.0036, Lmax: null, Mspan: null, Sspan: null, Gspan: null},
    {mass: 0.20, type: "M5", temp: 3200, Lmin: 0.0079, Lmax: null, Mspan: null, Sspan: null, Gspan: null},
    {mass: 0.25, type: "M4", temp: 3300, Lmin: 0.015, Lmax: null, Mspan: null, Sspan: null, Gspan: null},
    {mass: 0.30, type: "M4", temp: 3300, Lmin: 0.024, Lmax: null, Mspan: null, Sspan: null, Gspan: null},
    {mass: 0.35, type: "M3", temp: 3400, Lmin: 0.037, Lmax: null, Mspan: null, Sspan: null, Gspan: null},
    {mass: 0.40, type: "M2", temp: 3500, Lmin: 0.054, Lmax: null, Mspan: null, Sspan: null, Gspan: null},
    {mass: 0.45, type: "M1", temp: 3700, Lmin: 0.07, Lmax: 0.08, Mspan: 70, Sspan: null, Gspan: null},
    {mass: 0.50, type: "M0", temp: 3800, Lmin: 0.09, Lmax: 0.11, Mspan: 59, Sspan: null, Gspan: null},
    {mass: 0.55, type: "K8", temp: 4000, Lmin: 0.11, Lmax: 0.15, Mspan: 50, Sspan: null, Gspan: null},
    {mass: 0.60, type: "K6", temp: 4200, Lmin: 0.13, Lmax: 0.20, Mspan: 42, Sspan: null, Gspan: null},
    {mass: 0.65, type: "K5", temp: 4400, Lmin: 0.15, Lmax: 0.25, Mspan: 37, Sspan: null, Gspan: null},
    {mass: 0.70, type: "K4", temp: 4600, Lmin: 0.19, Lmax: 0.35, Mspan: 30, Sspan: null, Gspan: null},
    {mass: 0.75, type: "K2", temp: 4900, Lmin: 0.23, Lmax: 0.48, Mspan: 24, Sspan: null, Gspan: null},
    {mass: 0.80, type: "K0", temp: 5200, Lmin: 0.28, Lmax: 0.65, Mspan: 20, Sspan: null, Gspan: null},
    {mass: 0.85, type: "G8", temp: 5400, Lmin: 0.36, Lmax: 0.84, Mspan: 17, Sspan: null, Gspan: null},
    {mass: 0.90, type: "G6", temp: 5500, Lmin: 0.45, Lmax: 1.00, Mspan: 14, Sspan: null, Gspan: null},
    {mass: 0.95, type: "G4", temp: 5700, Lmin: 0.56, Lmax: 1.30, Mspan: 12, Sspan: 1.8, Gspan: 1.1},
    {mass: 1.00, type: "G2", temp: 5800, Lmin: 0.68, Lmax: 1.60, Mspan: 10, Sspan: 1.6, Gspan: 1.0},
    {mass: 1.05, type: "G1", temp: 5900, Lmin: 0.87, Lmax: 1.90, Mspan: 8.8, Sspan: 1.4, Gspan: 0.8},
    {mass: 1.10, type: "G0", temp: 6000, Lmin: 1.10, Lmax: 2.20, Mspan: 7.7, Sspan: 1.2, Gspan: 0.7},
    {mass: 1.15, type: "F9", temp: 6100, Lmin: 1.40, Lmax: 2.60, Mspan: 6.7, Sspan: 1.0, Gspan: 0.6},
    {mass: 1.20, type: "F8", temp: 6300, Lmin: 1.70, Lmax: 3.00, Mspan: 5.9, Sspan: 0.9, Gspan: 0.6},
    {mass: 1.25, type: "F7", temp: 6400, Lmin: 2.10, Lmax: 3.50, Mspan: 5.2, Sspan: 0.8, Gspan: 0.5},
    {mass: 1.30, type: "F6", temp: 6500, Lmin: 2.50, Lmax: 3.90, Mspan: 4.6, Sspan: 0.7, Gspan: 0.4},
    {mass: 1.35, type: "F5", temp: 6600, Lmin: 3.10, Lmax: 4.50, Mspan: 4.1, Sspan: 0.6, Gspan: 0.4},
    {mass: 1.40, type: "F4", temp: 6700, Lmin: 3.70, Lmax: 5.10, Mspan: 3.7, Sspan: 0.6, Gspan: 0.4},
    {mass: 1.45, type: "F3", temp: 6900, Lmin: 4.30, Lmax: 5.70, Mspan: 3.3, Sspan: 0.5, Gspan: 0.3},
    {mass: 1.50, type: "F2", temp: 7000, Lmin: 5.10, Lmax: 6.50, Mspan: 3.0, Sspan: 0.5, Gspan: 0.3},
    {mass: 1.60, type: "F0", temp: 7300, Lmin: 6.70, Lmax: 8.20, Mspan: 2.5, Sspan: 0.4, Gspan: 0.2},
    {mass: 1.70, type: "A9", temp: 7500, Lmin: 8.60, Lmax: 10.0, Mspan: 2.1, Sspan: 0.3, Gspan: 0.2},
    {mass: 1.80, type: "A7", temp: 7800, Lmin: 11.0, Lmax: 13.0, Mspan: 1.8, Sspan: 0.3, Gspan: 0.2},
    {mass: 1.90, type: "A6", temp: 8000, Lmin: 13.0, Lmax: 16.0, Mspan: 1.5, Sspan: 0.2, Gspan: 0.1},
    {mass: 2.00, type: "A5", temp: 8200, Lmin: 16.0, Lmax: 20.0, Mspan: 1.3, Sspan: 0.2, Gspan: 0.1}
  ];

  function GetSETEntry(mass){
    for (var i=0; i < StellarEvolutionTable.length; i++){
      if (StellarEvolutionTable.mass === mass){
	return StellarEvolutionTable[i];
      }
    }
    return null;
  }

  function StarMassCalc(r1, r2){
    var Mass = function(base, adj, breaks){
      switch (breaks){
      case 2:
	if (r2 >= 3 && r2 <= 10){
	  return base;
	}
	return base - adj;
      case 3:
	if (r2 >= 3 && r2 <= 8){
	  return base;
	} else if (r2 >= 9 && r2 <= 11){
	  return base - adj;
	}
	return base - (adj*2);
      case 4:
	if (r2 >= 3 && r2 <= 7){
	  return base;
	} else if (r2 >= 8 && r2 <= 10){
	  return base - adj;
	} else if (r2 >= 11 && r2 <= 12){
	  return base - (adj*2);
	}
	return base - (adj*3);

      case 5:
	if (r2 >= 3 && r2 <= 7){
	  return base;
	} else if (r2 >= 8 && r2 <= 9){
	  return base - adj;
	} else if (r2 === 10){
	  return base - (adj*2);
	} else if (r2 >= 11 && r2 <= 12){
	  return base - (adj*3);
	}
	return base - (adj*4);
      }

      return base;
    };

    switch(r1){
    case 3:
      return Mass(2, 0.1, 2);
    case 4:
      return Mass(1.8, 0.1, 3);
    case 5:
      return Mass(1.5, 0.05, 4);
    case 6:
      return Mass(1.3, 0.05, 5);
    case 7:
      return Mass(1.05, 0.05, 5);
    case 8:
      return Mass(0.8, 0.05, 5);
    case 9:
      return Mass(0.55, 0.05, 3);
    case 10:
      return Mass(0.4, 0.05, 3);
      break;
    case 11:
      return 0.25;
    case 12:
      return 0.2;
    case 13:
      return 0.15;
    }

    return 0.1;
  }


  function StarAgeCalc(r1, r2, r3){
    var age = 0;

    if (r1 >= 4 && r1 <= 6){
      age += 0.1 + (r2*0.3) + (r3*0.05);
    } else if (r1 >= 7 && r1 <= 10){
      age += 2 + (r2*0.6) + (r3*0.1);
    } else if (r1 >= 11 && r1 <= 14){
      age += 5.6 + (r2*0.6) + (r3*0.1);
    } else if (r1 >= 15 && r1 <= 17){
      age += 8 + (r2*0.6) + (r3*0.1);
    } else {
      age += 10 + (r2*0.6) + (r3*0.1);
    }

    return age;
  }


  function GenStar(rng, options){
    // primaryMass = (typeof(primaryMass) === 'number' && primaryMass > 0) ? primaryMass : 0;

    var star = {};
    var r1 = 0;

    // Generate a companion star mass to the given primary star.
    if (typeof(options.primaryStar) !== 'undefined'){
      r1 = rng.rollDice(6, 1) - 1;
      star.mass = options.primaryStar.mass;
      if (r1 >= 1){
	if (star.mass >= 1.6){
	  star.mass += (1.5 - star.mass); // NOTE: This is a subtraction. Don't get confused by the "+="
	  r1 += (1.5 - star.mass)*10;
	  star.mass -= (0.5 * r1);
	} else {
	  if (star.mass - (r1 * 0.5) < 0.1){
	    star.mass = 0.1;
	  } else {
	    star.mass -= (r1*0.5);
	  }
	}
      }

    // Force the generation of a star mass that can more easily support a "Garden" world.
    } else if (options.supportGardenWorlds === true){
      r1 = 5;
      switch (rng.rollDice(6, 1)){
      case 2:
	r1 = 6; break;
      case 3: case 4:
	r1 = 7; break;
      case 5: case 6:
	r1 = 8; break;
      }
      star.mass = StarMassCalc(
	r1,
	rng.rollDice(6, 3)
      );

    // Full, random generation of a star mass.
    } else {
      star.mass = StarMassCalc(
	rng.rollDice(6, 3),
	rng.rollDice(6, 3)
      );
    }
    

    // -- Calculating Age
    if (typeof(options.primaryStar) !== 'undefined'){
      star.age = options.primaryStar.age;
    } else {
      star.age = StarAgeCalc(
	(options.supportGardenWorlds === true) ? rng.rollDice(6, 2)+2 : rng.rollDice(6, 3),
	rng.rollDice(6, 1)-1,
	rng.rollDice(6, 1)-1
      );
    }


    var sete = GetSETEntry(star.mass);
    // -- Storing the star's current, assumed temprature
    star.temp = sete.temp;

    // -- Calculating Luminosity Class
    star.lumClass = "V";
    if (sete.Mspan !== null){
      star.lumClass = "V";
      if (star.age > sete.Mspan && sete.Sspan === null){
	star.lumClass = "D";
      } else {
	if (star.age <= sete.Sspan){
	  star.lumClass = "IV";
	} else {
	  if (star.age <= sete.Gspan){
	    star.lumClass = "III";
	  } else {
	    star.lumClass = "D";
	  }
	}
      }
    }

    if (star.lumClass != "D"){
      // -- Calculating actual Luminosity
      if (star.mass <= 0.4){
	star.luminosity = sete.Lmin + (sete.Lmin*rng.value(-0.1, 0.1));
      } else if (star.mass <= 0.9){
	star.luminosity = sete.Lmin + ((star.age/sete.Mspan)*(sete.Lmax - sete.Lmin));
      }

      if (sete.Sspan !== null && star.age > sete.Mspan){
	// Adjusting for Sub-Giant stage
	star.temp -= ((star.age - sete.Mspan)/sete.Sspan)*(star.temp-4800); // Higher temprature.
	star.luminosity = sete.Lmax + (sete.Lmax * rng.value(-0.1, 0.1));

	if (star.age > sete.Sspan){
	  // Adjusting for Giant stage.
	  star.temp = 3000 + ((rng.rollDice(6, 2)-2) * 200);
	  star.luminosity *= 25;
	}
      }
    } else {
      // -- Recaluclating for a White Dwarf star.
      star.mass = 0.9 + ((rng.rollDice(6, 2) - 2)*0.05);
      star.luminosity = 0.001;
    }

    // -- Calculating radius...
    star.radius = (155000 * Math.sqrt(star.luminosity)) / (star.temp * star.temp);

    return star;
  }


  function CalcOrbitalInformation(rng, roll){
    var multi = 0.05;
    var mod = -6;
    if (roll > 6 && roll <= 9){
      multi = 0.5;
      mod = -4;
    } else if (roll > 9 && roll <= 11){
      multi = 2;
      mod = -2;
    } else if (roll > 11 && roll <= 14){
      multi = 10;
      mod = 0;
    } else {
      multi = 50;
      mod = 0;
    }
    var hmulti = 0.5 * multi;

    var oradius = rng.rollDice(6, 2)*multi;
    oradius += rng.value(-hmulti, hmulti);

    var e = 0;
    roll = (rng.rollDice(6, 3) + mod) - 3; // 0 basing
    e = (roll >= 15) ? 0.95 : roll*0.1;
    if (e < 0){ e = 0;}

    return {
      rmin: (1 - e) * oradius,
      rmax: (1 + e) * oradius
    };
  }

  function GenerateStars(rng, options){
    var stars = [];
    var count = (typeof(options.starCount) === 'number' && options.starCount >= 1) ? Math.floor(options.starCount) : Math.floor(rng.value(1, 3));
    if (count > 3){
      count = 3;
    }

    var ops = {
      supportGardenWorlds: (options.supportGardenWorlds === true) ? true : false
    };
    for (var i=0; i < count; i++){
      stars.push(GenStar(rng, options));
      if (i === 0){
	ops.primaryStar = stars[0];
      }
    }

    if (stars.length > 1){
      // Calculating for first companion...
      var roll = rng.rollDice(6, 3);
      if (options.supportGardenWorlds === true){
	roll += 4;
      }
      stars[1].orbit = CalcOrbitalInformation(rng, roll);

      if (stars.length === 3){
	roll = rng.rollDice(6, 3);
	if (options.supportGardenWorlds === true){
	  roll += 6;
	}
	stars[2].orbit = CalcOrbitalInformation(rng, roll);
      }
      
    }

    return stars;
  }



  function StarSystem(options, rng){
    if (!(rng instanceof PRng)){
      rng = new PRng();
      rng.seed(("seed" in options) ? options["seed"] : Math.random());
    }

    var ssdat = {
      stars: GenerateStars(rng, options),
      planets: []
    };
  }
  StarSystem.prototype.constructor = StarSystem;

  return StarSystem;
})();
