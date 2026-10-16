const express = require("express");
const router = express.Router();
const { getHealthStatus, getReadinessStatus } = require("../controllers/healthController");

router.get("/health", getHealthStatus);
router.get("/ready", getReadinessStatus);

module.exports = router;
