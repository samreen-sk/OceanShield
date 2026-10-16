const Report = require("../models/reportModel");
const { getMultimodalPrediction } = require("../services/aiService");
const { detectDuplicateReport } = require("../utils/duplicateDetector");
const { calculateConfidence } = require("../utils/confidenceCalculator");
const { clusterReportToIncident } = require("../services/incidentService");
const { REPORT_STATUS, AUDIT_ACTIONS } = require("../config/constants");

/**
 * End-to-end background processing pipeline for a submitted hazard report
 * @param {string} reportId MongoDB ObjectId string
 */
const processReportPipeline = async (reportId) => {
  try {
    const report = await Report.findById(reportId);
    if (!report) {
      console.warn(`[Pipeline] Report ${reportId} not found, skipping.`);
      return;
    }

    console.log(`[Pipeline] Commencing analysis for report ${reportId} (${report.hazardType})`);

    // 1. Multimodal AI Inference
    const firstImage = report.media.find((m) => m.type === "image");
    const imageUrl = firstImage ? firstImage.url : null;

    const aiResult = await getMultimodalPrediction(report.description, imageUrl);

    report.predictedHazard = aiResult.hazard;
    report.aiConfidence = aiResult.confidence;
    report.textPrediction = aiResult.textPrediction || {};
    report.imagePrediction = aiResult.imagePrediction || {};

    // 2. Duplicate Detection
    const duplicateAnalysis = await detectDuplicateReport(report);
    report.duplicateRisk = duplicateAnalysis.duplicateRisk;
    report.isDuplicateCandidate = duplicateAnalysis.isDuplicateCandidate;
    report.duplicateOf = duplicateAnalysis.duplicateOf;

    // 3. Multi-Signal Fusion Confidence
    const fusionResult = calculateConfidence({
      text: aiResult.textPrediction ? aiResult.textPrediction.confidence : 0.6,
      image: aiResult.imagePrediction ? aiResult.imagePrediction.confidence : 0,
      spatialAgreement: 0.70,
      temporalAgreement: 0.70,
      sourceEvidence: 0.50,
      duplicateRisk: duplicateAnalysis.duplicateRisk
    });

    report.confidenceSignals = fusionResult.signals;

    // 4. Determine initial report status
    if (duplicateAnalysis.isDuplicateCandidate && duplicateAnalysis.duplicateRisk > 0.8) {
      report.status = REPORT_STATUS.DUPLICATE;
    } else {
      report.status = REPORT_STATUS.PENDING; // Awaiting authority / triage review
    }

    await report.save();

    // 5. Cluster Report to Incident
    const incident = await clusterReportToIncident(report);

    console.log(
      `[Pipeline Completed] Report ${report._id} processed successfully. Predicted: ${report.predictedHazard} (${(report.aiConfidence * 100).toFixed(0)}%). Clustered to Incident ${incident._id}.`
    );

    if (global.recordAuditLog) {
      global.recordAuditLog({
        actorId: report.userId,
        action: AUDIT_ACTIONS.REPORT_UPDATED,
        entityType: "REPORT",
        entityId: report._id,
        metadata: {
          predictedHazard: report.predictedHazard,
          confidence: report.aiConfidence,
          incidentId: incident._id
        }
      });
    }
  } catch (error) {
    console.error(`[Pipeline Error] Failed processing report ${reportId}:`, error.message);
  }
};

// Register globally so controllers can trigger async execution seamlessly
global.processReportPipeline = processReportPipeline;

module.exports = {
  processReportPipeline
};
