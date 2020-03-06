var mymap = L.map('mapid').setView([42.431071, 19.259379], 13);

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mymap);

var locations = [];

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
    return instrPts
  }

mymap.on('click', function(e) {
    loc = {lat: e.latlng.lat, lng: e.latlng.lng};
    locations.push(loc);
    console.log('Sve unijete lokacije:');
    console.log(locations);
    if (locations.length > 1) {
        var wp1 = L.latLng(locations[locations.length-2].lat, locations[locations.length-2].lng);
        var wp2 = L.latLng(locations[locations.length-1].lat, locations[locations.length-1].lng);

        L.Routing.control({
            waypoints: [
                wp1,
                wp2
            ]
        }).addTo(mymap).on('routeselected', function(e) {
            var coord = e.route.coordinates;
            var instr = e.route.instructions;
            console.log('Detaljni podaci o ruti:');
            console.log(coord);
            console.log(instr);
            // L.geoJson(getInstrGeoJson(instr,coord)).addTo(mymap);
        });
        
        // da se izvuku samo duzina rute i vrijeme
        
        rwp1 = new L.Routing.Waypoint();
        rwp1.latLng = wp1;;
        
        rwp2 = new L.Routing.Waypoint();
        rwp2.latLng = wp2;
        
        var myRoute = L.Routing.osrmv1();
        myRoute.route([rwp1, rwp2], function(err, routes) {
            console.log('Samo osnovni podaci o ruti:');
            console.log(routes[0].summary);
        });
        
    }
});

