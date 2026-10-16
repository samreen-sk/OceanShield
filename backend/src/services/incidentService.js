const Incident = require("../models/incidentModel");
const Report = require("../models/reportModel");
const env = require("../config/env");
const { calculateCentroid } = require("../utils/geoUtils");
const { calculateConfidence } = require("../utils/confidenceCalculator");
const { calculateSeverity } = require("../utils/severityCalculator");
const { triggerIncidentAlert } = require("./notificationService");
const { INCIDENT_STATUS, AUDIT_ACTIONS } = require("../config/constants");

/**
 * Cluster a processed report into an existing incident or spawn a new incident
 * @param {object} report Processed report document
 * @returns {Promise<object>} Associated incident
 */
const clusterReportToIncident = async (report) => {
  const [lon, lat] = report.location.coordinates;
  const radiusMeters = env.INCIDENT_CLUSTER_RADIUS_METERS;
  const timeWindowMs = env.INCIDENT_CLUSTER_TIME_MINUTES * 60 * 1000;
  const cutoffTime = new Date(report.reportedAt.getTime() - timeWindowMs);

  // Search candidate active incidents of same hazard type in proximity
  const candidateIncidents = await Incident.find({
    hazardType: report.hazardType,
    status: { $nin: [INCIDENT_STATUS.RESOLVED, INCIDENT_STATUS.REJECTED] },
    lastSeenAt: { $gte: cutoffTime },
    centroid: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lon, lat]
        },
        $maxDistance: radiusMeters
      }
    }
  }).limit(1);

  let incident;

  if (candidateIncidents.length > 0) {
    // 1. Join existing incident
    incident = candidateIncidents[0];

    if (!incident.reportIds.includes(report._id)) {
      incident.reportIds.push(report._id);
    }

    // Fetch all reports in this incident to update centroid
    const allReports = await Report.find({ _id: { $in: incident.reportIds } }, "location reportedAt").lean();
    const allCoords = allReports.map((r) => r.location.coordinates);

    incident.centroid.coordinates = calculateCentroid(allCoords);
    incident.lastSeenAt = new Date();
    incident.sourceCount = incident.reportIds.length;

    // Recalculate fusion confidence
    const fusion = calculateConfidence({
      text: report.textPrediction ? report.textPrediction.confidence : 0.6,
      image: report.imagePrediction ? report.imagePrediction.confidence : 0,
      spatialAgreement: 0.85, // Higher agreement since clustered with existing
      temporalAgreement: 0.85,
      sourceEvidence: Math.min(1.0, 0.5 + incident.sourceCount * 0.1),
      duplicateRisk: report.duplicateRisk || 0
    });

    incident.confidence = fusion.confidence;
    incident.confidenceSignals = fusion.signals;

    // Recalculate severity
    incident.severity = calculateSeverity({
      hazardType: incident.hazardType,
      confidence: incident.confidence,
      sourceCount: incident.sourceCount,
      socialCount: incident.socialEvidenceCount
    });

    await incident.save();
    console.log(`[Incident Engine] Attached report ${report._id} to existing incident ${incident._id} (Count: ${incident.sourceCount})`);
  } else {
    // 2. Spawn new incident
    const initialFusion = calculateConfidence({
      text: report.textPrediction ? report.textPrediction.confidence : 0.6,
      image: report.imagePrediction ? report.imagePrediction.confidence : 0,
      spatialAgreement: 0.5,
      temporalAgreement: 0.5,
      sourceEvidence: 0.5,
      duplicateRisk: report.duplicateRisk || 0
    });

    const initialSeverity = calculateSeverity({
      hazardType: report.hazardType,
      confidence: initialFusion.confidence,
      sourceCount: 1,
      socialCount: 0
    });

    incident = await Incident.create({
      hazardType: report.hazardType,
      centroid: {
        type: "Point",
        coordinates: [lon, lat]
      },
      severity: initialSeverity,
      confidence: initialFusion.confidence,
      confidenceSignals: initialFusion.signals,
      reportIds: [report._id],
      status: INCIDENT_STATUS.DETECTED,
      firstSeenAt: report.reportedAt,
      lastSeenAt: report.reportedAt,
      sourceCount: 1,
      socialEvidenceCount: 0
    });

    console.log(`[Incident Engine] Spawned new incident ${incident._id} for hazard ${incident.hazardType}`);

    if (global.recordAuditLog) {
      global.recordAuditLog({
        actorId: null,
        action: AUDIT_ACTIONS.INCIDENT_CREATED,
        entityType: "INCIDENT",
        entityId: incident._id,
        metadata: { hazardType: incident.hazardType, severity: incident.severity }
      });
    }
  }

  // Update report with the incident link
  report.incidentId = incident._id;
  await report.save();

  // Trigger alert if high/critical
  await triggerIncidentAlert(incident);

  return incident;
};

module.exports = {
  clusterReportToIncident
};
