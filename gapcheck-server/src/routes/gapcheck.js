"use strict";

const express = require("express");
const router = express.Router();
const { getProperties, analyzeGaps } = require("../lib/gapAnalyzer");
const { generateQuestions } = require("../lib/questionGenerator");
const { processAnswer } = require("../lib/answerProcessor");

// GET /api/gapcheck/properties
// Returns the dropdown list of 13 properties
router.get("/properties", (_req, res, next) => {
  try {
    res.json({ properties: getProperties() });
  } catch (err) {
    next(err);
  }
});

// POST /api/gapcheck/analyze
// Body: { propertyId: string, reviewText: string }
// Returns: { gapSummary, questions, reviewCount }
router.post("/analyze", async (req, res, next) => {
  try {
    const { propertyId, reviewText } = req.body;
    if (!propertyId || !reviewText?.trim()) {
      return res.status(400).json({ error: "propertyId and reviewText are required" });
    }

    const analysis = analyzeGaps(propertyId);
    if (!analysis) {
      return res.status(404).json({ error: `Property ${propertyId} not found` });
    }

    const questions = await generateQuestions(
      analysis.property,
      analysis.gaps,
      reviewText
    );

    res.json({
      propertyId,
      propertyName: analysis.property.property_name,
      reviewCount: analysis.reviewCount,
      gapSummary: analysis.gaps,
      questions,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/gapcheck/answer
// Body: { propertyId, originalReview, question, answer }
// Returns: { insights, impactMessage }
router.post("/answer", async (req, res, next) => {
  try {
    const { propertyId, originalReview, question, answer } = req.body;
    if (!propertyId || !originalReview || !question || !answer?.trim()) {
      return res.status(400).json({
        error: "propertyId, originalReview, question, and answer are all required",
      });
    }

    const analysis = analyzeGaps(propertyId);
    if (!analysis) {
      return res.status(404).json({ error: `Property ${propertyId} not found` });
    }

    const result = await processAnswer(
      analysis.property,
      originalReview,
      question,
      answer
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
