function add(e) {

    loc = {lat: e.latlng.lat, lng: e.latlng.lng};

    /*
    Ukloni ako su bas blizu waypointi. Logika je dobra, samo nzm kako da pristupim stvarnom elementu mape
    for (l of locations){
        if (isClose(l, loc)){
            if (confirm("Remove this waypoint?")){
                locations.pop(l);
                reloadElement("mapid")
                return;
            }
        }
    }
    */
    // Pitaj korisnika je li siguran da unese waypoint
    if (!confirm("Put waypoint at (" + loc.lat + ", " + loc.lng + ") ?")) return;



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
        rwp1.latLng = wp1;

        rwp2 = new L.Routing.Waypoint();
        rwp2.latLng = wp2;

        var myRoute = L.Routing.osrmv1();
        myRoute.route([rwp1, rwp2], function(err, routes) {
            console.log('Samo osnovni podaci o ruti:');
            console.log(routes[0].summary);
        });

    }
}