/*=============================
Osnovno
===============================*/

// localStorage.removeItem('accessToken');
var currUser = JSON.parse(localStorage.getItem('currUser'));
var accessToken = null;
if (currUser !== null) {
  accessToken = currUser.token;
}

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
// matrica rastojanja za tsp
var W = [];
// 3d niz u kojem je C[i][j] = niz koordinata koje odredjuju rutu i->j
var coords = [];
// lista markera na mapi
var markers = [];




/*=============================
Ovaj dio za sad ne koristimo
===============================*/

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




/*=============================
Rad sa markerima
===============================*/

mymap.on('click', (e) => {
  addWaypoint(e.latlng.lat, e.latlng.lng);
});

function addWaypoint(lat, lng) {
  let wpNew = L.latLng(lat, lng);

  // marker oznacen rednim brojem
  let marker = L.marker(wpNew).addTo(mymap).bindPopup(`${waypoints.length}`);
  markers.push(marker);
  
  waypoints.push(wpNew);

  // prosiri matricu tezina novom vrstom
  W.push(Array(waypoints.length).fill(0));
  coords.push(Array(waypoints.length).fill(null));
  
  if (waypoints.length > 1) {
    for (let i = 0; i < waypoints.length-1; i++) {
      let wpPrev = waypoints[i];
      
      let rwpPrev = new L.Routing.Waypoint();
      rwpPrev.latLng = wpPrev;
      let rwpNew = new L.Routing.Waypoint();
      rwpNew.latLng = wpNew;
      
      // dodavanje podataka o novim rutama u matricu
      myRouter.route([rwpPrev, rwpNew], function(err, routes) {
        W[i].push(routes[0].summary.totalDistance);
        coords[i].push(routes[0].coordinates);
      });
      myRouter.route([rwpNew, rwpPrev], function(err, routes) {
        W[waypoints.length-1][i] = routes[0].summary.totalDistance;
        coords[waypoints.length-1][i] = routes[0].coordinates;
      });
    }
  }
}

function clearMarkers() {
  for (let marker of markers) {
    marker.remove();
  }
  markers = [];
  waypoints = [];
  W = [];
  coords = [];
}




/*=============================
Rad sa rutama
===============================*/

// niz objekata koji odgovaraju pojedinim rutama (A -> B)
var routeControls = [];
// tekuci obilazak - permutacija brojeva 0,...,n-1
var tour = [];

// dodaje jednu rutu oblika A->B na mapu
function addRouteToMap(wp1, wp2) {
  let r = L.Routing.control({
    waypoints: [wp1, wp2],
    router: myRouter,
    lineOptions: {
      styles: [{color: 'blue', opacity: 1, weight: 3}]
    },
    fitSelectedRoutes: false
  });
  let dirBlock = r.onAdd(mymap);
  document.querySelector('#directions').appendChild(dirBlock);
  routeControls.push(r);
  
}

// dovlaci json sa backenda
async function findTour() {
  let response = await fetch('http://localhost:5000/find_tour', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({"W": W, "R": coords})
  });
  return response.json();
  
}

// dodaje kompletan obilazak na mapu
async function addTourToMap() {
  /* Play loading animation */
  document.getElementById("loader").style.display = "inline-block";
  
  clearRoutes();
  routeControls = [];

  if(waypoints.length < 2) {
    /* Stop loading animation */
    document.getElementById("loader").style.display = "none";
    return;
  }

  else if (waypoints.length === 2) {
    addRouteToMap(waypoints[0], waypoints[1]);
    addRouteToMap(waypoints[1], waypoints[0]);
    document.getElementById("loader").style.display = "none";
  }
  else {
    findTour()
    .then((data) => {
      tour = data.tour;
      for (let i = 0; i < waypoints.length-1; i++) {
        addRouteToMap(waypoints[tour[i]], waypoints[tour[i+1]]);
      }
      addRouteToMap(waypoints[tour[tour.length-1]], waypoints[tour[0]]);
      /* Stop loading animation */
      document.getElementById("loader").style.display = "none";
    });
  }
}

// brise sve rute sa mape
function clearRoutes() {
  for (let r of routeControls) {
    r.remove();
  }
  routeControls = [];
  tour = [];
}




/*=============================
Rad sa podacima o saobracaju
===============================*/

// ne moze u geojsonu jer on ne podrzava krugove kao tip feature-a
var trafficData = {locations: [], loaded: false};

// prevodi broj u rgb boju
function intensity2Color(I) {
  // 0 <= I <= 1
  // zelena - nema guzve
  // zuta - umjerena guzva
  // crvena - velika guzva
  if (I <= 0.5) {
    const R = 255 * 2 * I;
    const G = 255;
    return 'rgb(' + R + ',' + G + ',0)';
  }
  else {
    const R = 255;
    const G = 255 * 2 * (1 - I);
    return 'rgb(' + R + ',' + G + ',0)';
  }
}

// dovlaci podatke iz baze
async function getTrafficData() {
  let date = new Date();
  // za sad jedino imamo period 15h-18h, inace predajemo trenutno vrijeme kao parametar
  let url = 'http://localhost:5000/get_traffic_data?curr_hour=' + date.getHours();
  return fetch(url)
  .then((response) => {
    return response.json();
  });
}

// prikazuje podatke o saobracaju na mapi / uklanja ih ako su vec prikazani
async function toggleTrafficData() {
  if (!trafficData.loaded){
    getTrafficData()
    .then((data) => {
      // data je vec JS objekat pa ne treba:
      // data = JSON.parse(data);
      for(let location of data.locations) {
        trafficData.locations.push(
          L.circle([location.lat, location.lng], 
                    {
                      color: intensity2Color(location.intensity),
                      fillColor: intensity2Color(location.intensity),
                      fillOpacity: 0.5,
                      radius: location.radius
                    }).addTo(mymap));
      }
      trafficData.loaded = true;
    });
  }
  else {
    for(let i = 0; i < trafficData.locations.length; i++) {
      trafficData.locations[i].remove();
    }
    trafficData.locations = [];
    trafficData.loaded = false;
  }
}




