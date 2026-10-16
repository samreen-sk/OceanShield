const rateLimit = require("express-rate-limit");
const env = require("../config/env");

/**
 * Standard factory for rate limiters with OceanShield JSON error response
 */
const createRateLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs || env.RATE_LIMIT_WINDOW_MS,
    max: options.max || env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: options.message || "Too many requests. Please try again later.",
        retryAfterMinutes: Math.ceil((options.windowMs || env.RATE_LIMIT_WINDOW_MS) / (60 * 1000))
      });
    },
    ...options
  });
};

// 1. General Global Limiter (Default for all public endpoints)
const globalLimiter = createRateLimiter({
  windowMs: env.RATE_LIMIT_WINDOW_MS, // 15 mins
  max: env.RATE_LIMIT_MAX, // 100
  message: "Global rate limit exceeded. Please wait a few minutes before retrying."
});

// 2. Strict Auth Limiter (Brute-force protection for login and registration)
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: env.AUTH_RATE_LIMIT_MAX, // 10 attempts
  message: "Too many authentication attempts. Please wait 15 minutes before trying again."
});

// 3. Report Creation Limiter (Spam and false report flood protection)
const reportCreationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: env.REPORT_RATE_LIMIT_MAX, // 15 reports
  keyGenerator: (req) => {
    // Rate limit per authenticated user if logged in, fallback to IP
    return req.user ? req.user._id.toString() : req.ip;
  },
  message: "Report submission limit reached (15 reports per hour). Thank you for your diligence."
});

// 4. Map Query Limiter (High-throughput read for interactive maps)
const mapLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: "Map query limit reached. Please reduce map panning frequency."
});

// 5. Feedback Limiter
const feedbackLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: "Feedback submission limit reached. Please wait before submitting more feedback."
});

module.exports = {
  globalLimiter,
  authLimiter,
  reportCreationLimiter,
  mapLimiter,
  feedbackLimiter
};
