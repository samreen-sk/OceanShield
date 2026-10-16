/**
 * Standardized API response helpers for OceanShield
 */

/**
 * Send a success response
 * @param {object} res Express response object
 * @param {string} message Human-readable message
 * @param {any} data Response payload
 * @param {number} statusCode HTTP status code (default: 200)
 */
const successResponse = (res, message = "Operation successful", data = null, statusCode = 200) => {
  const response = {
    success: true,
    message
  };

  if (data !== null && data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send an error response
 * @param {object} res Express response object
 * @param {string} message Error description
 * @param {number} statusCode HTTP status code (default: 500)
 * @param {array|object|null} errors Additional validation or field error details
 */
const errorResponse = (res, message = "Something went wrong", statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = Array.isArray(errors) ? errors : [errors];
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
  errorResponse
};
