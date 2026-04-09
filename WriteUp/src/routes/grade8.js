// ================================================================
// WriteUp — src/routes/grade8.js
// Backend routes for Grade 8 writing feedback
// Four modes: descriptive, advantagesDisadvantages,
//             agreeDisagree, noticeWriting
// ================================================================

const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");
const { HttpsProxyAgent } = require("hpagent");
const {
  buildGrade8VocabPrimingPrompt,
  buildGrade8SelfDiagnosis,
  buildGrade8DescriptiveFeedback,
  buildGrade8AdvDisadvFeedback,
  buildGrade8AgreeDisagreeFeedback,
  buildGrade8NoticeFeedback,
  buildGrade8HintPrompt,
  buildGrade8ReflectionSummary,
  processGrade8FeedbackResponse
} = require("../lib/grade8Prompts");

const router = express.Router();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  ...(process.env.HTTPS_PROXY ? {
    httpAgent: new HttpsProxyAgent({
      proxy: process.env.HTTPS_PROXY
    })
  } : {})
})

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
// POST /api/grade8/vocab-priming
// Body: { taskType, unitTopic, mode }
// ================================================================

router.post("/vocab-priming", async (req, res) => {
  try {
    const { taskType, unitTopic, mode = "descriptive" } = req.body;
    if (!taskType || !unitTopic) {
      return res.status(400).json({
        error: "taskType and unitTopic are required"
      });
    }
    const prompt = buildGrade8VocabPrimingPrompt(taskType, unitTopic, mode);
    const result = await callClaude(prompt.system, prompt.user);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("grade8 vocab-priming error:", error);
    return res.status(500).json({ error: "Failed to generate vocabulary priming" });
  }
});

// ================================================================
// ROUTE 2 — Self-diagnosis question
// POST /api/grade8/self-diagnosis
// Body: { mode }
// No API call — local logic only
// ================================================================

router.post("/self-diagnosis", (req, res) => {
  try {
    const { mode } = req.body;
    const validModes = ["descriptive", "advantagesDisadvantages", "agreeDisagree", "noticeWriting"];
    if (!mode || !validModes.includes(mode)) {
      return res.status(400).json({
        error: `mode must be one of: ${validModes.join(", ")}`
      });
    }
    const result = buildGrade8SelfDiagnosis(mode);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("grade8 self-diagnosis error:", error);
    return res.status(500).json({ error: "Failed to generate self-diagnosis" });
  }
});

// ================================================================
// ROUTE 3 — Descriptive feedback
// POST /api/grade8/feedback/descriptive
// Body: { taskType, unitTopic, paragraph, selfDiagnosis,
//         apprehensionFlags, sessionLog }
// ================================================================

router.post("/feedback/descriptive", async (req, res) => {
  try {
    const {
      taskType, unitTopic, paragraph, selfDiagnosis,
      apprehensionFlags = [], sessionLog = []
    } = req.body;
    if (!taskType || !unitTopic || !paragraph || !selfDiagnosis) {
      return res.status(400).json({
        error: "taskType, unitTopic, paragraph, and selfDiagnosis are required"
      });
    }
    const prompt = buildGrade8DescriptiveFeedback(
      taskType, unitTopic, paragraph,
      selfDiagnosis, apprehensionFlags, sessionLog
    );
    const raw = await callClaude(prompt.system, prompt.user);
    const result = processGrade8FeedbackResponse(raw, 8, sessionLog, apprehensionFlags);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("grade8 descriptive error:", error);
    return res.status(500).json({ error: "Failed to generate descriptive feedback" });
  }
});

// ================================================================
// ROUTE 4 — Advantages/disadvantages feedback
// POST /api/grade8/feedback/advantages-disadvantages
// Body: { taskType, side, paragraph, selfDiagnosis,
//         apprehensionFlags, sessionLog }
// side: "advantages" | "disadvantages"
// ================================================================

