const mongoose = require("mongoose");
const { HAZARD_TYPES, INCIDENT_STATUS, SEVERITY_LEVELS } = require("../config/constants");

const incidentSchema = new mongoose.Schema(
  {
    hazardType: {
      type: String,
      enum: Object.values(HAZARD_TYPES),
      required: [true, "Incident hazard type is required"],
      index: true
    },
    centroid: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, "Centroid coordinates [longitude, latitude] are required"]
      }
    },
    severity: {
      type: String,
      enum: Object.values(SEVERITY_LEVELS),
      default: SEVERITY_LEVELS.LOW,
      index: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    },
    reportIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Report"
      }
    ],
    status: {
      type: String,
      enum: Object.values(INCIDENT_STATUS),
      default: INCIDENT_STATUS.DETECTED,
      index: true
    },
    firstSeenAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    sourceCount: {
      type: Number,
      default: 1,
      min: 1
    },
    socialEvidenceCount: {
      type: Number,
      default: 0,
      min: 0
    },

    // Administrative verification
    verificationStatus: {
      type: String,
      enum: ["PENDING", "VERIFIED", "REJECTED"],
      default: "PENDING"
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    verificationNotes: {
      type: String,
      default: ""
    },

    // Aggregated explainable confidence signals
    confidenceSignals: {
      text: { type: Number, default: 0 },
      image: { type: Number, default: 0 },
      spatialAgreement: { type: Number, default: 0 },
      temporalAgreement: { type: Number, default: 0 },
      sourceEvidence: { type: Number, default: 0 },
      duplicateRisk: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true
  }
);

// 2dsphere index on centroid for spatial clustering and radius queries
incidentSchema.index({ centroid: "2dsphere" });

// Compound indexes for fast filtered searches
incidentSchema.index({ status: 1, severity: 1, lastSeenAt: -1 });
incidentSchema.index({ hazardType: 1, status: 1 });

const Incident = mongoose.model("Incident", incidentSchema);

module.exports = Incident;
