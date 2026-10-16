const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
      default: null,
      index: true
    },
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Incident",
      default: null,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ["CORRECTION", "VERIFICATION", "FALSE_REPORT", "OUTDATED", "GENERAL"],
      default: "CORRECTION"
    },
    comment: {
      type: String,
      required: [true, "Feedback comment is required"],
      trim: true,
      maxlength: 1000
    }
  },
  {
    timestamps: true
  }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);

module.exports = Feedback;
