const express = require("express");
const router = express.Router();
const {
  getIncidents,
  getIncidentById,
  updateIncidentStatus,
  getIncidentReports
} = require("../controllers/incidentController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { ROLES } = require("../config/constants");
const { validateIncidentStatusUpdate } = require("../validators/incidentValidator");

// Public / Citizen incident viewing
router.get("/", getIncidents);
router.get("/:id", getIncidentById);
router.get("/:id/reports", getIncidentReports);

// Admin-only incident status management & verification
router.patch(
  "/:id/status",
  authenticate,
  authorize(ROLES.ADMIN),
  validateIncidentStatusUpdate,
  updateIncidentStatus
);

module.exports = router;
