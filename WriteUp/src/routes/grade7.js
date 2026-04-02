// ================================================================
// WriteUp — src/routes/grade7.js
// Backend routes for Grade 7 writing feedback
// Three modes: descriptive, problemSolution, opinionAdvantages
// ================================================================

const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");
const { HttpsProxyAgent } = require("hpagent");
const {
  buildGrade7VocabPrimingPrompt,
  buildGrade7SelfDiagnosis,
  buildGrade7DescriptiveFeedback,
  buildGrade7ProblemSolutionFeedback,
  buildGrade7OpinionAdvantagesFeedback,
  buildGrade7HintPrompt,
  buildGrade7ReflectionSummary,
  processGrade7FeedbackResponse
} = require("../lib/grade7Prompts");

const router = express.Router();

const httpsAgent = new HttpsProxyAgent({
  proxy: process.env.HTTPS_PROXY || process.env.HTTP_PROXY
});

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  httpAgent: httpsAgent
});

// ── HELPER ────────────────────────────────────────────────────────
async function callClaude(systemPrompt, userPrompt) {
  const response = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }]
  });
  const raw = response.content[0].text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("Claude response was not valid JSON:", raw);
    throw new Error("Invalid response format from Claude");
  }
}

// ================================================================
// ROUTE 1 — Vocabulary priming
// POST /api/grade7/vocab-priming
// Body: { taskType, unitTopic, mode }
// mode: "descriptive" | "problemSolution" | "opinionAdvantages"
// ================================================================

router.post("/vocab-priming", async (req, res) => {
  try {
    const { taskType, unitTopic, mode = "descriptive" } = req.body;
    if (!taskType || !unitTopic) {
      return res.status(400).json({
        error: "taskType and unitTopic are required"
      });
    }
    const prompt = buildGrade7VocabPrimingPrompt(taskType, unitTopic, mode);
    const result = await callClaude(prompt.system, prompt.user);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("grade7 vocab-priming error:", error);
    return res.status(500).json({ error: "Failed to generate vocabulary priming" });
  }
});

// ================================================================
// ROUTE 2 — Self-diagnosis question
// POST /api/grade7/self-diagnosis
// Body: { mode }
// No API call — local logic only
// ================================================================

router.post("/self-diagnosis", (req, res) => {
  try {
    const { mode } = req.body;
    if (!mode) {
      return res.status(400).json({ error: "mode is required" });
    }
    const validModes = ["descriptive", "problemSolution", "opinionAdvantages"];
    if (!validModes.includes(mode)) {
      return res.status(400).json({
        error: `mode must be one of: ${validModes.join(", ")}`
      });
    }
    const result = buildGrade7SelfDiagnosis(mode);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("grade7 self-diagnosis error:", error);
    return res.status(500).json({ error: "Failed to generate self-diagnosis" });
  }
});

// ================================================================
// ROUTE 3 — Descriptive feedback
// POST /api/grade7/feedback/descriptive
// Body: { taskType, unitTopic, paragraph, selfDiagnosis,
//         apprehensionFlags, sessionLog }
// ================================================================

router.post("/feedback/descriptive", async (req, res) => {
  try {
    const {
      taskType,
      unitTopic,
      paragraph,
      selfDiagnosis,
      apprehensionFlags = [],
      sessionLog = []
    } = req.body;
    if (!taskType || !unitTopic || !paragraph || !selfDiagnosis) {
      return res.status(400).json({
        error: "taskType, unitTopic, paragraph, and selfDiagnosis are required"
      });
    }
    const prompt = buildGrade7DescriptiveFeedback(
      taskType, unitTopic, paragraph,
      selfDiagnosis, apprehensionFlags, sessionLog
    );
    const raw = await callClaude(prompt.system, prompt.user);
    const result = processGrade7FeedbackResponse(
      raw, 7, sessionLog, apprehensionFlags
    );
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("grade7 descriptive feedback error:", error);
    return res.status(500).json({ error: "Failed to generate descriptive feedback" });
  }
});

// ================================================================
// ROUTE 4 — Problem-solution feedback
// POST /api/grade7/feedback/problem-solution
// Body: { paragraph, selfDiagnosis, apprehensionFlags, sessionLog }
// ================================================================

router.post("/feedback/problem-solution", async (req, res) => {
  try {
    const {
      paragraph,
      selfDiagnosis,
      apprehensionFlags = [],
      sessionLog = []
    } = req.body;
    if (!paragraph || !selfDiagnosis) {
      return res.status(400).json({
        error: "paragraph and selfDiagnosis are required"
      });
    }
    const prompt = buildGrade7ProblemSolutionFeedback(
      paragraph, selfDiagnosis, apprehensionFlags, sessionLog
    );
    const raw = await callClaude(prompt.system, prompt.user);
    const result = processGrade7FeedbackResponse(
      raw, 7, sessionLog, apprehensionFlags
    );
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("grade7 problem-solution feedback error:", error);
    return res.status(500).json({ error: "Failed to generate problem-solution feedback" });
  }
});

// ================================================================
// ROUTE 5 — Opinion-advantages feedback
// POST /api/grade7/feedback/opinion-advantages
// Body: { taskType, paragraph, selfDiagnosis,
//         apprehensionFlags, sessionLog }
// ================================================================

router.post("/feedback/opinion-advantages", async (req, res) => {
  try {
    const {
      taskType,
      paragraph,
      selfDiagnosis,
      apprehensionFlags = [],
      sessionLog = []
    } = req.body;
    if (!taskType || !paragraph || !selfDiagnosis) {
      return res.status(400).json({
        error: "taskType, paragraph, and selfDiagnosis are required"
      });
    }
    const prompt = buildGrade7OpinionAdvantagesFeedback(
      taskType, paragraph, selfDiagnosis, apprehensionFlags, sessionLog
    );
    const raw = await callClaude(prompt.system, prompt.user);
    const result = processGrade7FeedbackResponse(
      raw, 7, sessionLog, apprehensionFlags
    );
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("grade7 opinion-advantages feedback error:", error);
    return res.status(500).json({ error: "Failed to generate opinion-advantages feedback" });
  }
});

// ================================================================
// ROUTE 6 — On-demand hint
// POST /api/grade7/hint
// Body: { mode, taskType, currentText, apprehensionFlags }
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
    const prompt = buildGrade7HintPrompt(
      mode, taskType, currentText, apprehensionFlags
    );
    const result = await callClaude(prompt.system, prompt.user);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("grade7 hint error:", error);
    return res.status(500).json({ error: "Failed to generate hint" });
  }
});

// ================================================================
// ROUTE 7 — Post-task reflection
// POST /api/grade7/reflection
// Body: { taskType, mode, attemptsNeeded, perceivedSuccess,
//         enjoyment, apprehensionFlags }
// ================================================================

router.post("/reflection", async (req, res) => {
  try {
    const {
      taskType,
      mode = "descriptive",
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
    const prompt = buildGrade7ReflectionSummary(
      taskType, mode, attemptsNeeded,
      perceivedSuccess, enjoyment, apprehensionFlags
    );
    const result = await callClaude(prompt.system, prompt.user);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("grade7 reflection error:", error);
    return res.status(500).json({ error: "Failed to generate reflection" });
  }
});

module.exports = router;
