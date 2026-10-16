const Notification = require("../models/notificationModel");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse, errorResponse } = require("../utils/apiResponse");

/**
 * Get notifications list
 * GET /api/v1/notifications
 */
const getNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
  const skip = (page - 1) * limit;

  const query = {};
  if (req.query.isRead !== undefined) {
    query.isRead = req.query.isRead === "true";
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("incidentId", "hazardType severity centroid status")
      .lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ isRead: false })
  ]);

  return successResponse(res, "Notifications retrieved successfully", {
    unreadCount,
    notifications,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalNotifications: total,
      limit
    }
  });
});

/**
 * Mark notification as read
 * PATCH /api/v1/notifications/:id/read
 */
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    return errorResponse(res, "Notification not found", 404);
  }

  return successResponse(res, "Notification marked as read", { notification });
});

module.exports = {
  getNotifications,
  markAsRead
};
