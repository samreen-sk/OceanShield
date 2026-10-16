const express = require("express");
const router = express.Router();
const {
  createReport,
  getReports,
  getMyReports,
  getNearbyReports,
  getReportById,
  updateReport
} = require("../controllers/reportController");
const { authenticate } = require("../middleware/authMiddleware");
const { upload } = require("../middleware/uploadMiddleware");
const { reportCreationLimiter } = require("../middleware/rateLimitMiddleware");
const {
  validateCreateReport,
  validateNearbyQuery
} = require("../validators/reportValidator");

// Public / Citizen query endpoints
router.get("/nearby", validateNearbyQuery, getNearbyReports);
router.get("/", getReports);

// Authenticated Citizen endpoints
router.get("/my", authenticate, getMyReports);
router.post(
  "/",
  authenticate,
  reportCreationLimiter,
  upload.array("media", 5),
  validateCreateReport,
  createReport
);

// Individual report endpoints
router.get("/:id", getReportById);
router.patch("/:id", authenticate, updateReport);

module.exports = router;
