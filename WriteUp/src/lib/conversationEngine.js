// ================================================================
// WriteUp — src/lib/conversationEngine.js
// Dialogue-based feedback engine.
// Implements two-track feedback (direct vs Socratic),
// student pushback handling, and conversation persistence.
//
// Theoretical grounding:
//   Ohlsson (1996) — error correction cycle
//   Daly (1979)    — writing apprehension
//   Gallagher (2016) — hint framework
// ================================================================

const { supabase } = require("./supabase");
const { getErrorEntry, getGradeBandKey } = require("./errorTaxonomy");
const { processSessionPatterns } = require("./patternTracker");
const { buildApprehensionInstructions } = require("./feedbackPrompt");

// ── TRACK ASSIGNMENT ─────────────────────────────────────────────
// Determines which feedback track applies to each error type.
// Grammar → direct (non-negotiable)
// Vocabulary → soft Socratic (negotiable with justification)
// Logic → full Socratic (negotiable)
// Coherence → full Socratic (negotiable)

const TRACK_MAP = {
  subject_verb_agreement: "direct",
  article_omission:       "direct",
  tense_mixing:           "direct",
  direct_translation:     "direct",
  vocabulary_repetition:  "soft_socratic",
  weak_connector:         "full_socratic",
  disconnected_sentences: "full_socratic",
  claim_no_explanation:   "full_socratic",
  evidence_no_analysis:   "full_socratic"
};

function getTrack(errorType) {
  return TRACK_MAP[errorType] || "direct";
}

// ── TURN TYPE DETECTION ──────────────────────────────────────────
// Determines what kind of turn the student's message represents.
// This drives which prompt template gets used.

const PUSHBACK_SIGNALS = [
  "i disagree", "i don't think", "i think it's fine",
  "i want to keep", "that's not wrong", "actually",
  "but i meant", "i think this is correct", "why is this wrong",
  "i don't agree", "i think my", "i prefer"
];

const KEEPS_SIGNALS = [
  "i'll keep it", "keep it", "i want to keep this",
  "i'm keeping", "leave it", "that's my choice",
  "i choose to keep", "no change", "i like it as is"
];

function detectTurnType(studentMessage, conversationHistory) {
  const msg = studentMessage.toLowerCase().trim();

  // First turn — no history yet
  if (!conversationHistory || conversationHistory.length === 0) {
    return "initial_feedback";
  }

  // Student explicitly keeping their version
  if (KEEPS_SIGNALS.some(s => msg.includes(s))) {
    return "student_keeps";
  }

  // Student pushing back
  if (PUSHBACK_SIGNALS.some(s => msg.includes(s))) {
    return "student_pushback";
  }

  // Student submitted a revised paragraph (longer message, contains sentences)
  const wordCount = studentMessage.trim().split(/\s+/).length;
  const lastSystemTurn = [...conversationHistory]
    .reverse()
    .find(t => t.role === "system");

  if (
    wordCount > 20 &&
    lastSystemTurn &&
    (lastSystemTurn.turn_type === "system_question" ||
     lastSystemTurn.turn_type === "initial_feedback" ||
     lastSystemTurn.turn_type === "system_holds_position")
  ) {
    return "student_revision";
  }

  // Default — student answering a question
  return "student_answer";
}

// ── CONVERSATION HISTORY FORMATTER ───────────────────────────────
// Formats stored turns into the message array Claude expects.

function formatHistoryForClaude(turns) {
  return turns.map(turn => ({
    role: turn.role === "system" ? "assistant" : "user",
    content: turn.content
  }));
}

// ── SUPABASE OPERATIONS ───────────────────────────────────────────

async function createSession(sessionData) {
  const { data, error } = await supabase
    .from("writing_sessions")
    .insert([{
      student_id:        sessionData.studentId,
      grade:             sessionData.grade,
      task_type:         sessionData.taskType,
      mode:              sessionData.mode,
      unit_topic:        sessionData.unitTopic || null,
      current_paragraph: sessionData.paragraph || null,
      stage:             sessionData.stage || 1,
      apprehension_flags: sessionData.apprehensionFlags || [],
      session_log:       sessionData.sessionLog || [],
      status:            "active"
    }])
    .select()
    .single();

  if (error) throw new Error(`Failed to create session: ${error.message}`);
  return data;
}

async function getSession(sessionId) {
  const { data, error } = await supabase
    .from("writing_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (error) throw new Error(`Failed to get session: ${error.message}`);
  return data;
}

async function updateSession(sessionId, updates) {
  const { data, error } = await supabase
    .from("writing_sessions")
    .update(updates)
    .eq("id", sessionId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update session: ${error.message}`);
  return data;
}

async function getConversationHistory(sessionId) {
  const { data, error } = await supabase
    .from("conversation_turns")
    .select("*")
    .eq("session_id", sessionId)
    .order("turn_number", { ascending: true });

  if (error) throw new Error(`Failed to get history: ${error.message}`);
  return data || [];
}

async function saveTurn(sessionId, turnNumber, role, turnType, content, extras = {}) {
  const { data, error } = await supabase
    .from("conversation_turns")
    .insert([{
      session_id:       sessionId,
      turn_number:      turnNumber,
      role,
      turn_type:        turnType,
      content,
      errors_addressed: extras.errorsAddressed || [],
      response_track:   extras.responseTrack || null
    }])
    .select()
    .single();

  if (error) throw new Error(`Failed to save turn: ${error.message}`);
  return data;
}

async function updateLongTermPatterns(studentId, sessionLog, grade) {
  for (const errorType of sessionLog) {
    const { error } = await supabase
      .from("student_error_patterns")
      .upsert({
        student_id:    studentId,
        error_type:    errorType,
        grade,
        last_seen:     new Date().toISOString(),
        total_count:   1,
        session_count: 1
      }, {
        onConflict: "student_id,error_type",
        ignoreDuplicates: false
      });

    if (error) {
      console.error(`Pattern update error for ${errorType}:`, error.message);
    }
  }
}

module.exports = {
  getTrack,
  detectTurnType,
  formatHistoryForClaude,
  createSession,
  getSession,
  updateSession,
  getConversationHistory,
  saveTurn,
  updateLongTermPatterns,
  TRACK_MAP
};
