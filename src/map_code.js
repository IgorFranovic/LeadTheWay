var mymap = L.map('mapid').setView([42.431071, 19.259379], 13);

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mymap);

// lista lokacija koje treba obici
var waypoints = [];
// matrica tezina za tsp
var W = [];

// ako bude trebalo da se podaci o ruti zapakuju u geoJSON format
function getInstrGeoJson(instr,coord) {
    var formatter = new L.Routing.Formatter();
    var instrPts = {
      type: "FeatureCollection",
      features: []
    };
    for (var i = 0; i < instr.length; ++i) {
      var g = {
        "type": "Point",
        "coordinates": [coord[instr[i].index].lng, coord[instr[i].index].lat]
      };
      var p = {
        "instruction": formatter.formatInstruction(instr[i])
      };
      instrPts.features.push({
        "geometry": g,
        "type": "Feature",
        "properties": p
      });
    }
    return instrPts;
  }


function reloadElement(element_id){
    // Reloaduj element sa datim idem
    var container = document.getElementById(element_id);
    var content = container.innerHTML;
    container.innerHTML = content;

    console.log("Map Refreshed");
}

function isClose(l1, l2) {
    // Vraca True ako su lokacije blizu (korisno za brisanje nekog waypointa) (otprilike 0.5 cm sa zoomom do kraja)
    return (Math.sqrt((l1.lat - l2.lat)*(l1.lat - l2.lat) + (l1.lng - l2.lng)*(l1.lng - l2.lng)) <= 0.00015);
}

function addWaypoint(e) {
    let wpNew = L.latLng(e.latlng.lat, e.latlng.lng);

    // Pitaj korisnika je li siguran da unese waypoint
    // if (!confirm("Put waypoint at (" + wpNew.lat + ", " + wpNew.lng + ") ?")) return;

    // marker oznacen rednim brojem
    let marker = L.marker(wpNew).addTo(mymap).bindPopup(`${waypoints.length}`);
    
    waypoints.push(wpNew);

    console.log(waypoints);

    // prosiri matricu tezina novom vrstom
    W.push(Array(waypoints.length).fill(null));
    
    if (waypoints.length > 1) {
        let myRoute = L.Routing.osrmv1();
        for (let i = 0; i < waypoints.length-1; i++) {
          let wpPrev = waypoints[i];
          
          let rwpPrev = new L.Routing.Waypoint();
          rwpPrev.latLng = wpPrev;
          let rwpNew = new L.Routing.Waypoint();
          rwpNew.latLng = wpNew;
          
          // dodavanje podataka o novim rutama u matricu
          myRoute.route([rwpPrev, rwpNew], function(err, routes) {
            W[i].push(routes[0].summary.totalDistance);
          });
          myRoute.route([rwpNew, rwpPrev], function(err, routes) {
            W[waypoints.length-1][i] = routes[0].summary.totalDistance;
          });
        }
        console.table(W);
    }
}

mymap.on('click', addWaypoint);

// dio za GA

populationSize = 9;
mutationProbability = 0.8;

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let x = arr[i];
        arr[i] = arr[j];
        arr[j] = x;
    }
}

function randomPopulation() {
    let population = [];
    for (let i = 0; i < populationSize; i++) {
        // pravi niz 0, 1,..., n-1
        individual = Array.from(Array(waypoints.length).keys());
        shuffle(individual);
        population.push(individual);
    }
    return population
}

function fitness(individual) {
    let sum = 0.0;
    let wp1, wp2;
    for (let i = 0; i < waypoints.length-1; i++) {
        sum += W[individual[i]][individual[i + 1]]
    }
    sum += W[individual[waypoints.length - 1]][individual[0]];
    return waypoints.length/sum;
}

function randomSelection(population) {
    let fitnessSum = 0.0;
    for (let i = 0; i < population.length; i++) {
        fitnessSum += fitness(population[i]);
    }
    let pivot = Math.random()*fitnessSum;
    let partialSum = 0.0;
    for (let i = 0; i < population.length; i++) {
        partialSum += fitness(population[i]);
        if (partialSum >= pivot) {
            return population[i];
        }
    }
}

