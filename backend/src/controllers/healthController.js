const mongoose = require("mongoose");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/apiResponse");

/**
 * Basic Liveness probe
 * GET /health
 */
const getHealthStatus = asyncHandler(async (req, res) => {
  const dbStateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  };

  const dbState = mongoose.connection.readyState;
  const isHealthy = dbState === 1;

  const healthData = {
    status: isHealthy ? "healthy" : "degraded",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      status: dbStateMap[dbState] || "unknown",
      readyState: dbState
    },
    system: {
      memoryUsageMB: Math.round(process.memoryUsage().rss / (1024 * 1024)),
      nodeVersion: process.version
    }
  };

  const statusCode = isHealthy ? 200 : 503;
  return successResponse(res, "OceanShield Service Status", healthData, statusCode);
});

/**
 * Readiness probe for container orchestrators / load balancers
 * GET /ready
 */
const getReadinessStatus = asyncHandler(async (req, res) => {
  const isDbReady = mongoose.connection.readyState === 1;

  if (!isDbReady) {
    return res.status(503).json({
      success: false,
      status: "not_ready",
      message: "Database connection is not ready"
    });
  }

  return successResponse(res, "Service is ready to accept traffic", {
    status: "ready",
    timestamp: new Date().toISOString()
  });
});

module.exports = {
  getHealthStatus,
  getReadinessStatus
};
