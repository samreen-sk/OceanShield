const express = require("express");
const router = express.Router();
const { getHeatmapData } = require("../controllers/mapController");
const { mapLimiter } = require("../middleware/rateLimitMiddleware");

// Public map visualization endpoints with mapLimiter
router.get("/heatmap", mapLimiter, getHeatmapData);

module.exports = router;
