const { HAZARD_TYPES, SEVERITY_LEVELS } = require("../config/constants");

/**
 * Baseline risk weight by hazard type
 */
const HAZARD_BASE_SEVERITY = {
  [HAZARD_TYPES.CYCLONE_STORM]: 3.5,
  [HAZARD_TYPES.OIL_SPILL]: 3.0,
  [HAZARD_TYPES.FLOOD_HIGH_WATER]: 3.0,
  [HAZARD_TYPES.SHIP_INCIDENT]: 2.8,
  [HAZARD_TYPES.HARMFUL_ALGAL_BLOOM]: 2.5,
  [HAZARD_TYPES.DEAD_MARINE_LIFE]: 2.2,
  [HAZARD_TYPES.PLASTIC_POLLUTION]: 1.8,
  [HAZARD_TYPES.OTHER]: 1.5
};

/**
 * Compute triage severity level based on hazard type, corroboration, and confidence
 *
 * NOTE: Severity is a decision-support priority score for triage,
 * not an official governmental emergency warning.
 *
 * @param {object} params
 * @param {string} params.hazardType
 * @param {number} params.confidence Score from 0.0 to 1.0
 * @param {number} params.sourceCount Number of independent reports
 * @param {number} params.socialCount Number of supporting social evidence posts
 * @returns {string} One of 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
 */
const calculateSeverity = ({
  hazardType = HAZARD_TYPES.OTHER,
  confidence = 0.5,
  sourceCount = 1,
  socialCount = 0
}) => {
  const baseWeight = HAZARD_BASE_SEVERITY[hazardType] || 1.5;

  // Corroboration multiplier (more independent sources increase priority)
  const corroborationBonus = Math.min(2.0, (sourceCount - 1) * 0.4 + socialCount * 0.2);

  // Confidence factor
  const confidenceMultiplier = Math.max(0.5, confidence);

  // Overall score: typically between 1.0 and 8.0
  const totalScore = (baseWeight + corroborationBonus) * confidenceMultiplier;

  if (totalScore >= 5.0) {
    return SEVERITY_LEVELS.CRITICAL;
  }
  if (totalScore >= 3.5) {
    return SEVERITY_LEVELS.HIGH;
  }
  if (totalScore >= 2.2) {
    return SEVERITY_LEVELS.MEDIUM;
  }
  return SEVERITY_LEVELS.LOW;
};

module.exports = {
  calculateSeverity,
  HAZARD_BASE_SEVERITY
};
