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

// ── PROMPT BUILDERS ───────────────────────────────────────────────
// One builder per turn type. Each returns { system, messages }
// where messages is the full conversation history formatted for Claude.

// ── TURN 1: Initial feedback ─────────────────────────────────────
// Called when student submits a paragraph for the first time.
// Grammar/vocab errors → direct track
// Logic/coherence errors → Socratic track

function buildInitialFeedbackPrompt(
  paragraph, grade, mode, taskType, unitTopic,
  apprehensionFlags, gradeBandData, conversationHistory
) {
  const tone = buildApprehensionInstructions(apprehensionFlags);
  const bandKey = getGradeBandKey(grade);

  return {
    system: `You are WriteUp, an ESL writing coach for a Vietnamese Grade ${grade} student
(CEFR ${gradeBandData.cefr}) using the Tiếng Anh Global Success textbook.

TONE INSTRUCTIONS:
${tone}

You are giving INITIAL FEEDBACK on the student's paragraph.
Task type: ${taskType}
Unit topic: ${unitTopic || "general"}
Writing mode: ${mode}
Expected word count: ${gradeBandData.wordCount}

TWO-TRACK FEEDBACK SYSTEM — follow this exactly:

DIRECT TRACK (grammar errors):
For errors of type: subject_verb_agreement, article_omission,
tense_mixing, direct_translation
→ Point to the exact phrase
→ Name the rule briefly
→ Direct to the textbook grammar reference
→ Give one concrete correction
→ Do NOT ask a question — state directly

SOFT SOCRATIC TRACK (vocabulary errors):
For errors of type: vocabulary_repetition
→ Notice the pattern: "I noticed you used [word] X times"
→ Ask: "Is there another word that could describe this?"
→ Do NOT give the answer yet — wait for student response

FULL SOCRATIC TRACK (logic and coherence errors):
For errors of type: weak_connector, disconnected_sentences,
claim_no_explanation, evidence_no_analysis
→ Ask a question that helps the student identify the problem
→ Do NOT state what is wrong — let them discover it
→ The question should point toward the issue without naming it

IMPORTANT: Address a maximum of ${grade <= 7 ? 2 : 3} errors total.
Always start with what_is_strong before any feedback.
End every response with an open invitation:
"What do you think?" or "Does that make sense?" or
"What would you like to do?"

Respond ONLY with valid JSON:
{
  "what_is_strong": "<specific genuine praise>",
  "direct_feedback": [
    {
      "error_type": "<ID>",
      "surface": "<exact phrase>",
      "message": "<direct correction with rule and textbook reference>"
    }
  ],
  "socratic_questions": [
    {
      "error_type": "<ID>",
      "surface": "<exact phrase or pattern>",
      "track": "soft_socratic" | "full_socratic",
      "question": "<the Socratic question to ask the student>"
    }
  ],
  "overall_message": "<1-2 warm sentences connecting all the feedback>",
  "invitation": "<open-ended closing question>"
}`,
    messages: [
      ...formatHistoryForClaude(conversationHistory),
      { role: "user", content: `My paragraph:\n\n"${paragraph}"` }
    ]
  };
}

// ── TURN 2: Student answers a Socratic question ───────────────────
// Student responded to a question the system asked.
// System evaluates whether they identified the problem correctly.

function buildStudentAnswerPrompt(
  studentAnswer, grade, apprehensionFlags,
  gradeBandData, conversationHistory, pendingErrors
) {
  const tone = buildApprehensionInstructions(apprehensionFlags);

  return {
    system: `You are WriteUp, an ESL writing coach for a Vietnamese Grade ${grade} student
(CEFR ${gradeBandData.cefr}).

TONE INSTRUCTIONS:
${tone}

The student has just answered a question you asked about their writing.
Evaluate their answer against the pending issue: ${JSON.stringify(pendingErrors)}

THREE POSSIBLE RESPONSES:

1. CORRECT — student identified the problem themselves:
   → Validate their diagnosis explicitly
   → Guide them toward the fix without giving it directly
   → Ask: "Now that you've identified it, how would you fix it?"

2. PARTIALLY CORRECT — student is on the right track but incomplete:
   → Acknowledge what they noticed
   → Ask one more targeted question to get them closer
   → Do not give away the answer yet

3. INCORRECT — student missed the issue:
   → Do not contradict harshly
   → Give a more direct hint that points to the specific location
   → For soft_socratic (vocabulary): offer 2-3 options from the
     unit vocabulary list for them to choose from
   → For full_socratic (logic/coherence): ask a more specific
     question about the connection between ideas

Always end with an open invitation for the student to respond.

Respond ONLY with valid JSON:
{
  "assessment": "correct" | "partially_correct" | "incorrect",
  "response": "<your response to the student>",
  "next_action": "guide_fix" | "redirect" | "offer_options",
  "options": ["<option 1>", "<option 2>", "<option 3>"],
  "invitation": "<closing question or prompt>"
}`,
    messages: [
      ...formatHistoryForClaude(conversationHistory),
      { role: "user", content: studentAnswer }
    ]
  };
}

