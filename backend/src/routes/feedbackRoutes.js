const express = require("express");
const router = express.Router();
const { submitFeedback } = require("../controllers/feedbackController");
const { authenticate } = require("../middleware/authMiddleware");
const { feedbackLimiter } = require("../middleware/rateLimitMiddleware");

// Protected feedback submission with rate limiting
router.post("/", authenticate, feedbackLimiter, submitFeedback);

module.exports = router;
