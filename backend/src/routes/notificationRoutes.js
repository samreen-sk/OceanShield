const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAsRead
} = require("../controllers/notificationController");
const { authenticate } = require("../middleware/authMiddleware");

// Notifications require authentication
router.use(authenticate);

router.get("/", getNotifications);
router.patch("/:id/read", markAsRead);

module.exports = router;
