const mongoose = require("mongoose");
const {
  SEVERITY_LEVELS,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUS,
  ROLES
} = require("../config/constants");

const notificationSchema = new mongoose.Schema(
  {
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Incident",
      required: true,
      index: true
    },
    recipientRole: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.ADMIN
    },
    department: {
      type: String,
      default: "COASTAL_DISASTER_MANAGEMENT"
    },
    severity: {
      type: String,
      enum: Object.values(SEVERITY_LEVELS),
      required: true
    },
    message: {
      type: String,
      required: true
    },
    channel: {
      type: String,
      enum: Object.values(NOTIFICATION_CHANNELS),
      default: NOTIFICATION_CHANNELS.EMAIL
    },
    status: {
      type: String,
      enum: Object.values(NOTIFICATION_STATUS),
      default: NOTIFICATION_STATUS.PENDING
    },
    sentAt: {
      type: Date,
      default: null
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ isRead: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
