const mongoose = require("mongoose");
const { HAZARD_TYPES, REPORT_STATUS } = require("../config/constants");

const mediaSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["image", "video"],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    sizeBytes: {
      type: Number,
      required: true
    }
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Report must be associated with a user"],
      index: true
    },
    description: {
      type: String,
      required: [true, "Hazard description is required"],
      trim: true,
      minlength: [5, "Description must be at least 5 characters long"],
      maxlength: [2000, "Description cannot exceed 2000 characters"]
    },
    hazardType: {
      type: String,
      enum: Object.values(HAZARD_TYPES),
      required: [true, "Hazard type is required"],
      index: true
    },
    media: [mediaSchema],
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, "Coordinates [longitude, latitude] are required"]
      }
    },
    locationAccuracy: {
      type: Number,
      default: 10, // estimated accuracy in meters
      min: 0
    },
    reportedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(REPORT_STATUS),
      default: REPORT_STATUS.PENDING,
      index: true
    },
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Incident",
      default: null,
      index: true
    },

    // AI Prediction & Classification Fields
    predictedHazard: {
      type: String,
      enum: [...Object.values(HAZARD_TYPES), null],
      default: null
    },
    aiConfidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null
    },
    textPrediction: {
      hazard: { type: String, default: null },
      confidence: { type: Number, default: null },
      probabilities: { type: Map, of: Number, default: {} }
    },
    imagePrediction: {
      hazard: { type: String, default: null },
      confidence: { type: Number, default: null },
      probabilities: { type: Map, of: Number, default: {} }
    },

    // Duplicate detection flags
    duplicateRisk: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    isDuplicateCandidate: {
      type: Boolean,
      default: false
    },
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
      default: null
    },

    // Detailed contributing confidence signals
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

// Geospatial index for radius, proximity, and bounding-box queries
reportSchema.index({ location: "2dsphere" });

// Compound indexes for rapid filtered dashboard queries
reportSchema.index({ status: 1, reportedAt: -1 });
reportSchema.index({ hazardType: 1, reportedAt: -1 });

const Report = mongoose.model("Report", reportSchema);

module.exports = Report;
