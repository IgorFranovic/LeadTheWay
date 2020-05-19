
var clicked = 0;

// Setting up the Variables
var bars = document.getElementById("nav-action");
var nav = document.getElementById("nav");


// setting up the listener
bars.addEventListener("click", barClicked, false);


// setting up the clicked Effect
function barClicked() {
    
    bars.classList.toggle('active');
    nav.classList.toggle('visible');

    clicked = 1 - clicked;
    //console.log("Bar clicked ", clicked);
    if (clicked === 1) {
        document.getElementById("mapid").style.backgroundColor = "lightgray";
        document.getElementById("mapid").style.opacity = "0.7";
        document.getElementById("bd").style.backgroundColor = "lightgray";
        document.getElementById("bd").style.opacity = "0.7";

        
        document.getElementById("myTours").style.display = "none";

        document.getElementById("nav-holder").style.display = "none";
    } else if(clicked === 0){
        document.getElementById("mapid").style.backgroundColor = "lightgray";
        document.getElementById("mapid").style.opacity = "1";
        document.getElementById("bd").style.backgroundColor = "lightgray";
        document.getElementById("bd").style.opacity = "1";

        document.getElementById("nav-holder").style.display = "block";
    }
    
}


// close nav if map focused ^
function mapFocused() {
    
    if (clicked === 1) {
        bars.classList.toggle('active');
        nav.classList.toggle('visible');
        clicked = 0;
        console.log("Map Focused ", clicked);
        document.getElementById("mapid").style.backgroundColor = "lightgray";
        document.getElementById("mapid").style.opacity = "1";
        document.getElementById("bd").style.backgroundColor = "lightgray";
        document.getElementById("bd").style.opacity = "1";

    }

}


function openMyTours(){
    // Hide nav
    bars.classList.toggle('active');
    nav.classList.toggle('visible');
    clicked = 0;
    
    document.getElementById("bd").style.opacity = "1";
    console.log("Opening MyTours");

    
    document.getElementById("myTours").style.display = "block";
}

function openPlanner(){
    // Hide nav
    bars.classList.toggle('active');
    nav.classList.toggle('visible');
    clicked = 0;
    document.getElementById("bd").style.opacity = "1";
    
    console.log("Opening MyTours");

    document.getElementById("myTours").style.display = "none";
    document.getElementById("planner").style.display = "block";
}

function closePanel() {
    
    document.getElementById("myTours").style.display = "none";
    document.getElementById("directions").style.display = "none";
    document.getElementById("mapid").style.opacity = "1";
    document.getElementById("bd").style.opacity = "1";
}


function toggleToolbar1() {
    
    document.getElementById("toolbar1").style.display = document.getElementById("toolbar1").style.display === "none" ? "block" : "none";
}

function toggleToolbar2() {
    document.getElementById("toolbar2").style.display = document.getElementById("toolbar2").style.display === "none" ? "block" : "none";
}

var traffic = 0;
function changeTrafficIcon(){
    traffic = 1 - traffic;
    if(traffic === 0) {
        document.getElementById("traffic").style.backgroundImage = document.getElementById("traffic").style.backgroundImage = "url('./images/traffic-off.png')";
    } else {
        document.getElementById("traffic").style.backgroundImage = document.getElementById("traffic").style.backgroundImage = "url('./images/traffic-on.png')";
    }
       
}

function openDirections() {

    if(document.getElementById("directions").style.display === "none"){
        document.getElementById("directions").style.display = "block";
    } else {
        document.getElementById("directions").style.display = "none";
    }
}