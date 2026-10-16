const Report = require("../models/reportModel");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { getFileUrl } = require("../middleware/uploadMiddleware");
const { REPORT_STATUS, ROLES } = require("../config/constants");

/**
 * Submit a new Ocean Hazard Report
 * POST /api/v1/reports
 */
const createReport = asyncHandler(async (req, res) => {
  const { description, hazardType, locationAccuracy } = req.body;
  const [longitude, latitude] = req.parsedCoordinates;

  // Process uploaded files if any
  const mediaList = [];
  if (req.files && req.files.length > 0) {
    req.files.forEach((file) => {
      const isVideo = file.mimetype.startsWith("video/");
      mediaList.push({
        type: isVideo ? "video" : "image",
        url: getFileUrl(req, file.filename),
        filename: file.filename,
        mimeType: file.mimetype,
        sizeBytes: file.size
      });
    });
  }

  // Initial report document
  const newReport = await Report.create({
    userId: req.user._id,
    description: description.trim(),
    hazardType,
    media: mediaList,
    location: {
      type: "Point",
      coordinates: [longitude, latitude]
    },
    locationAccuracy: locationAccuracy ? parseFloat(locationAccuracy) : 10,
    status: REPORT_STATUS.PROCESSING
  });

  // Asynchronous background processing trigger will be connected here
  // (AI Classification, Duplicate Detection, Incident Association)
  // For non-blocking responsiveness, HTTP returns 201 immediately
  if (global.processReportPipeline) {
    setImmediate(() => {
      global.processReportPipeline(newReport._id).catch((err) => {
        console.error(`[Pipeline Error] Background processing failed for report ${newReport._id}:`, err.message);
      });
    });
  }

  return successResponse(
    res,
    "Report submitted successfully and is queued for verification",
    {
      reportId: newReport._id,
      status: newReport.status,
      hazardType: newReport.hazardType,
      reportedAt: newReport.reportedAt
    },
    201
  );
});

/**
 * Get all reports with filtering and pagination
 * GET /api/v1/reports
 */
const getReports = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const query = {};

  if (req.query.hazardType) {
    query.hazardType = req.query.hazardType;
  }
  if (req.query.status) {
    query.status = req.query.status;
  }
  if (req.query.incidentId) {
    query.incidentId = req.query.incidentId;
  }

  // If citizen/public request, omit internal reporter personal details for privacy
  const isElevated = req.user && req.user.role === ROLES.ADMIN;
  const userProjection = isElevated ? "name email" : "name";

  const [reports, total] = await Promise.all([
    Report.find(query)
      .sort({ reportedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", userProjection)
      .lean(),
    Report.countDocuments(query)
  ]);

  return successResponse(res, "Reports retrieved successfully", {
    reports,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalReports: total,
      limit
    }
  });
});

/**
 * Get current user's submitted reports
 * GET /api/v1/reports/my
 */
const getMyReports = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
  const skip = (page - 1) * limit;

  const query = { userId: req.user._id };

  const [reports, total] = await Promise.all([
    Report.find(query)
      .sort({ reportedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Report.countDocuments(query)
  ]);

  return successResponse(res, "My reports retrieved successfully", {
    reports,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalReports: total,
      limit
    }
  });
});

/**
 * Get nearby reports using 2dsphere geospatial search
 * GET /api/v1/reports/nearby?lat=...&lng=...&radius=...
 */
const getNearbyReports = asyncHandler(async (req, res) => {
  const { latitude, longitude, radiusMeters } = req.nearbyParams;

  const nearbyReports = await Report.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude]
        },
        $maxDistance: radiusMeters
      }
    }
  })
    .limit(100)
    .populate("userId", "name")
    .lean();

  return successResponse(res, "Nearby reports retrieved successfully", {
    center: { latitude, longitude },
    radiusMeters,
    count: nearbyReports.length,
    reports: nearbyReports
  });
});

/**
 * Get single report by ID
 * GET /api/v1/reports/:id
 */
const getReportById = asyncHandler(async (req, res) => {
  const isElevated = req.user && req.user.role === ROLES.ADMIN;
  const userProjection = isElevated ? "name email" : "name";

  const report = await Report.findById(req.params.id)
    .populate("userId", userProjection)
    .populate("incidentId", "severity status centroid hazardType");

  if (!report) {
    return errorResponse(res, "Report not found", 404);
  }

  return successResponse(res, "Report details retrieved successfully", { report });
});

/**
 * Update report status or attributes (Admin or reporter)
 * PATCH /api/v1/reports/:id
 */
const updateReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);

  if (!report) {
    return errorResponse(res, "Report not found", 404);
  }

  // Citizens can only modify description if still pending/processing
  const isOwner = req.user._id.toString() === report.userId.toString();
  const isAdmin = req.user.role === ROLES.ADMIN;

  if (!isOwner && !isAdmin) {
    return errorResponse(res, "Unauthorized to edit this report", 403);
  }

  const { description, status, hazardType } = req.body;

  if (description) {
    report.description = description.trim();
  }

  // Only admins can alter verified/rejected/duplicate status
  if (status) {
    if (!isAdmin) {
      return errorResponse(res, "Only administrators can update report verification status", 403);
    }
    if (!Object.values(REPORT_STATUS).includes(status)) {
      return errorResponse(res, "Invalid report status value", 400);
    }
    report.status = status;
  }

  if (hazardType && isAdmin) {
    report.hazardType = hazardType;
  }

  await report.save();

  return successResponse(res, "Report updated successfully", { report });
});

module.exports = {
  createReport,
  getReports,
  getMyReports,
  getNearbyReports,
  getReportById,
  updateReport
};
