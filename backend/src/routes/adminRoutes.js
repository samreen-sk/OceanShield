const express = require("express");
const router = express.Router();
const { getAdminAnalytics } = require("../controllers/adminController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { ROLES } = require("../config/constants");

// Protect all admin endpoints with JWT and ADMIN role
router.use(authenticate, authorize(ROLES.ADMIN));

router.get("/analytics", getAdminAnalytics);

module.exports = router;
