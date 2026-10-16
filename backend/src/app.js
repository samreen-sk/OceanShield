const express = require("express");
const path = require("path");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");

const env = require("./config/env");
const corsOptions = require("./config/cors");
const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const reportRoutes = require("./routes/reportRoutes");
const incidentRoutes = require("./routes/incidentRoutes");
const mapRoutes = require("./routes/mapRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { globalLimiter } = require("./middleware/rateLimitMiddleware");
const { notFoundHandler, errorHandler } = require("./middleware/errorMiddleware");

// Initialize global background job processor & audit logger
require("./jobs/aiProcessingJob");
require("./utils/auditLogger");

const app = express();

// Security Headers with Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" } // allows serving images cross-origin
  })
);

// Cross-Origin Resource Sharing
app.use(cors(corsOptions));

// Global Rate Limiting across API
app.use("/api", globalLimiter);

// HTTP Request Logger
if (env.isDevelopment) {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Request Payload Parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static directory for uploaded media
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

// Direct root health check routes
app.use("/", healthRoutes);

// API v1 Router Mount
const apiV1Router = express.Router();
apiV1Router.use("/", healthRoutes);
apiV1Router.use("/auth", authRoutes);
apiV1Router.use("/reports", reportRoutes);
apiV1Router.use("/incidents", incidentRoutes);
apiV1Router.use("/map", mapRoutes);
apiV1Router.use("/notifications", notificationRoutes);
apiV1Router.use("/feedback", feedbackRoutes);
apiV1Router.use("/admin", adminRoutes);

// Mount API v1 namespace
app.use("/api/v1", apiV1Router);

// Centralized 404 & Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
