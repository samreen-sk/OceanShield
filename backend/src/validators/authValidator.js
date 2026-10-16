const { errorResponse } = require("../utils/apiResponse");

/**
 * Validate registration request body
 */
const validateRegisterInput = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    errors.push({ field: "name", message: "Name must be at least 2 characters long" });
  }

  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
  if (!email || !emailRegex.test(email.trim())) {
    errors.push({ field: "email", message: "A valid email address is required" });
  }

  if (!password || typeof password !== "string" || password.length < 8) {
    errors.push({ field: "password", message: "Password must be at least 8 characters long" });
  }

  if (errors.length > 0) {
    return errorResponse(res, "Validation failed", 400, errors);
  }

  next();
};

/**
 * Validate login request body
 */
const validateLoginInput = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== "string" || !email.trim()) {
    errors.push({ field: "email", message: "Email is required" });
  }

  if (!password || typeof password !== "string") {
    errors.push({ field: "password", message: "Password is required" });
  }

  if (errors.length > 0) {
    return errorResponse(res, "Validation failed", 400, errors);
  }

  next();
};

module.exports = {
  validateRegisterInput,
  validateLoginInput
};
