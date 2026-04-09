// ================================================================
// WriteUp — src/routes/conversation.js
// Unified conversation route — handles all grades and turn types.
// Replaces the individual feedback routes with a single dialogue
// endpoint that persists conversation history in Supabase.
// ================================================================

const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");
const { HttpsProxyAgent } = require("hpagent");
const { processConversationTurn } = require("../lib/conversationEngine");

// Grade band data imports
const { GRADE_6 } = require("../lib/feedbackPrompt");
const { GRADE_7 } = require("../lib/grade7Data");
const { GRADE_8 } = require("../lib/grade8Data");

const router = express.Router();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  ...(process.env.HTTPS_PROXY ? {
    httpAgent: new HttpsProxyAgent({
      proxy: process.env.HTTPS_PROXY
    })
  } : {})
})

// ── GRADE BAND DATA RESOLVER ─────────────────────────────────────
// Returns the correct grade band data object for a given grade.
// Grades 9-12 fall back to the closest available band until
// those grades are built.

function getGradeBandData(grade) {
  const g = parseInt(grade);
  if (g <= 7)  return { ...GRADE_6, wordCount: g === 7 ? "~70 words" : GRADE_6.wordCount };
  if (g <= 9)  return GRADE_8;
  if (g <= 11) return GRADE_8; // placeholder until Grade 10 is built
  return GRADE_8;              // placeholder until Grade 12 is built
}

// ================================================================
// MAIN CONVERSATION ROUTE
// POST /api/conversation
//
// Body:
//   sessionId         — null for new session, UUID for existing
//   studentId         — identifies the student (string)
//   studentMessage    — what the student just typed or submitted
//   currentParagraph  — full current paragraph text
//   grade             — integer 6-12
//   taskType          — e.g. "opinion paragraph"
//   mode              — e.g. "agreeDisagree"
//   unitTopic         — e.g. "science and technology"
//   apprehensionFlags — array from pre-task self-check
//   pendingErrors     — array of error objects still being discussed
//   disputedError     — single error object if student is pushing back
// ================================================================

router.post("/", async (req, res) => {
  try {
    const {
      sessionId       = null,
      studentId,
      studentMessage,
      currentParagraph,
      grade,
      taskType,
      mode            = "descriptive",
      unitTopic       = null,
      apprehensionFlags = [],
      pendingErrors   = [],
      disputedError   = null
    } = req.body;

    // Validation
    if (!studentId) {
      return res.status(400).json({ error: "studentId is required" });
    }
    if (!studentMessage) {
      return res.status(400).json({ error: "studentMessage is required" });
    }
    if (!grade) {
      return res.status(400).json({ error: "grade is required" });
    }
    if (!taskType) {
      return res.status(400).json({ error: "taskType is required" });
    }
    if (!currentParagraph && !sessionId) {
      return res.status(400).json({
        error: "currentParagraph is required for new sessions"
      });
    }

    const gradeBandData = getGradeBandData(grade);

    const result = await processConversationTurn({
      claudeClient:     client,
      sessionId,
      studentId,
      studentMessage,
      currentParagraph,
      grade:            parseInt(grade),
      taskType,
      mode,
      unitTopic,
      apprehensionFlags,
      gradeBandData,
      pendingErrors,
      disputedError
    });

    return res.json({ success: true, data: result });

  } catch (error) {
    console.error("conversation route error:", error);
    return res.status(500).json({
      error: "Conversation turn failed",
      detail: error.message
    });
  }
});

// ================================================================
// GET CONVERSATION HISTORY
// GET /api/conversation/:sessionId
// Returns full conversation history for a session.
// ================================================================

router.get("/:sessionId", async (req, res) => {
  try {
    const { getConversationHistory, getSession } = require("../lib/conversationEngine");
    const { sessionId } = req.params;

    const [session, history] = await Promise.all([
      getSession(sessionId),
      getConversationHistory(sessionId)
    ]);

    return res.json({ success: true, data: { session, history } });

  } catch (error) {
    console.error("get history error:", error);
    return res.status(500).json({ error: "Failed to get conversation history" });
  }
});

// ================================================================
// GET STUDENT ERROR PATTERNS
// GET /api/conversation/patterns/:studentId
// Returns long-term error patterns for a student.
// ================================================================

router.get("/patterns/:studentId", async (req, res) => {
  try {
    const { supabase } = require("../lib/supabase");
    const { studentId } = req.params;

    const { data, error } = await supabase
      .from("student_error_patterns")
      .select("*")
      .eq("student_id", studentId)
      .order("total_count", { ascending: false });

    if (error) throw new Error(error.message);

    return res.json({ success: true, data });

  } catch (error) {
    console.error("patterns error:", error);
    return res.status(500).json({ error: "Failed to get error patterns" });
  }
});

module.exports = router;