// ── TURN 3: Student pushes back ───────────────────────────────────
// Student explicitly disagrees with the feedback.
// Grammar → system holds position, explains rule with justification
// Logic/coherence/vocab → system evaluates the reasoning

function buildPushbackPrompt(
  studentPushback, grade, apprehensionFlags,
  gradeBandData, conversationHistory, disputedError
) {
  const tone = buildApprehensionInstructions(apprehensionFlags);
  const track = getTrack(disputedError?.error_type || "");
  const isNegotiable = track !== "direct";

  return {
    system: `You are WriteUp, an ESL writing coach for a Vietnamese Grade ${grade} student
(CEFR ${gradeBandData.cefr}).

TONE INSTRUCTIONS:
${tone}

The student is pushing back on your feedback about:
${JSON.stringify(disputedError)}

Track: ${track}
Negotiable: ${isNegotiable}

${isNegotiable ? `
NEGOTIABLE FEEDBACK — evaluate the student's reasoning:

If their reasoning IS valid:
→ Genuinely accept it — do not just placate them
→ Explain why their alternative works
→ Ask if they want to keep it or try a revision anyway
→ Note: "This is a valid choice. In formal writing, X is
   often expected, but your approach works because [reason]."

If their reasoning is NOT valid:
→ Acknowledge that they have a perspective worth considering
→ Explain clearly WHY the expectation exists at this level
→ Reference the specific textbook unit or writing convention
→ Give them a genuine choice: revise or keep with awareness
→ Never say "you must change this" — say "the convention is X
   because Y, and you can choose how to respond to that"
` : `
NON-NEGOTIABLE FEEDBACK — grammar rule:
→ Acknowledge their pushback respectfully
→ Explain that this is a grammar rule, not a style choice
→ Reference the specific rule and textbook unit
→ Give one clear example of the correct form
→ Offer to help them revise this specific part
→ Keep the tone warm — being wrong about grammar is not a failure
`}

Always end with a genuine choice for the student.

Respond ONLY with valid JSON:
{
  "accepts_pushback": true | false,
  "response": "<your full response to the student>",
  "reasoning_assessment": "<why you accept or don't accept their reasoning>",
  "student_choice": "<the genuine choice you are giving them>",
  "invitation": "<closing question>"
}`,
    messages: [
      ...formatHistoryForClaude(conversationHistory),
      { role: "user", content: studentPushback }
    ]
  };
}

// ── TURN 4: Student submits a revision ────────────────────────────
// Student has revised their paragraph or sentence.
// System re-evaluates against the same criteria.

function buildRevisionPrompt(
  revisedParagraph, grade, mode, taskType,
  apprehensionFlags, gradeBandData,
  conversationHistory, originalErrors
) {
  const tone = buildApprehensionInstructions(apprehensionFlags);

  return {
    system: `You are WriteUp, an ESL writing coach for a Vietnamese Grade ${grade} student
(CEFR ${gradeBandData.cefr}).

TONE INSTRUCTIONS:
${tone}

The student has submitted a revision. Compare it against the
original issues that were being discussed: ${JSON.stringify(originalErrors)}

EVALUATION PRIORITIES:
1. Did the revision address the specific issue that was discussed?
2. Did the revision introduce any new errors?
3. Is the overall writing stronger than before?

THREE POSSIBLE OUTCOMES:

RESOLVED — the issue is genuinely fixed:
→ Celebrate specifically — name what changed and why it works
→ Check if there are remaining issues from the original list
→ If all issues resolved: confirm the stage is complete
→ If more issues remain: move to the next one

IMPROVED BUT NOT COMPLETE — better but still has the issue:
→ Acknowledge the improvement genuinely
→ Point specifically to what still needs work
→ Ask one more targeted question (stay on Socratic track
  for logic/coherence, give direct guidance for grammar)

NEW ERROR INTRODUCED — revision created a different problem:
→ Acknowledge what was fixed
→ Gently note the new issue using the appropriate track
→ Do not overwhelm — address one thing at a time

Always name what specifically improved — never give generic praise.

Respond ONLY with valid JSON:
{
  "outcome": "resolved" | "improved" | "new_error",
  "what_improved": "<specific description of what got better>",
  "remaining_issue": "<only if outcome is improved or new_error>",
  "new_error_type": "<error type ID only if new error introduced>",
  "new_error_surface": "<exact phrase only if new error>",
  "response": "<your full response>",
  "stage_complete": true | false,
  "invitation": "<closing question if not complete>"
}`,
    messages: [
      ...formatHistoryForClaude(conversationHistory),
      {
        role: "user",
        content: `I've revised my paragraph:\n\n"${revisedParagraph}"`
      }
    ]
  };
}

