var mymap = L.map('mapid').setView([42.431071, 19.259379], 13);

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mymap);

// router koji komunicira sa lokalnim OSRM serverom
var myRouter = new L.Routing.OSRMv1({
  serviceUrl: 'http://localhost:5001/route/v1'
});

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
    // suvisno kad ima globalni router, ali neka stoji ako se ispostavi da postoji neka razlika
    // let myRoute = L.Routing.osrmv1({ serviceUrl: 'http://localhost:5001/route/v1' });
    
    for (let i = 0; i < waypoints.length-1; i++) {
      let wpPrev = waypoints[i];
      
      let rwpPrev = new L.Routing.Waypoint();
      rwpPrev.latLng = wpPrev;
      let rwpNew = new L.Routing.Waypoint();
      rwpNew.latLng = wpNew;
      
      // dodavanje podataka o novim rutama u matricu
      myRouter.route([rwpPrev, rwpNew], function(err, routes) {
        W[i].push(routes[0].summary.totalDistance);
      });
      myRouter.route([rwpNew, rwpPrev], function(err, routes) {
        W[waypoints.length-1][i] = routes[0].summary.totalDistance;
      });
    }
    console.table(W);
  }
}


mymap.on('click', addWaypoint);


async function findTour() {
  // dovlaci json sa backenda
  let response = await fetch('http://localhost:5000/find_tour', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({"W": W})
  })
  return response.json();
}

async function computeOptimalTour() {
  findTour()
  .then((data) => {
    let tour = data.tour;

    // ako bi zeljeli da iscrtamo vazdusne linije izmedju lokacija
    
    /*let polyPts = [];
    for (let i = 0; i < waypoints.length; i++) {
        polyPts.push(waypoints[tour[i]]);
    }
    var polygon = L.polygon([
        polyPts
    ]).addTo(mymap);*/
    
    for (let i = 0; i < waypoints.length-1; i++) {
      L.Routing.control({
        waypoints: [
          waypoints[tour[i]],
          waypoints[tour[i+1]]
        ],
        router: myRouter
      }).addTo(mymap);
    }
    L.Routing.control({
      waypoints: [
        waypoints[tour[tour.length-1]],
        waypoints[tour[0]]
      ],
      router: myRouter
    }).addTo(mymap);
  });
}