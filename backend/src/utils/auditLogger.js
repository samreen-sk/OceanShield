const AuditLog = require("../models/auditLogModel");

/**
 * Record an audit log entry safely
 * @param {object} params
 * @param {string|null} params.actorId User ID performing action
 * @param {string} params.action Predefined action enum
 * @param {string} params.entityType e.g. 'INCIDENT', 'REPORT', 'USER'
 * @param {string|null} params.entityId ID of target entity
 * @param {object} params.metadata Non-sensitive metadata details
 * @param {object} [params.req] Optional Express request to extract IP & user agent
 */
const recordAuditLog = async ({
  actorId = null,
  action,
  entityType,
  entityId = null,
  metadata = {},
  req = null
}) => {
  try {
    let ipAddress = null;
    let userAgent = null;

    if (req) {
      ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress || null;
      userAgent = req.headers["user-agent"] || null;
    }

    // Sanitize metadata to prevent logging sensitive keys
    const sanitizedMetadata = { ...metadata };
    delete sanitizedMetadata.password;
    delete sanitizedMetadata.passwordHash;
    delete sanitizedMetadata.token;
    delete sanitizedMetadata.refreshToken;

    await AuditLog.create({
      actorId,
      action,
      entityType,
      entityId,
      metadata: sanitizedMetadata,
      ipAddress,
      userAgent
    });
  } catch (error) {
    console.error(`[Audit Log Error] Failed to write audit record: ${error.message}`);
  }
};

// Expose globally for convenience
global.recordAuditLog = recordAuditLog;

module.exports = {
  recordAuditLog
};
