const Feedback = require("../models/feedbackModel");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { AUDIT_ACTIONS } = require("../config/constants");

/**
 * Submit feedback on a report or incident
 * POST /api/v1/feedback
 */
const submitFeedback = asyncHandler(async (req, res) => {
  const { reportId, incidentId, type, comment } = req.body;

  if (!comment || typeof comment !== "string" || comment.trim().length === 0) {
    return errorResponse(res, "Comment is required for submitting feedback", 400);
  }

  if (!reportId && !incidentId) {
    return errorResponse(res, "Either reportId or incidentId must be specified", 400);
  }

  const feedback = await Feedback.create({
    reportId: reportId || null,
    incidentId: incidentId || null,
    userId: req.user._id,
    type: type || "CORRECTION",
    comment: comment.trim()
  });

  if (global.recordAuditLog) {
    global.recordAuditLog({
      actorId: req.user._id,
      action: AUDIT_ACTIONS.FEEDBACK_SUBMITTED,
      entityType: "FEEDBACK",
      entityId: feedback._id,
      metadata: { reportId, incidentId, type },
      req
    });
  }

  return successResponse(
    res,
    "Feedback submitted successfully. Thank you for contributing to hazard intelligence.",
    { feedback },
    201
  );
});

module.exports = {
  submitFeedback
};