router.post("/feedback/advantages-disadvantages", async (req, res) => {
  try {
    const {
      taskType, side, paragraph, selfDiagnosis,
      apprehensionFlags = [], sessionLog = []
    } = req.body;
    if (!taskType || !side || !paragraph || !selfDiagnosis) {
      return res.status(400).json({
        error: "taskType, side, paragraph, and selfDiagnosis are required"
      });
    }
    if (!["advantages", "disadvantages", "likes", "dislikes"].includes(side)) {
      return res.status(400).json({
        error: "side must be: advantages, disadvantages, likes, or dislikes"
      });
    }
    const prompt = buildGrade8AdvDisadvFeedback(
      taskType, side, paragraph,
      selfDiagnosis, apprehensionFlags, sessionLog
    );
    const raw = await callClaude(prompt.system, prompt.user);
    const result = processGrade8FeedbackResponse(raw, 8, sessionLog, apprehensionFlags);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("grade8 adv-disadv error:", error);
    return res.status(500).json({ error: "Failed to generate advantages/disadvantages feedback" });
  }
});

// ================================================================
// ROUTE 5 — Agree/disagree feedback (3-stage cycle)
// POST /api/grade8/feedback/agree-disagree
// Body: { taskType, paragraph, selfDiagnosis,
//         apprehensionFlags, sessionLog }
// ================================================================

router.post("/feedback/agree-disagree", async (req, res) => {
  try {
    const {
      taskType, paragraph, selfDiagnosis,
      apprehensionFlags = [], sessionLog = []
    } = req.body;
    if (!taskType || !paragraph || !selfDiagnosis) {
      return res.status(400).json({
        error: "taskType, paragraph, and selfDiagnosis are required"
      });
    }
    const prompt = buildGrade8AgreeDisagreeFeedback(
      taskType, paragraph,
      selfDiagnosis, apprehensionFlags, sessionLog
    );
    const raw = await callClaude(prompt.system, prompt.user);
    const result = processGrade8FeedbackResponse(raw, 8, sessionLog, apprehensionFlags);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("grade8 agree-disagree error:", error);
    return res.status(500).json({ error: "Failed to generate agree/disagree feedback" });
  }
});

// ================================================================
// ROUTE 6 — Notice writing feedback
// POST /api/grade8/feedback/notice
// Body: { paragraph, selfDiagnosis, apprehensionFlags, sessionLog }
// ================================================================

router.post("/feedback/notice", async (req, res) => {
  try {
    const {
      paragraph, selfDiagnosis,
      apprehensionFlags = [], sessionLog = []
    } = req.body;
    if (!paragraph || !selfDiagnosis) {
      return res.status(400).json({
        error: "paragraph and selfDiagnosis are required"
      });
    }
    const prompt = buildGrade8NoticeFeedback(
      paragraph, selfDiagnosis, apprehensionFlags, sessionLog
    );
    const raw = await callClaude(prompt.system, prompt.user);
    const result = processGrade8FeedbackResponse(raw, 8, sessionLog, apprehensionFlags);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("grade8 notice error:", error);
    return res.status(500).json({ error: "Failed to generate notice feedback" });
  }
});

// ================================================================
// ROUTE 7 — On-demand hint
// POST /api/grade8/hint
// Body: { mode, taskType, currentText, apprehensionFlags }
// ================================================================

router.post("/hint", async (req, res) => {
  try {
    const {
      mode, taskType, currentText, apprehensionFlags = []
    } = req.body;
    if (!mode || !taskType || !currentText) {
      return res.status(400).json({
        error: "mode, taskType, and currentText are required"
      });
    }
    const prompt = buildGrade8HintPrompt(mode, taskType, currentText, apprehensionFlags);
    const result = await callClaude(prompt.system, prompt.user);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("grade8 hint error:", error);
    return res.status(500).json({ error: "Failed to generate hint" });
  }
});

// ================================================================
// ROUTE 8 — Post-task reflection
// POST /api/grade8/reflection
// Body: { taskType, mode, attemptsNeeded, perceivedSuccess,
//         enjoyment, apprehensionFlags }
// ================================================================

router.post("/reflection", async (req, res) => {
  try {
    const {
      taskType, mode = "descriptive", attemptsNeeded,
      perceivedSuccess, enjoyment, apprehensionFlags = []
    } = req.body;
    if (!taskType || !attemptsNeeded || !perceivedSuccess || !enjoyment) {
      return res.status(400).json({
        error: "taskType, attemptsNeeded, perceivedSuccess, and enjoyment are required"
      });
    }
    const prompt = buildGrade8ReflectionSummary(
      taskType, mode, attemptsNeeded,
      perceivedSuccess, enjoyment, apprehensionFlags
    );
    const result = await callClaude(prompt.system, prompt.user);
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("grade8 reflection error:", error);
    return res.status(500).json({ error: "Failed to generate reflection" });
  }
});

module.exports = router;
