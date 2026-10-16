const { HAZARD_TYPES } = require("../config/constants");
const { errorResponse } = require("../utils/apiResponse");

/**
 * Validate incoming report creation payload
 */
const validateCreateReport = (req, res, next) => {
  const { description, hazardType, latitude, longitude, locationAccuracy } = req.body;
  const errors = [];

  // Description validation
  if (!description || typeof description !== "string" || description.trim().length < 5) {
    errors.push({
      field: "description",
      message: "Description must be at least 5 characters long"
    });
  } else if (description.trim().length > 2000) {
    errors.push({
      field: "description",
      message: "Description cannot exceed 2000 characters"
    });
  }

  // Hazard Type validation
  if (!hazardType || !Object.values(HAZARD_TYPES).includes(hazardType)) {
    errors.push({
      field: "hazardType",
      message: `Invalid hazardType. Supported values: ${Object.values(HAZARD_TYPES).join(", ")}`
    });
  }

  // Latitude validation (-90 to 90)
  const lat = parseFloat(latitude);
  if (isNaN(lat) || lat < -90 || lat > 90) {
    errors.push({
      field: "latitude",
      message: "Latitude must be a valid number between -90 and 90"
    });
  }

  // Longitude validation (-180 to 180)
  const lng = parseFloat(longitude);
  if (isNaN(lng) || lng < -180 || lng > 180) {
    errors.push({
      field: "longitude",
      message: "Longitude must be a valid number between -180 and 180"
    });
  }

  // Location accuracy (optional, must be positive if provided)
  if (locationAccuracy !== undefined && locationAccuracy !== "") {
    const acc = parseFloat(locationAccuracy);
    if (isNaN(acc) || acc < 0) {
      errors.push({
        field: "locationAccuracy",
        message: "locationAccuracy must be a non-negative number in meters"
      });
    }
  }

  if (errors.length > 0) {
    return errorResponse(res, "Validation failed", 400, errors);
  }

  // Parse and store normalized coordinates for controller convenience
  req.parsedCoordinates = [lng, lat]; // GeoJSON is [longitude, latitude]
  next();
};

/**
 * Validate nearby query parameters
 */
const validateNearbyQuery = (req, res, next) => {
  const { lat, lng, radius } = req.query;
  const errors = [];

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  const radiusMeters = radius ? parseFloat(radius) : 5000;

  if (isNaN(latitude) || latitude < -90 || latitude > 90) {
    errors.push({ field: "lat", message: "Parameter 'lat' must be a number between -90 and 90" });
  }

  if (isNaN(longitude) || longitude < -180 || longitude > 180) {
    errors.push({ field: "lng", message: "Parameter 'lng' must be a number between -180 and 180" });
  }

  if (isNaN(radiusMeters) || radiusMeters <= 0 || radiusMeters > 500000) {
    errors.push({ field: "radius", message: "Parameter 'radius' must be a positive number up to 500,000 meters" });
  }

  if (errors.length > 0) {
    return errorResponse(res, "Invalid query parameters for nearby search", 400, errors);
  }

  req.nearbyParams = {
    latitude,
    longitude,
    radiusMeters
  };

  next();
};

module.exports = {
  validateCreateReport,
  validateNearbyQuery
};
