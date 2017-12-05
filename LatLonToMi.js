/**
 * Round number (value) to a certain number of decimals (decimals)
 */
function round(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

/**
 * Function to convert degrees to toRadians
 */
if (Number.prototype.toRadians === undefined) {
    Number.prototype.toRadians = function() { return this * Math.PI / 180; };
}

/**
 * Creates a LatLon point on the earth's surface at the specified latitude / longitude.
 *
 * Parameters:
 *  number lat - Latitude in degrees.
 *  number lon - Longitude in degrees.
 *
 * Example usage:
 *     var p1 = new LatLon(52.205, 0.119);
 */
function LatLon(lat, lon) {
    // allow instantiation without 'new'
    if (!(this instanceof LatLon)) return new LatLon(lat, lon);
    this.lat = Number(lat);
    this.lon = Number(lon);
}


/**
 * Returns the distance from ‘this’ point to destination point (using haversine formula).
 *
 * Parameters:
 * LatLon: point - Latitude/longitude of destination point.
 * number: [radius=6371e3] - (Mean) radius of earth (defaults to radius in metres).
 *
 * Returns:
 * number: Distance between this point and destination point, in same units as radius.
 *

 */
LatLon.prototype.distanceTo = function(point, radius) {
    if (!(point instanceof LatLon)) throw new TypeError('point is not LatLon object');
    radius = (radius === undefined) ? 6371e3 : Number(radius);

    var R = radius;
    var φ1 = this.lat.toRadians(),  λ1 = this.lon.toRadians();
    var φ2 = point.lat.toRadians(), λ2 = point.lon.toRadians();
    var Δφ = φ2 - φ1;
    var Δλ = λ2 - λ1;

    var a = Math.sin(Δφ/2) * Math.sin(Δφ/2)
          + Math.cos(φ1) * Math.cos(φ2)
          * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    d = d * 0.621371; //Converts from kilometers to miles
    d = d/1000;
    if (d >= 10)
    {
      finald = round(d, 0);
    } else {
      finald = round(d, 2);
    }
    return finald;
};

/**
 * EXAMPLE OF USAGE:
 *     var p1 = new LatLon(52.205, 0.119);
 *     var p2 = new LatLon(48.857, 2.351);
 *     var d = p1.distanceTo(p2); // 251 mi
 */
