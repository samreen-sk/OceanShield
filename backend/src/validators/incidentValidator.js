const { INCIDENT_STATUS, SEVERITY_LEVELS } = require("../config/constants");
const { errorResponse } = require("../utils/apiResponse");

/**
 * Validate incident status update payload
 */
const validateIncidentStatusUpdate = (req, res, next) => {
  const { status, verificationStatus, verificationNotes, severity } = req.body;
  const errors = [];

  if (status && !Object.values(INCIDENT_STATUS).includes(status)) {
    errors.push({
      field: "status",
      message: `Invalid status. Permitted: ${Object.values(INCIDENT_STATUS).join(", ")}`
    });
  }

  if (verificationStatus && !["PENDING", "VERIFIED", "REJECTED"].includes(verificationStatus)) {
    errors.push({
      field: "verificationStatus",
      message: "verificationStatus must be PENDING, VERIFIED, or REJECTED"
    });
  }

  if (severity && !Object.values(SEVERITY_LEVELS).includes(severity)) {
    errors.push({
      field: "severity",
      message: `Invalid severity. Permitted: ${Object.values(SEVERITY_LEVELS).join(", ")}`
    });
  }

  if (!status && !verificationStatus && !severity) {
    errors.push({
      field: "general",
      message: "At least one field (status, verificationStatus, or severity) must be provided for update"
    });
  }

  if (errors.length > 0) {
    return errorResponse(res, "Validation failed", 400, errors);
  }

  next();
};

module.exports = {
  validateIncidentStatusUpdate
};
