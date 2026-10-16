const env = require("../config/env");

/**
 * 404 Route Not Found Middleware
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Resource not found - ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Central Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || res.statusCode;
  if (!statusCode || statusCode === 200) {
    statusCode = 500;
  }

  let message = err.message || "An unexpected internal server error occurred";
  let errors = null;

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid format for resource identifier '${err.value}'`;
  }

  // Handle Mongoose Duplicate Key Error (e.g. unique email)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `A record with this ${field} already exists`;
  }

  // Handle Mongoose Validation Error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed for provided input";
    errors = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message
    }));
  }

  // Handle JWT Malformed / Signature Errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid or tampered authentication token";
  }

  // Handle JWT Expired Error
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication token has expired. Please sign in again.";
  }

  // Handle Multer File Upload Errors
  if (err.name === "MulterError") {
    statusCode = 400;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = `Uploaded file exceeds size limit of ${env.UPLOAD_MAX_SIZE_MB}MB`;
    } else {
      message = `File upload error: ${err.message}`;
    }
  }

  // Response payload following OceanShield API standard
  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  // Include stack trace only in development
  if (env.isDevelopment && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = {
  notFoundHandler,
  errorHandler
};
