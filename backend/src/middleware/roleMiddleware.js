const { errorResponse } = require("../utils/apiResponse");

/**
 * Middleware to restrict access based on user role(s)
 * @param  {...string} roles Allowed roles (e.g. 'ADMIN', 'CITIZEN')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, "Authentication required before role verification", 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Forbidden: Role '${req.user.role}' is not authorized to access this resource`,
        403
      );
    }

    next();
  };
};

module.exports = {
  authorize
};
