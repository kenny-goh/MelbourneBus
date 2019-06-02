/* PTV API Interface 
 *
 */

// TODO: REFACTOR -> Use constants for parameters

import { Helper } from "../common/helper.js"
import * as Globals from "../common/globals.js"

// SHA1 MAC Crypto function (Compressed)
// Credit: 
var Crypto={sha1_hmac:function(r,o){"use strict";var t,e,a,h,n,C;for(64<o.length&&(o=Crypto.sha1(o,!0)),h=[],C=o.length,n=0;n<64;++n)h[n]=n<C?o.charCodeAt(n):0;for(e=t="",n=0;n<64;++n)t+=String.fromCharCode(92^h[n]),e+=String.fromCharCode(54^h[n]);return a=Crypto.sha1(e+r,!0),Crypto.sha1(t+a)},sha1:function(r,o){function t(r,o){return r<<o|r>>>32-o}function e(r,o){var t,e,a="";for(t=7;0<=t;t--)e=r>>>4*t&15,a+=o?String.fromCharCode(e):e.toString(16);return a}var a,h,n,C,s,c,f,u,d,i,A,g=new Array(80),p=1732584193,l=4023233417,b=2562383102,m=271733878,y=3285377520,S=r.length,v=[];for(h=0;h<S-3;h+=4)n=r.charCodeAt(h)<<24|r.charCodeAt(h+1)<<16|r.charCodeAt(h+2)<<8|r.charCodeAt(h+3),v.push(n);switch(S%4){case 0:h=2147483648;break;case 1:h=r.charCodeAt(S-1)<<24|8388608;break;case 2:h=r.charCodeAt(S-2)<<24|r.charCodeAt(S-1)<<16|32768;break;case 3:h=r.charCodeAt(S-3)<<24|r.charCodeAt(S-2)<<16|r.charCodeAt(S-1)<<8|128}for(v.push(h);v.length%16!=14;)v.push(0);for(v.push(S>>>29),v.push(S<<3&4294967295),a=0;a<v.length;a+=16){for(h=0;h<16;h++)g[h]=v[a+h];for(h=16;h<=79;h++)g[h]=t(g[h-3]^g[h-8]^g[h-14]^g[h-16],1);for(C=p,s=l,c=b,f=m,u=y,h=0;h<=19;h++)d=t(C,5)+(s&c|~s&f)+u+g[h]+1518500249&4294967295,u=f,f=c,c=t(s,30),s=C,C=d;for(h=20;h<=39;h++)d=t(C,5)+(s^c^f)+u+g[h]+1859775393&4294967295,u=f,f=c,c=t(s,30),s=C,C=d;for(h=40;h<=59;h++)d=t(C,5)+(s&c|s&f|c&f)+u+g[h]+2400959708&4294967295,u=f,f=c,c=t(s,30),s=C,C=d;for(h=60;h<=79;h++)d=t(C,5)+(s^c^f)+u+g[h]+3395469782&4294967295,u=f,f=c,c=t(s,30),s=C,C=d;p=p+C&4294967295,l=l+s&4294967295,b=b+c&4294967295,m=m+f&4294967295,y=y+u&4294967295}if(i=(e(p)+e(l)+e(b)+e(m)+e(y)).toLowerCase(),!o)return i;for(A="";i.length;)A+=String.fromCharCode(parseInt(i.substr(0,2),16)),i=i.substr(2);return A}};


/**
 * PTVTimeTableAPI Constructor
 */ 
export function PTVTimetableAPI() {   
  let self = this;
}


/**
 * Helper function to construct URL with HMAC SHA1 encoding of user key in the signature
 * @param {*} request 
 */
function getURL(request) {
    var devId = 3000876
    var key = 'b04ee4f4-bc30-4a0e-9b79-3e1b48677461'    
    if (request.indexOf('&') >= 0) {
        request = request + '&'
    } else {
        request = request + '?'
    }
    var raw = request+`devid=${devId}`
    var signature = Crypto.sha1_hmac(raw,key);    
    return 'https://timetableapi.ptv.vic.gov.au'+raw+`&signature=${signature}`
}

function checkDateDiffIsPositive(dept) { 
  let date = null;
  if (dept[Globals.ROUTE_ESTIMATED_TIME]) {
    date = new Date(dept[Globals.ROUTE_ESTIMATED_TIME])
  } else {
    date = new Date(dept[Globals.ROUTE_SCHEDULED_TIME])
  }      
  let now = Date.now();  
  let difference = date.getTime() - now;  
  return difference >= 0
}

/**
 * Query the location of the nearest stops using longitude and latitude GPS location.
 * @param {*} latitude 
 * @param {*} longitude 
 */
PTVTimetableAPI.prototype.getStops = function(latitude, longitude) {
    let self = this;    
    return new Promise(function(resolve, reject) {      
      let url = getURL('/v3/stops/location/' + latitude + ',' + longitude + '?route_types=0&route_types=1&route_types=2&max_distance=5000');        
      fetch(url).then(function(response) {
        return response.json();
      }).then(function(json) {
        let data = json['stops'].slice(0,Globals.STOP_COUNT)       
        let stops = [];                  
        data.forEach( (stop) => {        
            let d = {              
              's1' : stop["stop_id"],              
              's2' : Helper.sanitizeName(stop["stop_name"]),              
              's3' : parseInt(stop["stop_distance"]).toString(),
              's4' : stop["route_type"]
            };            
            stops.push(d);        
        });        
        resolve(stops);
      }).catch(function (error) {
        reject(error);
      });
    });
 };

  /**
   * Query the departures from the stop
   * @param {*} origin 
   */
PTVTimetableAPI.prototype.getDepartures = function(stopId,routeType) {    
  let self = this;
  return new Promise(async function(resolve, reject) {    
    let url = getURL('/v3/departures/route_type/' + routeType + '/stop/' + stopId + '?look_backwards=false&max_results=3');   
    let promise = await fetch(url)
    let json = await promise.json()
    let data = json['departures'].slice(0,Globals.DEPARTURE_COUNT)      
    let departures = []; 
    let size = data.length;
    let i = 0
    data.forEach(async (destination) => {    
        let route_id = destination["route_id"]
  
        let direction_id = destination["direction_id"]
        let estimated_time = destination["estimated_departure_utc"] 
        let scheduled_time = destination["scheduled_departure_utc"] 
        
        let route_url = getURL('/v3/routes/' + route_id);       
        let promise2 = await fetch(route_url);
        let json2 = await promise2.json();  
        let route_name = json2['route']['route_number'];
       
        let dir_url = getURL('/v3/directions/' + direction_id);  
        promise2 = await fetch(dir_url)
        json2 = await promise2.json()
        let data2 = json2['directions']   
        let dir = data2[0]["direction_name"]
        let d = {
            'r1' : route_id,
            'r2' : route_name,            
            'r3' : destination["run_id"],
            'r4' : scheduled_time,
            'r5' : estimated_time,    
            'r6' : routeType,
            'r7' : dir
          };   
        departures.push(d)
        i += 1;
        if (i >= size) {
            departures = departures.filter(checkDateDiffIsPositive)
            departures.sort(function(a, b) {
              return new Date(a['r4']) - new Date(b['r4']);
            });
            resolve(departures);
        }
    });
    }).catch(function (error) {
      reject(error);
    });

    
};

