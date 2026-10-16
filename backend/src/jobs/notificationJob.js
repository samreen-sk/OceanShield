const { triggerIncidentAlert } = require("../services/notificationService");

/**
 * Background worker task to dispatch incident notifications asynchronously
 * @param {object} incident Incident document
 */
const processNotificationJob = async (incident) => {
  try {
    console.log(`[Notification Worker] Processing dispatch for incident: ${incident._id}`);
    await triggerIncidentAlert(incident);
  } catch (error) {
    console.error(`[Notification Worker Error] Failed processing notification: ${error.message}`);
  }
};

module.exports = {
  processNotificationJob
};
