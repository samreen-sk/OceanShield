const mongoose = require("mongoose");
const { AUDIT_ACTIONS } = require("../config/constants");

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // Null for system automated background operations
      index: true
    },
    action: {
      type: String,
      enum: Object.values(AUDIT_ACTIONS),
      required: true,
      index: true
    },
    entityType: {
      type: String,
      required: true,
      enum: ["USER", "REPORT", "INCIDENT", "NOTIFICATION", "FEEDBACK", "SYSTEM"]
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String,
      default: null
    },
    userAgent: {
      type: String,
      default: null
    }
  },
  {
    timestamps: { createdAt: "timestamp", updatedAt: false }
  }
);

auditLogSchema.index({ timestamp: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

module.exports = AuditLog;
