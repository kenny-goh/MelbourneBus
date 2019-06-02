/* 
 *
 *
 */

import { me } from "appbit";
import { geolocation } from "geolocation";
import  * as Globals from "../common/globals.js";
import { Helper } from "../common/helper.js";

import document from "document";


// PRIVATE functions goes here..
function showScreen1(self) {
  self.spinner.state = "disabled";
  self.statusText.text = "";  
  self.container.style.display = "inline";  
  self.container.value = 0;
  //console.log("show screen 1")
}

function showScreen2(self) {
  self.spinner.state = "disabled";
  self.statusText.text = "";  
  self.container.style.display = "inline";  
  self.container.value = 1;
}

function showErrorMessage(self, text) {
  // Show the popup
  self.myPopup.style.display = "inline";
  self.popupTitle.text = 'Error'
  self.popupMsg.text = text
}

// Helper to initialite screen 1
function initScreen1(self) {
  self.stopList = document.getElementById("stopList");  
  self.stopTiles = [];  
  for (let i = 0; i < Globals.STOP_COUNT; i++) {
    let tile = document.getElementById(`stop-${i}`);
    if (tile) {
      self.stopTiles.push(tile);
    }
  }  
  let list = document.getElementById("stopList");
  let items = list.getElementsByClassName("item");
  items.forEach((element, index) => {
    let touch = element.getElementById("touch-me");
    touch.onclick = (evt) => {
      //console.log(`touched: ${index}`); 
      let stop = self.stopListByIndexes[index]
      let stopId = stop[Globals.STOP_ID]
      let routeType = stop[Globals.STOP_ROUTE_TYPE]      
      self.getDepartures(stopId,routeType)
    }
  });
}

// Helper to initialize screen 2
function initScreen2(self) {
  self.deptList = document.getElementById("deptList");  
  self.deptTiles = [];  
  for (let i = 0; i < Globals.DEPARTURE_COUNT; i++) {
    let tile = document.getElementById(`dept-${i}`);
    if (tile) {
      self.deptTiles.push(tile);
    }
  }  
}

/** 
 * Constructor
 */ 
export function AppUI(messaging) {   
  let self = this    
  this.state = ""
  this.lastTimestamp = null;
  this.messaging = messaging  
  this.stopListByIndexes = []
  this.statusText = document.getElementById("status");
  this.spinner = document.getElementById("spinner");
  this.container = document.getElementById("container");
  
  this.myPopup = document.getElementById("popup");
  this.popupTitle = this.myPopup.getElementById('header');
  this.popupMsg = this.myPopup.getElementById('copy');

  
  let btnLeft = this.myPopup.getElementById("btnLeft");
  let btnRight = this.myPopup.getElementById("btnRight");
  btnLeft.onclick = function(evt) {
    self.myPopup.style.display = "none";
    self.getStops(); 
  }

  btnRight.onclick = function(evt) {
    self.myPopup.style.display = "none";
    me.exit()
  }
  
  document.onkeypress = function(e) {
    if (e.key === 'up') {
      console.log("Key pressed: " + e.key);  
      self.myPopup.style.display = "none";
      self.getStops(); 
    }
  }

  
  
  initScreen1(this);
  initScreen2(this);
  showScreen1(this);  
}


/**
 * Method ot update UI
 */
AppUI.prototype.updateUI = function(state, data) {  
  this.state = state
  
  if (state === "reply") {    
    if (data.command === "stops") {                   
      if (data.payload) {
        this.updateStopList(data.payload);
      }
      else {
        showErrorMessage(this,"No stops found.")
      }       
    }
    else if (data.command === "departures") {   
      if (data.payload) {
       this.updateDepartureList(data.payload);  
      } 
      else {
        showErrorMessage(this,"No departures found")
      } 
    }  
    else if (data.command == "error") {
      showErrorMessage(this,"Oops..something bad bappened on the the phone Fitbit App.") 
    }
  }
  else {    
    this.container.style.display = "none"  
    if (state === "loading") {
      this.statusText.text = "Loading..."
      this.spinner.state = "enabled"
    }
    else if (state === "timeout") {
      showErrorMessage(this,"Oops..timeout with phone Fitbit app.") 
    } 
    else if (state === "error") {
      showErrorMessage(this,"Oops..something bad bappened.") 
    } 
  }
}

/**
 * Method to update list of stops
 */ 
