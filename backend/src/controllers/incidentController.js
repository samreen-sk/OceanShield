const Incident = require("../models/incidentModel");
const Report = require("../models/reportModel");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { AUDIT_ACTIONS, ROLES } = require("../config/constants");

/**
 * Get all incidents with filters & pagination
 * GET /api/v1/incidents
 */
const getIncidents = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const query = {};

  if (req.query.hazardType) {
    query.hazardType = req.query.hazardType;
  }
  if (req.query.severity) {
    query.severity = req.query.severity;
  }
  if (req.query.status) {
    query.status = req.query.status;
  }
  if (req.query.minConfidence) {
    query.confidence = { $gte: parseFloat(req.query.minConfidence) };
  }

  // Date range filter
  if (req.query.startDate || req.query.endDate) {
    query.lastSeenAt = {};
    if (req.query.startDate) {
      query.lastSeenAt.$gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      query.lastSeenAt.$lte = new Date(req.query.endDate);
    }
  }

  const [incidents, total] = await Promise.all([
    Incident.find(query)
      .sort({ lastSeenAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("verifiedBy", "name email")
      .lean(),
    Incident.countDocuments(query)
  ]);

  return successResponse(res, "Incidents retrieved successfully", {
    incidents,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalIncidents: total,
      limit
    }
  });
});

/**
 * Get single incident by ID with associated reports
 * GET /api/v1/incidents/:id
 */
const getIncidentById = asyncHandler(async (req, res) => {
  const incident = await Incident.findById(req.params.id)
    .populate("verifiedBy", "name email")
    .populate({
      path: "reportIds",
      select: "hazardType description media location reportedAt status aiConfidence userId",
      populate: {
        path: "userId",
        select: "name"
      }
    });

  if (!incident) {
    return errorResponse(res, "Incident not found", 404);
  }

  return successResponse(res, "Incident details retrieved successfully", { incident });
});

/**
 * Update incident status / verification (Admin only)
 * PATCH /api/v1/incidents/:id/status
 */
const updateIncidentStatus = asyncHandler(async (req, res) => {
  const { status, verificationStatus, verificationNotes, severity } = req.body;
  const incident = await Incident.findById(req.params.id);

  if (!incident) {
    return errorResponse(res, "Incident not found", 404);
  }

  const previousState = {
    status: incident.status,
    verificationStatus: incident.verificationStatus,
    severity: incident.severity
  };

  if (status) incident.status = status;
  if (severity) incident.severity = severity;

  if (verificationStatus) {
    incident.verificationStatus = verificationStatus;
    incident.verifiedBy = req.user._id;
    incident.verifiedAt = new Date();
  }

  if (verificationNotes !== undefined) {
    incident.verificationNotes = verificationNotes;
  }

  await incident.save();

  // Record audit log if audit service is available
  if (global.recordAuditLog) {
    global.recordAuditLog({
      actorId: req.user._id,
      action: verificationStatus === "VERIFIED" 
        ? AUDIT_ACTIONS.ADMIN_VERIFIED_INCIDENT 
        : AUDIT_ACTIONS.INCIDENT_STATUS_CHANGED,
      entityType: "INCIDENT",
      entityId: incident._id,
      metadata: { previousState, newState: { status: incident.status, verificationStatus: incident.verificationStatus, severity: incident.severity } },
      req
    });
  }

  return successResponse(res, "Incident status updated successfully", { incident });
});

/**
 * Get all reports for a specific incident
 * GET /api/v1/incidents/:id/reports
 */
const getIncidentReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({ incidentId: req.params.id })
    .populate("userId", "name")
    .sort({ reportedAt: -1 })
    .lean();

  return successResponse(res, "Incident reports retrieved successfully", {
    incidentId: req.params.id,
    count: reports.length,
    reports
  });
});

module.exports = {
  getIncidents,
  getIncidentById,
  updateIncidentStatus,
  getIncidentReports
};
