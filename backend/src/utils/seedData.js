const mongoose = require("mongoose");
const env = require("../config/env");
const { connectDB, disconnectDB } = require("../config/db");
const User = require("../models/userModel");
const Report = require("../models/reportModel");
const Incident = require("../models/incidentModel");
const SocialEvidence = require("../models/socialEvidenceModel");
const {
  ROLES,
  HAZARD_TYPES,
  REPORT_STATUS,
  INCIDENT_STATUS,
  SEVERITY_LEVELS
} = require("../config/constants");

const seedDatabase = async () => {
  try {
    console.log("[Seed] Connecting to MongoDB...");
    await connectDB();

    console.log("[Seed] Cleaning existing mock collections...");
    await Promise.all([
      User.deleteMany({}),
      Report.deleteMany({}),
      Incident.deleteMany({}),
      SocialEvidence.deleteMany({})
    ]);

    console.log("[Seed] Seeding Users...");
    // 1. Seed Admin & Citizens
    const adminUser = await User.create({
      name: "Coast Guard Commander",
      email: "admin@oceanshield.gov",
      passwordHash: "Admin@OceanShield2026", // Pre-save hook will hash this via bcrypt
      role: ROLES.ADMIN
    });

    const citizen1 = await User.create({
      name: "Ramesh Fisher",
      email: "ramesh.fisher@example.com",
      passwordHash: "Citizen@Pass123",
      role: ROLES.CITIZEN
    });

    const citizen2 = await User.create({
      name: "Priya Coastal Resident",
      email: "priya.coastal@example.com",
      passwordHash: "Citizen@Pass123",
      role: ROLES.CITIZEN
    });

    console.log(`[Seed] Created 1 Admin (${adminUser.email}) and 2 Citizens`);

    console.log("[Seed] Seeding Reports...");
    // 2. Seed Reports (e.g. around Chennai Marina / Ennore Coast)
    const report1 = await Report.create({
      userId: citizen1._id,
      description: "Thick black tar-like oil slick spreading across rocky breakwater near Marina beach lighthouse.",
      hazardType: HAZARD_TYPES.OIL_SPILL,
      location: {
        type: "Point",
        coordinates: [80.2824, 13.0475] // [lon, lat]
      },
      locationAccuracy: 8,
      status: REPORT_STATUS.VERIFIED,
      predictedHazard: HAZARD_TYPES.OIL_SPILL,
      aiConfidence: 0.94,
      textPrediction: {
        hazard: HAZARD_TYPES.OIL_SPILL,
        confidence: 0.94,
        probabilities: { OIL_SPILL: 0.94, OTHER: 0.06 }
      },
      confidenceSignals: {
        text: 0.94,
        image: 0.88,
        spatialAgreement: 0.85,
        temporalAgreement: 0.90,
        sourceEvidence: 0.70,
        duplicateRisk: 0.05
      }
    });

    const report2 = await Report.create({
      userId: citizen2._id,
      description: "Strong diesel and petroleum stench with black coating on waves near harbor mouth.",
      hazardType: HAZARD_TYPES.OIL_SPILL,
      location: {
        type: "Point",
        coordinates: [80.2835, 13.049]
      },
      locationAccuracy: 12,
      status: REPORT_STATUS.VERIFIED,
      predictedHazard: HAZARD_TYPES.OIL_SPILL,
      aiConfidence: 0.91,
      textPrediction: {
        hazard: HAZARD_TYPES.OIL_SPILL,
        confidence: 0.91,
        probabilities: { OIL_SPILL: 0.91, OTHER: 0.09 }
      },
      confidenceSignals: {
        text: 0.91,
        image: 0.80,
        spatialAgreement: 0.90,
        temporalAgreement: 0.92,
        sourceEvidence: 0.70,
        duplicateRisk: 0.10
      }
    });

    const report3 = await Report.create({
      userId: citizen1._id,
      description: "Severe plastic bottles and ghost nets tangled around mangrove roots.",
      hazardType: HAZARD_TYPES.PLASTIC_POLLUTION,
      location: {
        type: "Point",
        coordinates: [80.3205, 13.218]
      },
      locationAccuracy: 15,
      status: REPORT_STATUS.PENDING,
      predictedHazard: HAZARD_TYPES.PLASTIC_POLLUTION,
      aiConfidence: 0.88
    });

    console.log(`[Seed] Created ${[report1, report2, report3].length} reports`);

    console.log("[Seed] Seeding Incidents...");
    // 3. Seed Incident linking report 1 and 2
    const incident1 = await Incident.create({
      hazardType: HAZARD_TYPES.OIL_SPILL,
      centroid: {
        type: "Point",
        coordinates: [80.283, 13.0482]
      },
      severity: SEVERITY_LEVELS.HIGH,
      confidence: 0.92,
      reportIds: [report1._id, report2._id],
      status: INCIDENT_STATUS.VERIFIED,
      firstSeenAt: new Date(Date.now() - 3600000),
      lastSeenAt: new Date(),
      sourceCount: 2,
      socialEvidenceCount: 1,
      verificationStatus: "VERIFIED",
      verifiedBy: adminUser._id,
      verifiedAt: new Date(),
      verificationNotes: "Visual oil slick corroborated by aerial coastal patrol and citizen reports."
    });

    // Link reports to incident
    report1.incidentId = incident1._id;
    report2.incidentId = incident1._id;
    await Promise.all([report1.save(), report2.save()]);

    console.log("[Seed] Seeding Social Evidence...");
    // 4. Seed Social Evidence
    await SocialEvidence.create({
      source: "TWITTER_PUBLIC_SIMULATED",
      externalId: "tw-seed-001",
      text: "Warning: Coast guard vessel investigating fuel/oil sheen off Marina Beach #ChennaiCoast",
      location: {
        type: "Point",
        coordinates: [80.284, 13.048]
      },
      hazardClass: HAZARD_TYPES.OIL_SPILL,
      relevanceScore: 0.92,
      incidentId: incident1._id
    });

    console.log("==================================================");
    console.log(" OceanShield Database Seed Completed Successfully!");
    console.log("==================================================");
    console.log(" Default Admin Credentials (Development):");
    console.log("   Email:    admin@oceanshield.gov");
    console.log("   Password: Admin@OceanShield2026");
    console.log(" Citizen Credentials (Development):");
    console.log("   Email:    ramesh.fisher@example.com");
    console.log("   Password: Citizen@Pass123");
    console.log("==================================================");

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error("[Seed Error] Failed to seed database:", error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