AppUI.prototype.updateStopList = function(stops) {  
  if (stops.length == 0) { 
    showErrorMessage(this,"No stops found nearby.","Try again")
  }
  else {
    showScreen1(this)  
    this.stopListByIndexes.length = 0 
    for (let i = 0; i < Globals.STOP_COUNT; i++) {
      let tile = this.stopTiles[i];
      if (!tile) {
        continue;
      }

      const stop = stops[i];
      if (!stop) {
        tile.style.display = "none";
        continue;
      }

      tile.style.display = "inline";    
      //this.stopListByIndexes.push(stop['stop_id'])
      this.stopListByIndexes.push(stop)
      tile.getElementById("destination").text = stop[Globals.STOP_NAME] 
      tile.getElementById("distance").text =  stop[Globals.STOP_DISTANCE] + ' meters'        
      if (stop[Globals.STOP_ROUTE_TYPE] == 0) {
        tile.getElementById("image").image =  "train.png" 
      }
      else if (stop[Globals.STOP_ROUTE_TYPE] == 1) {
        tile.getElementById("image").image =  "tram.png" 
      }
      else if (stop[Globals.STOP_ROUTE_TYPE] == 2) {
        tile.getElementById("image").image =  "icon.png" 
      }
    }
  }
}


/**
 * Method to update departure list 
 */
AppUI.prototype.updateDepartureList = function(depts) {  
  if (depts.length == 0) {
    showErrorMessage(this,"No departures found","Back")
  }
  else {
    showScreen2(this)
    for (let i = 0; i < Globals.DEPARTURE_COUNT; i++) {
      let tile = this.deptTiles[i];
      if (!tile) {
        continue;
      }

      const dept = depts[i];
      if (!dept) {
        tile.style.display = "none";
        continue;
      }

      tile.style.display = "inline";        
      tile.getElementById("destName").text = 'To: ' + dept[Globals.ROUTE_DIR] 
      if (dept[Globals.ROUTE_NAME]) {
         tile.getElementById("destRouteName").text =  '[' + dept[Globals.ROUTE_NAME] + ']'
      }

      //dept[Globals.ROUTE_NAME] 
      
      
      let time = null;
      if (dept[Globals.ROUTE_ESTIMATED_TIME]) {
        time = new Date(dept[Globals.ROUTE_ESTIMATED_TIME])
      } else {
        time = new Date(dept[Globals.ROUTE_SCHEDULED_TIME])
      }
      
      let ETA = Helper.getTimeDifferenceAsText(time);         
            
      if (ETA == 0) {
        tile.getElementById("destETA").text = 'Now'
      }
      else {
        tile.getElementById("destETA").text = ETA;
      }
      if (dept[Globals.ROUTE_TYPE] == 0) {
        tile.getElementById("image").image =  "train.png" 
      }
      else if (dept[Globals.ROUTE_TYPE] == 1) {
        tile.getElementById("image").image =  "tram.png" 
      }
      else if (dept[Globals.ROUTE_TYPE] == 2) {
        tile.getElementById("image").image =  "icon.png" 
      }
    }  
  }
}


/**
 * Methoe to request list of stops from companion app
 */ 
AppUI.prototype.getStops = function() {  
  this.updateUI('loading')
  if (this.messaging.peerSocket.readyState === this.messaging.peerSocket.OPEN) {
    // Send a command to the companion
    this.messaging.peerSocket.send({
      'command': 'getStops'
    });
    let self = this;
    self.lastTimestamp = new Date();
    setTimeout(function() { 
        if (self.state == "loading" 
            && self.lastTimestamp != null
            && (new Date().getTime() - self.lastTimestamp.getTime()) > 5000) {
          self.lastTimestamp = null;
          self.state = "";
          self.updateUI('timeout');
        }
    }, 6000);
  }
}

/**
 * Method to request list of departures from companion app
 */ 
AppUI.prototype.getDepartures = function(stopId,routeType) {  
  this.updateUI('loading')
  
  if (this.messaging.peerSocket.readyState === this.messaging.peerSocket.OPEN) {
    // Send a command to the companion
    this.messaging.peerSocket.send({
      'command': 'getDepartures',
      'stopId': stopId,
      'routeType': routeType
    });
    let self = this
    self.lastTimestamp = new Date();
    setTimeout(function() { 
      if (self.state == "loading" 
          && self.lastTimestamp != null 
          && (new Date().getTime() - self.lastTimestamp.getTime()) > 5000) {
        self.lastTimestamp = null;
        self.state = "";
        self.updateUI('timeout')
      }
    }, 6000);

  }
}


