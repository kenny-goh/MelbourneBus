/* Entry point for Companion App 
 * Author: KGoh
 */

import { me } from "companion";
import * as messaging from "messaging";
import { settingsStorage } from "settings";
import { geolocation } from "geolocation";
import { PTVTimetableAPI } from "./api.js"
import { me } from "companion";
import { geolocation } from "geolocation";

var api = new PTVTimetableAPI();    

function locationSuccess(position) {
    let latitude = position.coords.latitude 
    let longitude = position.coords.longitude
    getStops(latitude, longitude)  
}

function locationError(error) {
  sendErrorMessageToApp("Error: " + error.code + " Message: " + error.message)
}

// Listen for the onopen event
messaging.peerSocket.onopen = function() {
  console.log("Companion connection opened")
}

// Listen for the onmessage event
messaging.peerSocket.onmessage = function(evt) {
  // Output the message to the console
  console.log(JSON.stringify(evt.data));
}

// Listen for messages from the device
messaging.peerSocket.onmessage = function(evt) {
  if (evt.data && evt.data.command == "getStops") {  
    geolocation.getCurrentPosition(locationSuccess, locationError)
  }  
  else if (evt.data && evt.data.command == "getDepartures") {    
    let stopId = evt.data.stopId
    let routetype = evt.data.routeType
    getDepartures(stopId, routetype)
  }
}

function getDepartures(stopId,routeType) {       
  //console.log("getDepartures:" + stopId)
   api.getDepartures(stopId,routeType).then(function(departures) { 
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {                 
      let response = { 
        'command' : 'departures',
        'payload' : departures
      }
      messaging.peerSocket.send(response);
    }    
  }).catch(function (e) {
    console.log('Error:', e)
  }); 
}

function getStops(latitude,longitude) {
  api.getStops(latitude,longitude).then(function(stops) {
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
      let response = { 
        'command' : 'stops',
        'payload' : stops
      }
      messaging.peerSocket.send(response);
    }
  }).catch(function (e) {
    console.log('Error', e)
  });
}


function sendErrorMessageToApp(message) {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    let response = { 
      'command' : 'error',
      'payload' : message
    }
    messaging.peerSocket.send(response);
  }
  else {
     console.log('Unable to send error to app due to socket not ready') 
  }
}
