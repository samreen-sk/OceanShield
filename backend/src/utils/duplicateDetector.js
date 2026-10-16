const Report = require("../models/reportModel");
const { calculateDistanceMeters } = require("./geoUtils");

/**
 * Compute Jaccard word token similarity between two text strings
 * @param {string} str1 First text
 * @param {string} str2 Second text
 * @returns {number} Similarity score [0.0 to 1.0]
 */
const computeTextSimilarity = (str1 = "", str2 = "") => {
  const tokenize = (text) =>
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 2)
    );

  const set1 = tokenize(str1);
  const set2 = tokenize(str2);

  if (set1.size === 0 || set2.size === 0) return 0;

  let intersection = 0;
  set1.forEach((token) => {
    if (set2.has(token)) intersection++;
  });

  const union = set1.size + set2.size - intersection;
  return union === 0 ? 0 : intersection / union;
};

/**
 * Check if a new report is a candidate duplicate of existing recent nearby reports
 * @param {object} newReport The report being processed
 * @param {number} maxDistanceMeters Max radius to inspect (default: 2000m)
 * @param {number} maxTimeHours Max time difference in hours (default: 12h)
 * @returns {Promise<object>} { isDuplicateCandidate, duplicateOf, duplicateRisk, bestMatch }
 */
const detectDuplicateReport = async (newReport, maxDistanceMeters = 2000, maxTimeHours = 12) => {
  const [lon, lat] = newReport.location.coordinates;
  const timeThreshold = new Date(newReport.reportedAt.getTime() - maxTimeHours * 60 * 60 * 1000);

  // Find candidate nearby reports of identical hazard type within time window
  const candidates = await Report.find({
    _id: { $ne: newReport._id },
    hazardType: newReport.hazardType,
    reportedAt: { $gte: timeThreshold },
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lon, lat]
        },
        $maxDistance: maxDistanceMeters
      }
    }
  }).limit(10);

  if (candidates.length === 0) {
    return {
      isDuplicateCandidate: false,
      duplicateOf: null,
      duplicateRisk: 0,
      bestMatch: null
    };
  }

  let highestScore = 0;
  let bestCandidate = null;

  for (const candidate of candidates) {
    // 1. Spatial proximity score (closer = higher score)
    const distance = calculateDistanceMeters(newReport.location.coordinates, candidate.location.coordinates);
    const spatialScore = Math.max(0, 1 - distance / maxDistanceMeters);

    // 2. Temporal proximity score (closer in time = higher score)
    const timeDiffMs = Math.abs(newReport.reportedAt.getTime() - candidate.reportedAt.getTime());
    const maxTimeMs = maxTimeHours * 60 * 60 * 1000;
    const temporalScore = Math.max(0, 1 - timeDiffMs / maxTimeMs);

    // 3. Text description similarity
    const textScore = computeTextSimilarity(newReport.description, candidate.description);

    // Composite duplicate score
    const compositeScore = spatialScore * 0.45 + temporalScore * 0.25 + textScore * 0.30;

    if (compositeScore > highestScore) {
      highestScore = compositeScore;
      bestCandidate = candidate;
    }
  }

  // Threshold for duplicate candidate flag (e.g. 0.65)
  const isDuplicateCandidate = highestScore >= 0.65;

  return {
    isDuplicateCandidate,
    duplicateOf: isDuplicateCandidate && bestCandidate ? bestCandidate._id : null,
    duplicateRisk: parseFloat(highestScore.toFixed(2)),
    bestMatch: bestCandidate ? { id: bestCandidate._id, score: parseFloat(highestScore.toFixed(2)) } : null
  };
};

module.exports = {
  detectDuplicateReport,
  computeTextSimilarity
};
