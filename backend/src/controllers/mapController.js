const Incident = require("../models/incidentModel");
const Report = require("../models/reportModel");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const { INCIDENT_STATUS, SEVERITY_LEVELS } = require("../config/constants");

/**
 * Severity weight to numeric intensity mapping for heatmaps
 */
const SEVERITY_INTENSITY_WEIGHTS = {
  [SEVERITY_LEVELS.LOW]: 0.25,
  [SEVERITY_LEVELS.MEDIUM]: 0.50,
  [SEVERITY_LEVELS.HIGH]: 0.75,
  [SEVERITY_LEVELS.CRITICAL]: 1.00
};

/**
 * Get heatmap data points formatted for Leaflet.heat / Mapbox
 * Returns [latitude, longitude, intensity]
 * GET /api/v1/map/heatmap
 */
const getHeatmapData = asyncHandler(async (req, res) => {
  const query = {
    status: { $nin: [INCIDENT_STATUS.RESOLVED, INCIDENT_STATUS.REJECTED] }
  };

  if (req.query.hazardType) {
    query.hazardType = req.query.hazardType;
  }
  if (req.query.severity) {
    query.severity = req.query.severity;
  }

  const incidents = await Incident.find(query)
    .select("centroid severity hazardType confidence sourceCount status")
    .lean();

  const heatmapPoints = incidents.map((incident) => {
    const [lon, lat] = incident.centroid.coordinates;
    const baseIntensity = SEVERITY_INTENSITY_WEIGHTS[incident.severity] || 0.5;
    
    // Scale intensity slightly with corroborating sources and confidence
    const intensity = Math.min(1.0, baseIntensity * incident.confidence * (1 + Math.min(0.5, incident.sourceCount * 0.1)));

    return {
      lat,
      lng: lon,
      intensity: parseFloat(intensity.toFixed(2)),
      hazardType: incident.hazardType,
      severity: incident.severity,
      incidentId: incident._id
    };
  });

  return successResponse(res, "Heatmap data retrieved successfully", {
    pointCount: heatmapPoints.length,
    points: heatmapPoints
  });
});

module.exports = {
  getHeatmapData
};