// ── TURN 5: Student chooses to keep ──────────────────────────────
// Student explicitly decides not to revise a flagged element.
// System acknowledges the choice and moves on.

function buildKeepsPrompt(
  studentMessage, grade, apprehensionFlags,
  gradeBandData, conversationHistory, keptError
) {
  const tone = buildApprehensionInstructions(apprehensionFlags);
  const track = getTrack(keptError?.error_type || "");

  return {
    system: `You are WriteUp, an ESL writing coach for a Vietnamese Grade ${grade} student
(CEFR ${gradeBandData.cefr}).

TONE INSTRUCTIONS:
${tone}

The student has chosen to keep their original writing despite
the feedback on: ${JSON.stringify(keptError)}
Track: ${track}

${track === "direct" ?
`This was a grammar issue (non-negotiable rule).
→ Acknowledge their choice without judgment
→ Briefly note that this will be marked as an unresolved
  grammar point in their session record
→ Move forward constructively
→ Do NOT lecture or repeat the correction` :
`This was a style/logic/coherence/vocabulary choice (negotiable).
→ Genuinely respect the choice
→ Note the convention or expectation briefly for awareness
→ Move forward without any sense of disappointment
→ This is a valid exercise of their agency as a writer`}

Keep the response brief — 2-3 sentences maximum.
Then ask if they are ready to move to the next part of their writing.

Respond ONLY with valid JSON:
{
  "response": "<brief acknowledgement — 2-3 sentences>",
  "recorded_as_kept": true,
  "invitation": "<move forward question>"
}`,
    messages: [
      ...formatHistoryForClaude(conversationHistory),
      { role: "user", content: studentMessage }
    ]
  };
}

