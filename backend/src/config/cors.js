const env = require("./env");

/**
 * Production-ready CORS options.
 * Allows requests strictly from configured client origins (or localhost in dev).
 */
const allowedOrigins = [
  env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173"
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server or tools like Postman/cURL with no origin header
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || env.isDevelopment) {
      callback(null, true);
    } else {
      callback(new Error(`Origin '${origin}' not allowed by OceanShield CORS policy`));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin"
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  credentials: true,
  maxAge: 86400 // Cache preflight requests for 24 hours
};

module.exports = corsOptions;
