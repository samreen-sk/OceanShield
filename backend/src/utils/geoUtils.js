/**
 * Geospatial calculation utilities
 */

/**
 * Calculate distance in meters between two [longitude, latitude] points using Haversine formula
 * @param {Array<number>} coord1 [lon1, lat1]
 * @param {Array<number>} coord2 [lon2, lat2]
 * @returns {number} Distance in meters
 */
const calculateDistanceMeters = (coord1, coord2) => {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Compute the geographic centroid of multiple [longitude, latitude] coordinates
 * @param {Array<Array<number>>} coordinates Array of [lon, lat] pairs
 * @returns {Array<number>} Centroid [lon, lat]
 */
const calculateCentroid = (coordinates) => {
  if (!coordinates || coordinates.length === 0) {
    return [0, 0];
  }
  if (coordinates.length === 1) {
    return coordinates[0];
  }

  let totalLon = 0;
  let totalLat = 0;

  coordinates.forEach(([lon, lat]) => {
    totalLon += lon;
    totalLat += lat;
  });

  const count = coordinates.length;
  return [
    parseFloat((totalLon / count).toFixed(6)),
    parseFloat((totalLat / count).toFixed(6))
  ];
};

module.exports = {
  calculateDistanceMeters,
  calculateCentroid
};