async function processConversationTurn({
  claudeClient,
  sessionId,
  studentId,
  studentMessage,
  currentParagraph,
  grade,
  taskType,
  mode,
  unitTopic,
  apprehensionFlags,
  gradeBandData,
  pendingErrors,
  disputedError
}) {
  let session;
  if (sessionId) {
    session = await getSession(sessionId);
  } else {
    session = await createSession({
      studentId,
      grade,
      taskType,
      mode,
      unitTopic,
      paragraph: currentParagraph,
      apprehensionFlags,
      sessionLog: []
    });
  }

  const history = await getConversationHistory(session.id);
  const turnNumber = history.length + 1;

  const turnType = detectTurnType(studentMessage, history);

  await saveTurn(
    session.id, turnNumber, "student", turnType,
    studentMessage, {}
  );

  let promptData;
  switch (turnType) {
    case "initial_feedback":
      promptData = buildInitialFeedbackPrompt(
        currentParagraph, grade, mode, taskType, unitTopic,
        apprehensionFlags, gradeBandData, history
      );
      break;
    case "student_answer":
      promptData = buildStudentAnswerPrompt(
        studentMessage, grade, apprehensionFlags,
        gradeBandData, history, pendingErrors || []
      );
      break;
    case "student_pushback":
      promptData = buildPushbackPrompt(
        studentMessage, grade, apprehensionFlags,
        gradeBandData, history, disputedError || {}
      );
      break;
    case "student_revision":
      promptData = buildRevisionPrompt(
        currentParagraph, grade, mode, taskType,
        apprehensionFlags, gradeBandData,
        history, pendingErrors || []
      );
      break;
    case "student_keeps":
      promptData = buildKeepsPrompt(
        studentMessage, grade, apprehensionFlags,
        gradeBandData, history, disputedError || {}
      );
      break;
    default:
      promptData = buildStudentAnswerPrompt(
        studentMessage, grade, apprehensionFlags,
        gradeBandData, history, pendingErrors || []
      );
  }

  const claudeResponse = await claudeClient.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 1024,
    system: promptData.system,
    messages: promptData.messages
  });

  const raw = claudeResponse.content[0].text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error("Claude response was not valid JSON:", raw);
    throw new Error("Invalid response format from Claude");
  }

  let systemMessageText = "";
  if (parsed.what_is_strong) systemMessageText += parsed.what_is_strong + "\n\n";
  if (parsed.direct_feedback && parsed.direct_feedback.length > 0) {
    parsed.direct_feedback.forEach(fb => {
      systemMessageText += fb.message + "\n\n";
    });
  }
  if (parsed.socratic_questions && parsed.socratic_questions.length > 0) {
    parsed.socratic_questions.forEach(q => {
      systemMessageText += q.question + "\n\n";
    });
  }
  if (parsed.response)        systemMessageText += parsed.response + "\n\n";
  if (parsed.overall_message) systemMessageText += parsed.overall_message + "\n\n";
  if (parsed.invitation)      systemMessageText += parsed.invitation;
  if (parsed.student_choice)  systemMessageText += "\n\n" + parsed.student_choice;
  systemMessageText = systemMessageText.trim();

  let responseTrack = "direct";
  if (parsed.socratic_questions && parsed.socratic_questions.length > 0) {
    const tracks = parsed.socratic_questions.map(q => q.track);
    if (tracks.includes("full_socratic"))      responseTrack = "full_socratic";
    else if (tracks.includes("soft_socratic")) responseTrack = "soft_socratic";
  }

  let systemTurnType = "initial_feedback";
  if (turnType === "student_answer") {
    systemTurnType = parsed.assessment === "correct"
      ? "system_confirmation" : "system_question";
  } else if (turnType === "student_pushback") {
    systemTurnType = parsed.accepts_pushback
      ? "system_accepts_pushback" : "system_holds_position";
  } else if (turnType === "student_revision") {
    systemTurnType = parsed.stage_complete
      ? "system_confirmation" : "system_question";
  } else if (turnType === "student_keeps") {
    systemTurnType = "system_confirmation";
  }

  const errorsAddressed = [];
  if (parsed.direct_feedback) {
    parsed.direct_feedback.forEach(fb => {
      if (fb.error_type) errorsAddressed.push(fb.error_type);
    });
  }
  if (parsed.socratic_questions) {
    parsed.socratic_questions.forEach(q => {
      if (q.error_type) errorsAddressed.push(q.error_type);
    });
  }
  if (parsed.new_error_type) errorsAddressed.push(parsed.new_error_type);

  await saveTurn(
    session.id, turnNumber + 1, "system", systemTurnType,
    systemMessageText,
    { errorsAddressed, responseTrack }
  );

  const currentLog = session.session_log || [];
  const { updatedLog, sessionPatterns, patternAlerts } =
    processSessionPatterns(currentLog, errorsAddressed, grade);

  const sessionUpdates = { session_log: updatedLog };
  if (currentParagraph) sessionUpdates.current_paragraph = currentParagraph;
  if (parsed.stage_complete) sessionUpdates.status = "complete";
  await updateSession(session.id, sessionUpdates);

  if (errorsAddressed.length > 0 && studentId) {
    await updateLongTermPatterns(studentId, errorsAddressed, grade);
  }

  const enrichedDirectErrors = (parsed.direct_feedback || []).map(fb => {
    const entry = getErrorEntry(fb.error_type, grade);
    if (!entry) return fb;
    return {
      ...fb,
      attribution:        entry.attribution,
      blame_assignment:   entry.blameAssignment,
      agency_options:     entry.agencyOptions,
      textbook_reference: entry.textbookReference
    };
  });

  const enrichedSocraticQuestions = (parsed.socratic_questions || []).map(q => {
    const entry = getErrorEntry(q.error_type, grade);
    if (!entry) return q;
    return {
      ...q,
      attribution:        entry.attribution,
      textbook_reference: entry.textbookReference
    };
  });

  return {
    sessionId:             session.id,
    turnType,
    systemTurnType,
    responseTrack,
    systemMessage:         systemMessageText,
    whatIsStrong:          parsed.what_is_strong || null,
    directFeedback:        enrichedDirectErrors,
    socraticQuestions:     enrichedSocraticQuestions,
    overallMessage:        parsed.overall_message || null,
    invitation:            parsed.invitation || null,
    assessment:            parsed.assessment || null,
    acceptsPushback:       parsed.accepts_pushback || null,
    outcome:               parsed.outcome || null,
    stageComplete:         parsed.stage_complete || false,
    whatImproved:          parsed.what_improved || null,
    sessionPatterns,
    patternAlerts,
    sessionLog:            updatedLog,
    awaitingStudentResponse: !parsed.stage_complete &&
      turnType !== "student_keeps"
  };
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
  buildInitialFeedbackPrompt,
  buildStudentAnswerPrompt,
  buildPushbackPrompt,
  buildRevisionPrompt,
  buildKeepsPrompt,
  processConversationTurn,
  TRACK_MAP
};
