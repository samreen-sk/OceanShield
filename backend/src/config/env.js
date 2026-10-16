const dotenv = require("dotenv");
const path = require("path");

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/oceanshield",

  // JWT configuration
  JWT_SECRET: process.env.JWT_SECRET || "default_dev_secret_change_in_production",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1h",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "default_dev_refresh_secret",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  // CORS Frontend origin
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",

  // Python AI Service URL
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || "http://localhost:8000",

  // Redis URL (for worker/rate limit)
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  AUTH_RATE_LIMIT_MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10,
  REPORT_RATE_LIMIT_MAX: parseInt(process.env.REPORT_RATE_LIMIT_MAX, 10) || 15,

  // Geospatial & Clustering Thresholds
  INCIDENT_CLUSTER_RADIUS_METERS: parseInt(process.env.INCIDENT_CLUSTER_RADIUS_METERS, 10) || 5000,
  INCIDENT_CLUSTER_TIME_MINUTES: parseInt(process.env.INCIDENT_CLUSTER_TIME_MINUTES, 10) || 1440, // 24 hours

  // Upload limits
  UPLOAD_MAX_SIZE_MB: parseInt(process.env.UPLOAD_MAX_SIZE_MB, 10) || 25,

  // Notification / SMTP settings
  EMAIL_HOST: process.env.EMAIL_HOST || "smtp.mailtrap.io",
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT, 10) || 2525,
  EMAIL_USER: process.env.EMAIL_USER || "",
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || "",
  EMAIL_FROM: process.env.EMAIL_FROM || "alerts@oceanshield.gov",

  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV !== "production"
};

// Safety check for production deployment
if (env.isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes("default"))) {
  console.warn("WARNING: Running in production with an insecure or default JWT_SECRET!");
}

module.exports = env;
