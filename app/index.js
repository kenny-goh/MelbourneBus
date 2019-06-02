/* Entry point for Melbourne Bus App on Fitbit 
 * Author: KGoh
 * 
 * FIX timeout logic by adding timestamp
 * 
 *
 */

import * as messaging from "messaging";
import { AppUI } from "./ui.js";
import { geolocation } from "geolocation";
import { me } from "appbit";

let ui = new AppUI(messaging);
//ui.updateUI("disconnected");

// Listen for the onopen event
messaging.peerSocket.onopen = function() {
  console.log("App connection opened")
  ui.updateUI("loading");   
  ui.lastTimestamp = new Date()
  setTimeout(function() { 
      console.log(ui.state, ui.lastTimestamp, new Date().getTime() - ui.lastTimestamp.getTime())
      if (ui.state == "loading" 
          && ui.lastTimestamp != null 
          && (new Date().getTime() - ui.lastTimestamp.getTime()) > 5000) {
        ui.lastTimestamp = null;
        ui.state = "";
        ui.updateUI('timeout')
      }
    }, 6000);
  ui.getStops(); 
}

// Listen for the onmessage event
messaging.peerSocket.onmessage = function(evt) {        
    ui.updateUI("reply", evt.data);
}

// Listen for the onerror event
messaging.peerSocket.onerror = function(err) {
  // Handle any errors
  ui.updateUI("error"); 
}









