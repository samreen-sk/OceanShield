/**
 * OceanShield Explainable Confidence Fusion Engine
 *
 * Combines multimodal and multi-source evidence signals into a transparent,
 * explainable confidence metric:
 *
 * Confidence = w1*Image + w2*Text + w3*Spatial + w4*Temporal + w5*Source - w6*DuplicateRisk
 *
 * NOTE: Weights are configurable engineering thresholds, not claimed as scientifically validated constants.
 */

const DEFAULT_WEIGHTS = {
  text: 0.25,
  image: 0.25,
  spatialAgreement: 0.20,
  temporalAgreement: 0.15,
  sourceEvidence: 0.15,
  duplicateRisk: 0.20
};

/**
 * Calculate multi-signal fusion confidence
 * @param {object} signals Input signal scores [0 to 1]
 * @param {object} customWeights Optional override weights
 * @returns {object} { confidence: number, signals: object }
 */
const calculateConfidence = (signals = {}, customWeights = {}) => {
  const weights = { ...DEFAULT_WEIGHTS, ...customWeights };

  // Normalize individual signals [0.0 - 1.0]
  const textScore = Math.max(0, Math.min(1, signals.text || 0));
  const imageScore = Math.max(0, Math.min(1, signals.image || 0));
  const spatialScore = Math.max(0, Math.min(1, signals.spatialAgreement || 0));
  const temporalScore = Math.max(0, Math.min(1, signals.temporalAgreement || 0));
  const sourceScore = Math.max(0, Math.min(1, signals.sourceEvidence || 0.5)); // Baseline citizen score
  const duplicateRiskScore = Math.max(0, Math.min(1, signals.duplicateRisk || 0));

  // Compute weighted sum
  let rawConfidence =
    weights.text * textScore +
    weights.image * imageScore +
    weights.spatialAgreement * spatialScore +
    weights.temporalAgreement * temporalScore +
    weights.sourceEvidence * sourceScore -
    weights.duplicateRisk * duplicateRiskScore;

  // Clamp within realistic confidence boundaries [0.10, 0.99]
  const finalConfidence = Math.max(0.1, Math.min(0.99, rawConfidence));

  return {
    confidence: parseFloat(finalConfidence.toFixed(2)),
    signals: {
      text: parseFloat(textScore.toFixed(2)),
      image: parseFloat(imageScore.toFixed(2)),
      spatialAgreement: parseFloat(spatialScore.toFixed(2)),
      temporalAgreement: parseFloat(temporalScore.toFixed(2)),
      sourceEvidence: parseFloat(sourceScore.toFixed(2)),
      duplicateRisk: parseFloat(duplicateRiskScore.toFixed(2))
    }
  };
};

module.exports = {
  calculateConfidence,
  DEFAULT_WEIGHTS
};