/*=============================
Pretraga lokacija po imenima
===============================*/

var searchControl = new L.esri.Geocoding.geosearch().addTo(mymap);

var results = new L.LayerGroup().addTo(mymap);

searchControl.on('results', (data) => {
  addWaypoint(data.results[0].latlng.lat, data.results[0].latlng.lng);
});




/*=============================
Cuvanje obilazaka u bazi
===============================*/

// lista sacuvanih obilazaka za tekuceg korisnika
var tours = [];

// cuva tekuci obilazak u bazi
async function saveTour() {

  /* Check if logged in */ 
  if(localStorage.getItem('currUser')===null) {
    document.getElementById("logged-out-warning").style.display = "block";
    console.log("Must be logged in to save tours.");
    return;
  }

  if (!routeControls.length) {
    return;
  }
  let tourName = prompt('Please enter the name of new tour', 'new_tour');
  fetch('http://localhost:5000/save_tour', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'JWT ' + accessToken
    },
    body: JSON.stringify({
      'name': tourName,
      'waypoints': waypoints,
      'tour': tour
    })
  })
  .then((res) => {
    if (!res.ok) {
        throw Error(res.statusText);
    }
    return res.json();
  })
  .then((data) => {
    initTourList();
  })
  .catch((err) => {
    localStorage.removeItem('currUser');
    alert('You must be logged in to save a tour.');
  });
}

// dovlaci obilaske iz baze
async function getTours() {
  return fetch('http://localhost:5000/get_tours', {
    method: 'GET',
    headers: {
      'Authorization': 'JWT ' + accessToken
    }
  })
  .then((res) => {
    if (!res.ok) {
        throw Error(res.statusText);
    }
    return res.json();
  })
  .catch((err) => {
    localStorage.removeItem('currUser');
    console.log('Unable to fetch tours. User not logged in.');
    return null;
  });
}

// kad korisnik selektuje jedan od sacuvanih obilazaka - prikazuje ga na mapi
function tourSelected(index, event) {
  /* Play loading animation */
  document.getElementById("loader").style.display = "inline-block";

  /*var timer = setTimeout(function() {
    // Stop playing the animation
    document.getElementById("loader").style.display = "none";
  }, 1500);*/


  clearRoutes();
  clearMarkers();
  routeControls = [];
  waypoints = [];
  let t = tours[index];
  tour = t.tour;
  for (let wp of t.waypoints) {
    addWaypoint(wp.lat, wp.lng);
  }
  for (let i = 0; i < waypoints.length-1; i++) {
    addRouteToMap(waypoints[tour[i]], waypoints[tour[i+1]]);
  }
  addRouteToMap(waypoints[tour[tour.length-1]], waypoints[tour[0]]);
  
}

// !!!
// Da se registruje kad su rute dodate na mapu
mymap.on('layeradd', (e) => {
  if (e.layer._route) {
    document.getElementById("loader").style.display = "none";
  }
});

function renameTour(index, event) {
  let tourId = tours[index]._id.$oid;
  let newName = event.currentTarget.previousSibling.value;
  if (newName.length === 0) {
    return;
  }
  fetch('http://localhost:5000/rename_tour', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'JWT ' + accessToken
    },
    body: JSON.stringify({
      'tour_id': tourId,
      'name': newName
    })
  })
  .then((res) => {
    if (!res.ok) {
        throw Error(res.statusText);
    }
    initTourList();
  })
  .catch((err) => {
    localStorage.removeItem('currUser');
    console.log('Unable to rename tour. User not logged in.');
  });
}

function deleteTour(index, event) {
  let tourId = tours[index]._id.$oid;
  fetch('http://localhost:5000/delete_tour', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'JWT ' + accessToken
    },
    body: JSON.stringify({
      'tour_id': tourId
    })
  })
  .then((res) => {
    if (!res.ok) {
        throw Error(res.statusText);
    }
    initTourList();
    alert('Tour deleted successfully');
  })
  .catch((err) => {
    localStorage.removeItem('currUser');
    console.log('Unable to delete tour. User not logged in.');
  });
}

// !
// gradi DOM strukturu za listu obilazaka
async function initTourList() {
  // jedino zanimljivo polje za ovu fju u tours[i] je name
  tours = await getTours();
  if (tours !== null) {
    let tourList = document.querySelector('#tour-list');
    tourList.innerHTML = '';
    for (let i = 0; i < tours.length; i++) {
      let currDiv = document.createElement('div');

      let currLink = document.createElement('a');
      currLink.innerText = tours[i].name;
      currLink.href = '#';
      currLink.addEventListener('click', tourSelected.bind(null, i));

      let currTxt = document.createElement('input');
      currTxt.type = 'text';
      currTxt.placeholder = 'new_name';

      let currRen = document.createElement('button');
      currRen.innerText = 'Rename';
      currRen.addEventListener('click', renameTour.bind(null, i));

      let currDel = document.createElement('button');
      currDel.innerText = 'X';
      currDel.addEventListener('click', deleteTour.bind(null, i));

      currDiv.appendChild(currLink);
      currDiv.appendChild(currTxt);
      currDiv.appendChild(currRen);
      currDiv.appendChild(currDel);

      tourList.appendChild(currDiv);
    }
  }
  
}

initTourList();

// toggleTrafficData();