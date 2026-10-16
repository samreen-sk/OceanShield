const SocialEvidence = require("../models/socialEvidenceModel");
const Incident = require("../models/incidentModel");
const { HAZARD_TYPES } = require("../config/constants");

/**
 * Corroborate an incident with permitted nearby social evidence
 * @param {object} incident Incident document
 * @param {number} radiusMeters Radius in meters (default: 10000m)
 */
const correlateSocialEvidenceToIncident = async (incident, radiusMeters = 10000) => {
  const [lon, lat] = incident.centroid.coordinates;
  const cutoffTime = new Date(incident.firstSeenAt.getTime() - 24 * 60 * 60 * 1000);

  // Find candidate social posts near the incident matching the hazard
  const matchingEvidence = await SocialEvidence.find({
    hazardClass: incident.hazardType,
    incidentId: null, // Not yet claimed
    timestamp: { $gte: cutoffTime },
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lon, lat]
        },
        $maxDistance: radiusMeters
      }
    }
  }).limit(5);

  if (matchingEvidence.length > 0) {
    const evidenceIds = matchingEvidence.map((e) => e._id);
    await SocialEvidence.updateMany(
      { _id: { $in: evidenceIds } },
      { $set: { incidentId: incident._id } }
    );

    incident.socialEvidenceCount += matchingEvidence.length;
    await incident.save();

    console.log(
      `[Social Evidence Engine] Associated ${matchingEvidence.length} social post(s) with incident ${incident._id}`
    );
  }

  return matchingEvidence;
};

/**
 * Seed simulated public social media stream data for demonstration & testing
 */
const seedSampleSocialStream = async () => {
  const count = await SocialEvidence.countDocuments();
  if (count > 0) return; // Already seeded

  const samplePosts = [
    {
      source: "COASTAL_WEATHER_FEED",
      externalId: "tw-10928374",
      text: "Huge black oily substance washing up on Marina Beach near lighthouse #Chennai #OilSpill",
      location: { type: "Point", coordinates: [80.2824, 13.0475] },
      hazardClass: HAZARD_TYPES.OIL_SPILL,
      relevanceScore: 0.92
    },
    {
      source: "COMMUNITY_FISHERS_FORUM",
      externalId: "mast-4829104",
      text: "Large mass of plastic crates and discarded fishing nets spotted adrift off Ennore port",
      location: { type: "Point", coordinates: [80.3241, 13.2201] },
      hazardClass: HAZARD_TYPES.PLASTIC_POLLUTION,
      relevanceScore: 0.88
    },
    {
      source: "PUBLIC_BEACH_UPDATES",
      externalId: "tw-99482711",
      text: "Reddish green bloom discoloration visible along coastal waters, bad odor #AlgaeBloom",
      location: { type: "Point", coordinates: [72.8258, 18.922] },
      hazardClass: HAZARD_TYPES.HARMFUL_ALGAL_BLOOM,
      relevanceScore: 0.85
    }
  ];

  await SocialEvidence.insertMany(samplePosts);
  console.log(`[Social Evidence Engine] Seeded ${samplePosts.length} sample public social evidence posts`);
};

module.exports = {
  correlateSocialEvidenceToIncident,
  seedSampleSocialStream
};
