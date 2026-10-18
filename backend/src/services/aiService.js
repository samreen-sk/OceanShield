const axios = require("axios");
const env = require("../config/env");
const { HAZARD_TYPES } = require("../config/constants");

// Configurable client with timeout to prevent blocking Node event loop
const aiClient = axios.create({
  baseURL: env.AI_SERVICE_URL,
  timeout: 5000, // 5 second timeout
  headers: {
    "Content-Type": "application/json"
  }
});

/**
 * Fallback baseline keyword classifier when Python AI service is unreachable
 */
const fallbackRuleBasedTextClassifier = (text = "") => {
  const lower = text.toLowerCase();
  
  if (lower.includes("oil") || lower.includes("sheen") || lower.includes("black water") || lower.includes("tarball")) {
    return { hazard: HAZARD_TYPES.OIL_SPILL, confidence: 0.75 };
  }
  if (lower.includes("plastic") || lower.includes("bottle") || lower.includes("debris") || lower.includes("trash") || lower.includes("net")) {
    return { hazard: HAZARD_TYPES.PLASTIC_POLLUTION, confidence: 0.78 };
  }
  if (lower.includes("dead") || lower.includes("carcass") || lower.includes("fish kill") || lower.includes("dolphin") || lower.includes("turtle")) {
    return { hazard: HAZARD_TYPES.DEAD_MARINE_LIFE, confidence: 0.82 };
  }
  if (lower.includes("flood") || lower.includes("high water") || lower.includes("surge") || lower.includes("inundat")) {
    return { hazard: HAZARD_TYPES.FLOOD_HIGH_WATER, confidence: 0.80 };
  }
  if (lower.includes("cyclone") || lower.includes("storm") || lower.includes("hurricane") || lower.includes("gale") || lower.includes("wind")) {
    return { hazard: HAZARD_TYPES.CYCLONE_STORM, confidence: 0.85 };
  }
  if (lower.includes("algae") || lower.includes("red tide") || lower.includes("algal") || lower.includes("green scum")) {
    return { hazard: HAZARD_TYPES.HARMFUL_ALGAL_BLOOM, confidence: 0.79 };
  }
  if (lower.includes("ship") || lower.includes("vessel") || lower.includes("boat") || lower.includes("collision") || lower.includes("grounding")) {
    return { hazard: HAZARD_TYPES.SHIP_INCIDENT, confidence: 0.76 };
  }

  return { hazard: HAZARD_TYPES.OTHER, confidence: 0.50 };
};

/**
 * Call Python AI service to classify report text
 * @param {string} text Report description
 * @returns {Promise<object>} Prediction result { hazard, confidence, probabilities, isFallback }
 */
const classifyText = async (text) => {
  try {
    const response = await aiClient.post("/predict/text", { text });
    if (response.data && response.data.success && response.data.prediction) {
      return {
        ...response.data.prediction,
        isFallback: false
      };
    }
    throw new Error("Unexpected payload structure from AI microservice");
  } catch (error) {
    console.warn(`[AI Service Warning] Text classification fallback activated: ${error.message}`);
    const fallback = fallbackRuleBasedTextClassifier(text);
    return {
      hazard: fallback.hazard,
      confidence: fallback.confidence,
      probabilities: { [fallback.hazard]: fallback.confidence },
      isFallback: true
    };
  }
};

/**
 * Call Python AI service to classify report image
 * @param {string} imageUrl URL of uploaded image
 * @returns {Promise<object>} Prediction result { hazard, confidence, probabilities, isFallback }
 */
const classifyImage = async (imageUrl) => {
  try {
    const response = await aiClient.post("/predict/image", { imageUrl });
    if (response.data && response.data.success && response.data.prediction) {
      return {
        ...response.data.prediction,
        isFallback: false
      };
    }
    throw new Error("Unexpected payload structure from AI microservice");
  } catch (error) {
    console.warn(`[AI Service Warning] Image classification fallback activated: ${error.message}`);
    return {
      hazard: HAZARD_TYPES.OTHER,
      confidence: 0.50,
      probabilities: { [HAZARD_TYPES.OTHER]: 0.50 },
      isFallback: true
    };
  }
};

/**
 * Multimodal hazard prediction combining text and image
 * @param {string} text Report text
 * @param {string|null} imageUrl Image URL if available
 * @returns {Promise<object>} Consolidated prediction
 */
const getMultimodalPrediction = async (text, imageUrl = null) => {
  try {
    const response = await aiClient.post("/predict/multimodal", { text, imageUrl });
    if (response.data && response.data.success && response.data.prediction) {
      return response.data.prediction;
    }
  } catch (error) {
    // If multimodal endpoint fails, perform independent calls
  }

  const textPred = await classifyText(text);
  let imagePred = null;

  if (imageUrl) {
    imagePred = await classifyImage(imageUrl);
  }

  // Weight combination (default: 60% text, 40% image if image present)
  let predictedHazard = textPred.hazard;
  let combinedConfidence = textPred.confidence;

  if (imagePred && !imagePred.isFallback) {
    if (imagePred.hazard === textPred.hazard) {
      // Documented fusion formula: 0.6*text + 0.4*image + 0.05, capped at 0.99
      const fused = (textPred.confidence * 0.6) + (imagePred.confidence * 0.4) + 0.05;
      // Corroborating evidence should never reduce confidence compared with text alone
      combinedConfidence = Math.min(0.99, Math.max(textPred.confidence, fused));
    } else {
      // Conflicting text and image: text takes precedence
      predictedHazard = textPred.hazard;
      combinedConfidence = textPred.confidence;
    }
  }

  return {
    hazard: predictedHazard,
    confidence: parseFloat(combinedConfidence.toFixed(4)),
    textPrediction: textPred,
    imagePrediction: imagePred
  };
};

module.exports = {
  classifyText,
  classifyImage,
  getMultimodalPrediction
};
