const jwt = require("jsonwebtoken");
const env = require("../config/env");
const User = require("../models/userModel");
const { errorResponse } = require("../utils/apiResponse");

/**
 * Middleware to authenticate requests via JWT Bearer Token
 */
const authenticate = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, env.JWT_SECRET);

      // Fetch user from DB (excluding passwordHash)
      const user = await User.findById(decoded.userId).select("-passwordHash");

      if (!user) {
        return errorResponse(res, "User associated with token no longer exists", 401);
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return errorResponse(res, "Authentication token has expired", 401);
      }
      return errorResponse(res, "Authentication token is invalid", 401);
    }
  } else {
    return errorResponse(res, "Access denied. No authorization token provided", 401);
  }
};

module.exports = {
  authenticate
};
