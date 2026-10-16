const Report = require("../models/reportModel");
const Incident = require("../models/incidentModel");
const User = require("../models/userModel");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");
const { REPORT_STATUS, INCIDENT_STATUS, SEVERITY_LEVELS } = require("../config/constants");

/**
 * Get aggregated analytics for administrator dashboard
 * GET /api/v1/admin/analytics
 */
const getAdminAnalytics = asyncHandler(async (req, res) => {
  // Parallel aggregation queries for optimal performance
  const [
    totalReports,
    totalIncidents,
    totalCitizens,
    pendingReports,
    verifiedIncidents,
    duplicateReports,
    rejectedReports,
    criticalIncidents,
    severityBreakdown,
    hazardBreakdown,
    recentReportsGrouped
  ] = await Promise.all([
    Report.countDocuments(),
    Incident.countDocuments(),
    User.countDocuments({ role: "CITIZEN" }),
    Report.countDocuments({ status: REPORT_STATUS.PENDING }),
    Incident.countDocuments({ verificationStatus: "VERIFIED" }),
    Report.countDocuments({ status: REPORT_STATUS.DUPLICATE }),
    Report.countDocuments({ status: REPORT_STATUS.REJECTED }),
    Incident.countDocuments({ severity: SEVERITY_LEVELS.CRITICAL }),

    // Group incidents by severity
    Incident.aggregate([
      {
        $group: {
          _id: "$severity",
          count: { $sum: 1 }
        }
      }
    ]),

    // Group reports by hazard type
    Report.aggregate([
      {
        $group: {
          _id: "$hazardType",
          count: { $sum: 1 }
        }
      }
    ]),

    // Daily report submission trend for last 7 days
    Report.aggregate([
      {
        $match: {
          reportedAt: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$reportedAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);

  // Format breakdowns
  const severityDistribution = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0
  };
  severityBreakdown.forEach((item) => {
    if (item._id) severityDistribution[item._id] = item.count;
  });

  const hazardDistribution = {};
  hazardBreakdown.forEach((item) => {
    if (item._id) hazardDistribution[item._id] = item.count;
  });

  const analyticsData = {
    overview: {
      totalReports,
      totalIncidents,
      totalCitizens,
      pendingReports,
      verifiedIncidents,
      duplicateReports,
      rejectedReports,
      criticalIncidents
    },
    severityDistribution,
    hazardDistribution,
    reportsTrendLast7Days: recentReportsGrouped.map((item) => ({
      date: item._id,
      count: item.count
    }))
  };

  return successResponse(res, "Admin analytics retrieved successfully", analyticsData);
});

module.exports = {
  getAdminAnalytics
};
