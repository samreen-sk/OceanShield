const mongoose = require("mongoose");
const { HAZARD_TYPES } = require("../config/constants");

const socialEvidenceSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      required: true,
      default: "PUBLIC_FEED_SIMULATED"
    },
    externalId: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    hazardClass: {
      type: String,
      enum: Object.values(HAZARD_TYPES),
      default: HAZARD_TYPES.OTHER
    },
    relevanceScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    },
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Incident",
      default: null,
      index: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

socialEvidenceSchema.index({ location: "2dsphere" });

const SocialEvidence = mongoose.model("SocialEvidence", socialEvidenceSchema);

module.exports = SocialEvidence;
