/* Bunch of helper functions
 * Author: KGoh
 */
export function Helper() {}

Helper.addHoursToDate = function(date,hours) {
  return new Date(date.getTime() + (hours*60*60*1000));
}

Helper.getTimeDifferenceAsText = function(date) {        
  let now = Date.now();  
  let difference = date.getTime() - now; // This will give difference in milliseconds
  let minutes = Math.round(difference / 60000);
  if (minutes > 60) {
    var hours = Math.floor( minutes / 60);          
    var minutes = minutes % 60;
    return hours.toString() + ' hours ' + minutes.toString() + ' minutes'
  } 
  return minutes > 0 ? minutes.toString() + ' minutes' : 'Now' 
 }

Helper.shorten = function(str, maxLen, separator = ' ') {
    if (str.length <= maxLen) return str;
    return str.substr(0, str.lastIndexOf(separator, maxLen));
}

Helper.sanitizeName = function(name) {
    let value = name
    let index = name.indexOf('-') + 1
    let len = name.length
    if (index > 0) {
        value = this.shorten( name.substring(index, len).trim(), 40, ' ')
    }
    return value
}


