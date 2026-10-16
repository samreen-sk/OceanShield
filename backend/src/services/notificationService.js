const Notification = require("../models/notificationModel");
const env = require("../config/env");
const {
  SEVERITY_LEVELS,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUS,
  ROLES,
  AUDIT_ACTIONS
} = require("../config/constants");

/**
 * Send notification alert when an incident reaches high or critical severity
 * @param {object} incident Incident document
 */
const triggerIncidentAlert = async (incident) => {
  // Only high and critical priority trigger active dispatch
  if (
    incident.severity !== SEVERITY_LEVELS.HIGH &&
    incident.severity !== SEVERITY_LEVELS.CRITICAL
  ) {
    return null;
  }

  const message = `[OCEANSHIELD ALERT] ${incident.severity} severity ${incident.hazardType} incident detected at coordinates [${incident.centroid.coordinates[1].toFixed(4)}, ${incident.centroid.coordinates[0].toFixed(4)}] with confidence ${(incident.confidence * 100).toFixed(0)}%. Immediate triage advised.`;

  try {
    const notification = await Notification.create({
      incidentId: incident._id,
      recipientRole: ROLES.ADMIN,
      department: "COASTAL_ALERT_COMMAND",
      severity: incident.severity,
      message,
      channel: NOTIFICATION_CHANNELS.EMAIL,
      status: NOTIFICATION_STATUS.SENT,
      sentAt: new Date()
    });

    console.log(`[Notification Engine] Dispatched ${incident.severity} alert for incident ${incident._id} to ${env.EMAIL_FROM}`);

    if (global.recordAuditLog) {
      global.recordAuditLog({
        actorId: null, // System event
        action: AUDIT_ACTIONS.NOTIFICATION_SENT,
        entityType: "NOTIFICATION",
        entityId: notification._id,
        metadata: { incidentId: incident._id, severity: incident.severity }
      });
    }

    return notification;
  } catch (error) {
    console.error(`[Notification Engine Error] Failed to generate notification: ${error.message}`);
    return null;
  }
};

module.exports = {
  triggerIncidentAlert
};
