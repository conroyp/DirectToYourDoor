var userLat, userLng;
var steps = new Array(), currentStep, request;
var directionDisplay;
var directionsService = new google.maps.DirectionsService();
var map;
// Default type of directions
var directionsType = 'driving';

var marker = new google.maps.Marker();
hasRun = false;

/**
 * Set up the map and directions renderer, then look for user co-ords.
 * Map is displayed first so in the event of user gps being unavailable
 * a map will still be displayed.
 */
function initialize()
{
    directionsDisplay = new google.maps.DirectionsRenderer();
    var myOptions = {
        zoom: defaultZoom
        , mapTypeId: google.maps.MapTypeId.ROADMAP
        , center: new google.maps.LatLng(lat, lng)
    };
    map = new google.maps.Map(
        document.getElementById('map_canvas')
        , myOptions
    );
    directionsDisplay.setMap(map);

    // Attempt to extract user's current locationS
    if (navigator.geolocation)
    {
        // Need to declare a timeout so error handler will work if network hangs
        // See http://stackoverflow.com/questions/3397585/
        navigator.geolocation.getCurrentPosition(gpsSuccess, gpsError, {timeout:3000});
    }
    else
    {
        // Failure. Uh oh.
        gpsError();
    }
}


/**
 * Make the request of the google directions service.
 * Once a response comes bacl, store the steps and set up the
 * directions text and stage control.
 */
function calcRoute()
{
    // default
    var travelMode = google.maps.DirectionsTravelMode.DRIVING;
    // directions toggled via toggleDirections function
    if(directionsType == 'walking')
    {
        travelMode = google.maps.DirectionsTravelMode.WALKING;
    }

    // Marker may be left over from previous travel mode - clear it
    marker.setMap(null);

    request = {
        origin: userLat + "," + userLng
        , destination: lat + "," + lng
        , travelMode: travelMode
    };

    directionsService.route(request, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK)
        {
            directionsDisplay.setDirections(response);
            // Store the steps in local var for ease of access
            steps = response.routes[0].legs[0].steps;
            currentStep = -1;

            setText("Approx journey time: "
                + response.routes[0].legs[0].duration.text
                + " ("+response.routes[0].legs[0].distance.text+")");
        }
    });
}


/**
 * Change the default directions type
 *
 * @param string type - one of "driving" or "walking"
 */
function toggleDirectionsType(type)
{
    directionsType = type;

    document.getElementById("driving").className = document.getElementById("walking").className = "";

    document.getElementById(type).className += "active-"+type;

    // Ensure zoom controlling gets reset
    hasRun = false;
}


/**
 * Update the directions label and map for the requested step
 * in the directions list.
 * Sanity checking is all done on index here rather than in calling functions,
 * so if code elsewhere sends through -1, it'll be interpreted as being at step 0
 * and wanting to go back to the last entry in the list.
 * Similarly for values of index above the max number of steps - wrap-around
 * worked out.
 *
 * @param int index - the step to display from the steps array
 */
function setStep(index)
{
    if(steps.length == 0)
    {
        return;
    }

    // First run for this direction request, so toggle zoom back to default
    if(!hasRun)
    {
        hasRun = true;
        map.setZoom(defaultZoom);
    }

    // Check for wrap-around - index out of bounds..
    if(index < 0)
    {
        index = steps.length - 1;
    }
    else if(index >= steps.length)
    {
        index = 0;
    }

    // Need to wipe off any preceding step markers
    // And create a new one at the start point of this leg
    marker.setMap(null);
    marker = new google.maps.Marker({
        position: steps[index].start_point
        , map: map
    });

    // centre map on new lat lng
    var mapCentre = new google.maps.LatLng(
        steps[index].start_point.lat()
        , steps[index].start_point.lng()
    );

    map.setCenter(mapCentre);

    // Update instructions & current step tracker
    setText(steps[index].instructions + " (" + steps[index].distance.text + ")");
    currentStep = index;
}


/**
 * Shorthand to update body of "directions" text
 *
 * @param string txt - Desired content of directions box
 */
function setText(txt)
{
    document.getElementById("directions-text").innerHTML = txt;
}


/**
 * GPS retrieval has failed, display an error.
 */
function gpsError()
{
    setText('Your location could not be retrieved');
}


/**
 * Success in getting co-ords. Calculate the route
 *
 * @param Position pos - Position object, contains coords, timestamp and address
 */
function gpsSuccess(pos)
{
    userLat = pos.coords.latitude;
    userLng = pos.coords.longitude
    calcRoute();
}
