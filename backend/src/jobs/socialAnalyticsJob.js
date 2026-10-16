const Incident = require("../models/incidentModel");
const { correlateSocialEvidenceToIncident, seedSampleSocialStream } = require("../services/socialEvidenceService");
const { INCIDENT_STATUS } = require("../config/constants");

/**
 * Background worker task to scan and correlate permitted social signals to active incidents
 */
const processSocialAnalyticsJob = async () => {
  try {
    console.log("[Social Worker] Commencing social evidence correlation scan...");
    
    // Ensure baseline simulated public streams exist
    await seedSampleSocialStream();

    const activeIncidents = await Incident.find({
      status: { $in: [INCIDENT_STATUS.DETECTED, INCIDENT_STATUS.UNDER_REVIEW, INCIDENT_STATUS.IN_PROGRESS] }
    });

    for (const incident of activeIncidents) {
      await correlateSocialEvidenceToIncident(incident);
    }

    console.log(`[Social Worker] Finished scanning social corroboration for ${activeIncidents.length} active incidents.`);
  } catch (error) {
    console.error(`[Social Worker Error] Failed processing social analytics: ${error.message}`);
  }
};

module.exports = {
  processSocialAnalyticsJob
};