function partiallyMappedCrossover(x, y) {
    let crossoverPoint1, crossoverPoint2;
    crossoverPoint1 = Math.floor(Math.random()*waypoints.length);
    if (crossoverPoint1 <= Math.floor(waypoints.length/2)) {
        crossoverPoint2 = Math.floor(Math.random()*(waypoints.length - crossoverPoint1)) + crossoverPoint1 + 1; 
    }
    else {
        crossoverPoint2 = crossoverPoint1;
        crossoverPoint1 = Math.floor(Math.random()*crossoverPoint2);
    }
    let child1 = new Array(waypoints.length).fill(-1);
    for (let i = crossoverPoint1; i <= crossoverPoint2; i++) {
        child1[i] = x[i];
    }
    for (let i = crossoverPoint1; i <= crossoverPoint2; i++) {
        let t = y[i];
        if (!x.slice(crossoverPoint1, crossoverPoint2+1).includes(t)) {
            let ind = y.indexOf(t);
            while ( crossoverPoint1 <= ind && ind <= crossoverPoint2) {
                let temp = x[ind];
                ind = y.indexOf(temp);
            }
            child1[ind] = t;
        }
    }
    for (let i = 0; i < waypoints.length; i++) {
        if (child1[i] == -1) {
            child1[i] = y[i];
        }
    }

    let child2 = new Array(waypoints.length).fill(-1);
    for (let i = crossoverPoint1; i <= crossoverPoint2; i++) {
        child2[i] = y[i];
    }
    for (let i = crossoverPoint1; i <= crossoverPoint2; i++) {
        let t = x[i];
        if (!y.slice(crossoverPoint1, crossoverPoint2+1).includes(t)) {
            let ind = x.indexOf(t);
            while (crossoverPoint1 <= ind && ind <= crossoverPoint2) {
                let temp = y[ind];
                ind = x.indexOf(temp);
            }
            child2[ind] = t;
        }
    }
    for (let i = 0; i < waypoints.length; i++) {
        if (child2[i] == -1) {
            child2[i] = x[i];
        }
    }

    return [child1, child2];
}

function mutation(child) {
    let mutationPoint1 = Math.floor(Math.random()*waypoints.length);
    let mutationPoint2 = Math.floor(Math.random()*waypoints.length);
    let temp = child[mutationPoint1];
    child[mutationPoint1] = child[mutationPoint2];
    child[mutationPoint2] = temp;
}

function geneticAlgorithm() {
    let population = randomPopulation();
    for (let cnt = 0; cnt < 3; cnt++) {
        console.log('Iteracija', cnt);
        let eliteIndividual = population[0];
        for (let i = 1; i < populationSize; i++) {
            if (fitness(population[i]) > fitness(eliteIndividual)) {
                eliteIndividual = population[i];
            }
        }
        console.log('Trenutni najbolji:');
        console.log(eliteIndividual);
        console.log(fitness(eliteIndividual));
        let newPopulation = [];
        newPopulation.push(eliteIndividual);
        for (let i = 0; i < Math.floor(populationSize/2); i++) {
            let x = randomSelection(population);
            let y = randomSelection(population);
            let children = partiallyMappedCrossover(x, y);
            if (Math.random() < mutationProbability) {
                mutation(children[0]);
            }
            if (Math.random() < mutationProbability) {
                mutation(children[1]);
            }
            newPopulation = newPopulation.concat(children);
        }
        population = newPopulation;
    }
    return population[0];
}

function computeOptimalTour() {
    let tour = geneticAlgorithm();
    /*let polyPts = [];
    for (let i = 0; i < waypoints.length; i++) {
        polyPts.push(waypoints[tour[i]]);
    }
    var polygon = L.polygon([
        polyPts
    ]).addTo(mymap);
    */
    for (let i = 1; i < waypoints.length; i++) {
        L.Routing.control({
            waypoints: [
                waypoints[tour[i-1]],
                waypoints[tour[i]]
        ]
        }).addTo(mymap);
    }
}