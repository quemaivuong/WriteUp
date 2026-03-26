// ================================================================
// WriteUp — src/routes/grade6.js
// Backend routes for Grade 6 writing feedback
// Connects frontend requests to feedbackPrompt.js functions
// and calls the Anthropic API
// ================================================================
const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");
const {
  buildGrade6VocabPrimingPrompt,
  buildGrade6SelfDiagnosis,
  buildGrade6DescriptiveFeedback,
  buildGrade6OpinionFeedback,
  buildGrade6HintPrompt,
  buildGrade6ReflectionSummary
} = require("../lib/feedbackPrompt");
const router = express.Router();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
// ── HELPER ────────────────────────────────────────────────────────
// Calls Claude and parses the JSON response.
// All our prompts return strict JSON — this handles the parsing
// and gives a clean error if something goes wrong.
async function callClaude(systemPrompt, userPrompt) {
  const response = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }]
  });
  const raw = response.content[0].text.trim();
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("Claude response was not valid JSON:", raw);
    throw new Error("Invalid response format from Claude");
  }
}
// ================================================================
// ROUTE 1 — Vocabulary priming
// Called before the student begins writing.
// Returns vocabulary, sentence frames, connectors, encouragement.
//
// POST /api/grade6/vocab-priming
// Body: { taskType, unitTopic }
// ================================================================
router.post("/vocab-priming", async (req, res) => {
  try {
    const { taskType, unitTopic } = req.body;
    if (!taskType || !unitTopic) {
      return res.status(400).json({
        error: "taskType and unitTopic are required"
      });
    }
    const prompt = buildGrade6VocabPrimingPrompt(taskType, unitTopic);
    const result = await callClaude(prompt.system, prompt.user);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("vocab-priming error:", error);
    return res.status(500).json({ error: "Failed to generate vocabulary priming" });
  }
});
// ================================================================
// ROUTE 2 — Self-diagnosis question
// Called immediately after student submits their paragraph.
// Returns the self-diagnosis question and thinking prompt.
// No API call needed — this is local logic only.
//
// POST /api/grade6/self-diagnosis
// Body: { mode }
// mode: "descriptive" | "emergingOpinion"
// ================================================================
router.post("/self-diagnosis", (req, res) => {
  try {
    const { mode } = req.body;
    if (!mode) {
      return res.status(400).json({ error: "mode is required" });
    }
    if (mode !== "descriptive" && mode !== "emergingOpinion") {
      return res.status(400).json({
        error: "mode must be 'descriptive' or 'emergingOpinion'"
      });
    }
    const result = buildGrade6SelfDiagnosis(mode);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("self-diagnosis error:", error);
    return res.status(500).json({ error: "Failed to generate self-diagnosis question" });
  }
});
// ================================================================
// ROUTE 3 — Descriptive paragraph feedback
// Called after student has answered the self-diagnosis question.
// For Grade 6 Units 1–10 only.
//
// POST /api/grade6/feedback/descriptive
// Body: {
//   taskType,
//   unitTopic,
//   guidingQuestions,   — array of strings
//   paragraph,
//   selfDiagnosis,      — student's answer to self-diagnosis question
//   apprehensionFlags   — array from pre-task self-check (can be empty)
// }
// ================================================================
router.post("/feedback/descriptive", async (req, res) => {
  try {
    const {
      taskType,
      unitTopic,
      guidingQuestions,
      paragraph,
      selfDiagnosis,
      apprehensionFlags = []
    } = req.body;
    if (!taskType || !unitTopic || !paragraph || !selfDiagnosis) {
      return res.status(400).json({
        error: "taskType, unitTopic, paragraph, and selfDiagnosis are required"
      });
    }
    if (!Array.isArray(guidingQuestions)) {
      return res.status(400).json({
        error: "guidingQuestions must be an array"
      });
    }
    const prompt = buildGrade6DescriptiveFeedback(
      taskType,
      unitTopic,
      guidingQuestions,
      paragraph,
      selfDiagnosis,
      apprehensionFlags
    );
    const result = await callClaude(prompt.system, prompt.user);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("descriptive feedback error:", error);
    return res.status(500).json({ error: "Failed to generate descriptive feedback" });
  }
});
// ================================================================
// ROUTE 4 — Emerging opinion feedback
// Called after student has answered the self-diagnosis question.
// For Grade 6 Units 11–12 only.
//
// POST /api/grade6/feedback/opinion
// Body: {
//   taskType,
//   paragraph,
//   selfDiagnosis,
//   apprehensionFlags
// }
// ================================================================
router.post("/feedback/opinion", async (req, res) => {
  try {
    const {
      taskType,
      paragraph,
      selfDiagnosis,
      apprehensionFlags = []
    } = req.body;
    if (!taskType || !paragraph || !selfDiagnosis) {
      return res.status(400).json({
        error: "taskType, paragraph, and selfDiagnosis are required"
      });
    }
    const prompt = buildGrade6OpinionFeedback(
      taskType,
      paragraph,
      selfDiagnosis,
      apprehensionFlags
    );
    const result = await callClaude(prompt.system, prompt.user);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("opinion feedback error:", error);
    return res.status(500).json({ error: "Failed to generate opinion feedback" });
  }
});
// ================================================================
// ROUTE 5 — On-demand hint
// Called when student clicks "I'm stuck" at any point.
// Returns three-layer hint without giving the answer.
//
// POST /api/grade6/hint
// Body: {
//   mode,           — "descriptive" | "emergingOpinion"
//   taskType,
//   currentText,    — what the student has written so far
//   apprehensionFlags
// }
// ================================================================
router.post("/hint", async (req, res) => {
  try {
    const {
      mode,
      taskType,
      currentText,
      apprehensionFlags = []
    } = req.body;
    if (!mode || !taskType || !currentText) {
      return res.status(400).json({
        error: "mode, taskType, and currentText are required"
      });
    }
    const prompt = buildGrade6HintPrompt(
      mode,
      taskType,
      currentText,
      apprehensionFlags
    );
    const result = await callClaude(prompt.system, prompt.user);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("hint error:", error);
    return res.status(500).json({ error: "Failed to generate hint" });
  }
});
// ================================================================
// ROUTE 6 — Post-task reflection summary
// Called after student completes the full writing task.
// Returns personalized closing message tied to their process.
//
// POST /api/grade6/reflection
// Body: {
//   taskType,
//   attemptsNeeded,     — number
//   perceivedSuccess,   — 1-5
//   enjoyment,          — 1-5
//   apprehensionFlags
// }
// ================================================================
router.post("/reflection", async (req, res) => {
  try {
    const {
      taskType,
      attemptsNeeded,
      perceivedSuccess,
      enjoyment,
      apprehensionFlags = []
    } = req.body;
    if (!taskType || !attemptsNeeded || !perceivedSuccess || !enjoyment) {
      return res.status(400).json({
        error: "taskType, attemptsNeeded, perceivedSuccess, and enjoyment are required"
      });
    }
    const prompt = buildGrade6ReflectionSummary(
      taskType,
      attemptsNeeded,
      perceivedSuccess,
      enjoyment,
      apprehensionFlags
    );
    const result = await callClaude(prompt.system, prompt.user);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("reflection error:", error);
    return res.status(500).json({ error: "Failed to generate reflection summary" });
  }
});
module.exports = router;
