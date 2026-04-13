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

// ── MOCK MODE ─────────────────────────────────────────────────────
// Set MOCK_SUPABASE=true in .env to bypass Supabase calls.
// All conversation logic and Claude API calls still run normally.
// Supabase writes are skipped and mock session IDs are returned.
// Remove this when deploying to production.

const MOCK_SUPABASE = process.env.MOCK_SUPABASE === "true";

const mockSession = (data) => ({
  id: `mock_session_${Date.now()}`,
  session_log: [],
  current_paragraph: data?.paragraph || null,
  apprehension_flags: data?.apprehensionFlags || [],
  status: "active",
  ...data
});

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

  // Explicit revision submission from Get Feedback button
  if (studentMessage.startsWith('I have revised my paragraph. Here is my new version:')) {
    return 'student_revision'
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
  if (MOCK_SUPABASE) return mockSession(sessionData);
  const { data, error } = await supabase
    .from("writing_sessions")
    .insert([{
      student_id:         sessionData.studentId,
      grade:              sessionData.grade,
      task_type:          sessionData.taskType,
      mode:               sessionData.mode,
      unit_topic:         sessionData.unitTopic || null,
      current_paragraph:  sessionData.paragraph || null,
      stage:              sessionData.stage || 1,
      apprehension_flags: sessionData.apprehensionFlags || [],
      session_log:        sessionData.sessionLog || [],
      status:             "active"
    }])
    .select()
    .single();
  if (error) throw new Error(`Failed to create session: ${error.message}`);
  return data;
}

async function getSession(sessionId) {
  if (MOCK_SUPABASE) return mockSession({ id: sessionId });
  const { data, error } = await supabase
    .from("writing_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();
  if (error) throw new Error(`Failed to get session: ${error.message}`);
  return data;
}

async function updateSession(sessionId, updates) {
  if (MOCK_SUPABASE) return { id: sessionId, ...updates };
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
  if (MOCK_SUPABASE) return [];
  const { data, error } = await supabase
    .from("conversation_turns")
    .select("*")
    .eq("session_id", sessionId)
    .order("turn_number", { ascending: true });
  if (error) throw new Error(`Failed to get history: ${error.message}`);
  return data || [];
}

async function saveTurn(sessionId, turnNumber, role, turnType, content, extras = {}) {
  if (MOCK_SUPABASE) {
    return { id: `mock_turn_${turnNumber}`, session_id: sessionId,
             turn_number: turnNumber, role, turn_type: turnType, content };
  }
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
  if (MOCK_SUPABASE) return;
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
    if (error) console.error(`Pattern update error for ${errorType}:`, error.message);
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

FORMAT AND TOPIC CHECK — evaluate before grammar:
1. Check if the student used the correct format for this task type.
   Email tasks require: salutation (Dear/Hi [name]) and closing (Best/Yours/Love).
   Diary entries require: Dear Diary opener.
   Postcards require: greeting and sign-off.
   Paragraphs: no special format required.
2. Check if the student is writing about the assigned topic.
   If they are significantly off-topic, set on_topic: false.
   Minor drift is acceptable — only flag clear topic mismatch.
If format or topic issues exist, they are MORE important than
grammar errors and should be addressed first.

STRICT LIMIT: Report a maximum of 2 errors total per response.
Priority order:
1. Grammar errors first (direct track)
2. Vocabulary errors second (soft Socratic)
3. Logic/coherence errors third (full Socratic)
If there are 3+ grammar errors, pick the 2 most important ones only.
Do NOT report vocabulary or logic errors if there are already 2 grammar errors.
Never exceed 2 total.

ONE TRACK PER TURN RULE:
If there are any grammar errors to address, report ONLY grammar errors in this turn.
Do NOT include vocabulary or logic/coherence Socratic questions in the same response.
Grammar must be resolved before vocabulary is introduced.
Vocabulary must be resolved before logic/coherence is introduced.
Only move to the next track when the current track is clear.

Always start with what_is_strong before any feedback.
End every response with an open invitation:
"What do you think?" or "Does that make sense?" or
"What would you like to do?"

IMPORTANT — overall_message field:
Write 1-2 sentences ONLY. Include the strength observation.
Do NOT repeat the grammar corrections or Socratic questions —
those appear separately in the structured feedback cards.
The overall_message is a warm bridge, not a summary.
Example: "You've shared specific memories that make this feel real.
Let's look at two things that will make it even stronger."

FORMATTING RULE — CRITICAL:
Never use markdown in your responses.
No asterisks for bold (**word**).
No hyphens for bullet points (- item).
No headers (## heading).
Write in plain sentences and paragraphs only.
If you need to list items, use numbers: 1. 2. 3.
If you need emphasis, use plain words like "important" or
write the word in CAPITALS.

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
  "format_check": {
    "correct_format_used": true,
    "format_issue": "<only if false — what format was expected and what the student used instead>"
  },
  "topic_check": {
    "on_topic": true,
    "topic_issue": "<only if false — what the task asked for and what the student wrote about instead>"
  },
  "overall_message": "<1-2 warm sentences — strength + brief transition only>",
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
  gradeBandData, conversationHistory, pendingErrors, currentParagraph
) {
  const tone = buildApprehensionInstructions(apprehensionFlags);

  return {
    system: `You are WriteUp, an ESL writing coach for a Vietnamese Grade ${grade} student
(CEFR ${gradeBandData.cefr}).

CONVERSATION FOCUS RULE:
If the conversation history shows that the student agreed to
rewrite their paragraph (look for messages starting with
"I will rewrite my paragraph"), then:
- The original paragraph is NO LONGER relevant
- Do NOT reference it, quote from it, or compare to it
- Focus ONLY on helping the student build the NEW paragraph
- Continue asking about the new topic until the student has
  enough ideas to write
- Do not mention errors from the old paragraph

TONE INSTRUCTIONS:
${tone}

The student has just answered a question you asked about their writing.
Evaluate their answer against the pending issue: ${JSON.stringify(pendingErrors)}

SPECIAL CASE — if the student message starts with "Can you scan my full paragraph":
1. Find the student's paragraph from the message (it is included as "Student's paragraph: ...")
2. Scan it for ALL errors of the type mentioned
3. Return JSON with:
   assessment: "correct"
   response: "I found [N] places where [error type] needs attention:\n1. '[phrase]' → should be '[correction]'\n2. '[phrase]' → should be '[correction]'\n..."
   next_action: "redirect"
   invitation: A Socratic question about the FIRST error only —
     do not give the correction away. Ask the student to think
     about why that specific phrase needs changing.
     Example: "Let's start with number 1 — '[phrase]'.
     Read it aloud. What do you notice about the verb?"
   options: []

Do NOT just list the errors and stop. The invitation must open
a dialogue on the first error.

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

FORMATTING RULE — CRITICAL:
Never use markdown in your responses.
No asterisks for bold (**word**).
No hyphens for bullet points (- item).
No headers (## heading).
Write in plain sentences and paragraphs only.
If you need to list items, use numbers: 1. 2. 3.
If you need emphasis, use plain words like "important" or
write the word in CAPITALS.

Respond ONLY with valid JSON:
{
  "assessment": "correct" | "partially_correct" | "incorrect",
  "response": "<your response to the student>",
  "next_action": "guide_fix" | "redirect" | "offer_options",
  "options": ["<option 1>", "<option 2>", "<option 3>"],
  "invitation": "<closing question or prompt>"
}

CRITICAL: You MUST respond with valid JSON only.
No markdown, no plain text, no asterisks, no bold formatting.
Your entire response must be parseable by JSON.parse().
Start your response with { and end with }.
If you find yourself writing a plain text response, stop and
reformat it as JSON with these fields:
{
  "assessment": "correct" | "partially_correct" | "incorrect",
  "response": "<your full response as a plain string>",
  "next_action": "guide_fix" | "redirect" | "offer_options",
  "options": [],
  "invitation": "<closing question>"
}`,
    messages: [
      ...formatHistoryForClaude(conversationHistory),
      { role: "user", content: `Student's paragraph: "${currentParagraph || ''}"\n\nStudent's response: ${studentAnswer}` }
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

FORMATTING RULE — CRITICAL:
Never use markdown in your responses.
No asterisks for bold (**word**).
No hyphens for bullet points (- item).
No headers (## heading).
Write in plain sentences and paragraphs only.
If you need to list items, use numbers: 1. 2. 3.
If you need emphasis, use plain words like "important" or
write the word in CAPITALS.

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

REVISION SUBMISSION CASE — if the student message starts with
"I have revised my paragraph. Here is my new version:":

1. Extract the new paragraph from the message
2. Look through conversation history to find what errors were
   previously discussed
3. Evaluate the new paragraph and report:
   a. What improved — name specific changes the student made
   b. What is still an issue — only errors that were already
      discussed AND still present
   c. What is new — any new errors introduced in the revision
4. Be specific about what changed. Do not re-explain errors
   that have been fixed.
5. If all previous errors are resolved: set stage_complete: true
   and congratulate specifically on what they fixed.

Return the standard revision JSON format:
{
  "outcome": "resolved" | "improved" | "new_error",
  "what_improved": "<specific description of what changed>",
  "remaining_issue": "<only if not resolved>",
  "new_error_type": "<only if new error>",
  "new_error_surface": "<only if new error>",
  "response": "<your full response>",
  "stage_complete": true | false,
  "invitation": "<next step — null if complete>"
}

The student has submitted a revision. Compare it against the
original issues that were being discussed: ${JSON.stringify(originalErrors)}

EVALUATION PRIORITIES:
1. Did the revision address the specific issue that was discussed?
2. Did the revision introduce any new errors?
3. Is the overall writing stronger than before?

FORMAT FIX CASE — if the student message is exactly "I will fix the format of my writing.":
Do NOT mention any other errors.
Do NOT mention grammar, vocabulary, or topic.
Respond ONLY with guidance on fixing the format.
Return:
  outcome: "resolved"
  what_improved: ""
  response: "Good. Fix the format first."
  stage_complete: false
  invitation: One specific question about the format only.
    For email format: "What greeting will you use to start
    your email? For example: 'Dear Anna,' or 'Hi Tom,'"
    For diary format: "How will you start your diary entry?"
    Keep it to one sentence.

REWRITE CASE — if the student message starts with "I will rewrite my paragraph. The correct topic is:":
Extract the correct topic from the message.
Return:
  outcome: "resolved"
  what_improved: ""
  response: "Good. Now go back to the writing box above, write your new paragraph about [extracted topic], and click Get Feedback when you are ready."
  stage_complete: false
  invitation: null

Do NOT ask any questions.
Do NOT start building the paragraph through the chat.
The student must write in the writing box, not in the chat.

SPECIAL CASE — if the last student message starts with
"Can you scan my full paragraph":

1. Find the paragraph from the student message
   (it is in "Student's paragraph: ...")
2. Find all errors of the type mentioned
3. List them as:
   "I found [N] places to look at:
   1. '[phrase]'
   2. '[phrase]'
   3. '[phrase]'"
   DO NOT give the corrections — list the phrases only
4. Pick the first error the student has NOT yet fixed
   (check conversation history for fixed items)
5. Ask ONE Socratic question about that first unfixed error
   Do not give the answer. Ask the student to think about
   what is wrong and why.

Return:
  outcome: "improved"
  what_improved: "You asked for a full scan — here is what I found."
  response: the numbered list WITHOUT corrections +
    the Socratic question on error 1
  stage_complete: false
  invitation: "When you know the answer, reply here — or go back
    to your paragraph, fix it, and click Get Feedback."

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

FORMATTING RULE — CRITICAL:
Never use markdown in your responses.
No asterisks for bold (**word**).
No hyphens for bullet points (- item).
No headers (## heading).
Write in plain sentences and paragraphs only.
If you need to list items, use numbers: 1. 2. 3.
If you need emphasis, use plain words like "important" or
write the word in CAPITALS.

STRICT ERROR LIMIT: Maximum 2 errors in direct_feedback.
Maximum 1 item in socratic_questions.
Never exceed these limits regardless of how many errors exist.
Pick the most important ones only.

If errors remain after revision:
- Put grammar errors in direct_feedback with the same format as initial feedback
- Put logic/coherence/vocabulary issues in socratic_questions
- These will be displayed as interactive cards to the student
If all errors are resolved:
- Leave both arrays empty
- Set stage_complete: true

Respond ONLY with valid JSON:
{
  "outcome": "resolved" | "improved" | "new_error",
  "what_improved": "<specific description of what got better>",
  "remaining_issue": "<only if outcome is improved or new_error>",
  "new_error_type": "<error type ID only if new error introduced>",
  "new_error_surface": "<exact phrase only if new error>",
  "direct_feedback": [],
  "socratic_questions": [
    {
      "error_type": "<error type ID if applicable>",
      "surface": "<phrase that still needs work>",
      "track": "full_socratic",
      "question": "<Socratic question about the remaining issue>"
    }
  ],
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

FORMATTING RULE — CRITICAL:
Never use markdown in your responses.
No asterisks for bold (**word**).
No hyphens for bullet points (- item).
No headers (## heading).
Write in plain sentences and paragraphs only.
If you need to list items, use numbers: 1. 2. 3.
If you need emphasis, use plain words like "important" or
write the word in CAPITALS.

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
      if (studentMessage.startsWith("Can you scan my full paragraph")) {
        promptData = buildRevisionPrompt(
          currentParagraph, grade, mode, taskType,
          apprehensionFlags, gradeBandData,
          history, []
        )
      } else {
        promptData = buildStudentAnswerPrompt(
          studentMessage, grade, apprehensionFlags,
          gradeBandData, history, pendingErrors || [],
          currentParagraph
        )
      }
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
    console.log('PARSED RESPONSE:', JSON.stringify(parsed, null, 2));
  } catch (e) {
    console.error("Claude response was not valid JSON:", raw);
    throw new Error("Invalid response format from Claude");
  }

  let systemMessageText = ""

  if (parsed.topic_check && !parsed.topic_check.on_topic) {
    systemMessageText += "The topic needs attention — see the card below."
  } else if (parsed.format_check && !parsed.format_check.correct_format_used) {
    systemMessageText += "The format needs attention — see the card below."
  } else {
    // Normal flow
    if (parsed.what_is_strong) {
      systemMessageText += parsed.what_is_strong + "\n\n"
    }
    if (parsed.direct_feedback && parsed.direct_feedback.length > 0) {
      parsed.direct_feedback.forEach(fb => {
        if (fb.message) systemMessageText += fb.message + "\n\n"
      })
    }
    if (parsed.socratic_questions && parsed.socratic_questions.length > 0) {
      parsed.socratic_questions.forEach(q => {
        if (q.question) systemMessageText += q.question + "\n\n"
      })
    }
    if (parsed.overall_message) systemMessageText += parsed.overall_message + "\n\n"
    if (parsed.response)        systemMessageText += parsed.response + "\n\n"
    if (parsed.what_improved)   systemMessageText += parsed.what_improved + "\n\n"
    if (parsed.invitation)      systemMessageText += parsed.invitation + "\n\n"
    if (parsed.student_choice)  systemMessageText += parsed.student_choice + "\n\n"
  }

  // Add call-to-action after every non-complete response
  if (!parsed.stage_complete) {
    systemMessageText += "\n\n→ Revise your paragraph above and click Get Feedback, or reply here in the chat."
  }

  systemMessageText = systemMessageText.trim()
  console.log('TRIMMED MESSAGE:', systemMessageText);

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

  console.log('SYSTEM MESSAGE TEXT:', systemMessageText);

  // For revision turns, re-run error detection on remaining issues
  // so directFeedback and socraticQuestions are populated correctly
  let directFeedback = parsed.direct_feedback || []
  let socraticQuestions = parsed.socratic_questions || []

  // If this is a revision response and errors remain, extract from response text
  if (turnType === 'student_revision' && parsed.outcome !== 'resolved') {
    if (parsed.remaining_issue && directFeedback.length === 0 && socraticQuestions.length === 0) {
      // Flag that errors remain so canShare stays false
      socraticQuestions = [{
        error_type: 'claim_no_explanation',
        surface: parsed.remaining_issue,
        track: 'full_socratic',
        question: parsed.invitation || parsed.remaining_issue
      }]
    }
  }

  return {
    sessionId:             session.id,
    turnType,
    systemTurnType,
    responseTrack,
    systemMessage:         systemMessageText,
    whatIsStrong:          parsed.what_is_strong || null,
    directFeedback:        enrichedDirectErrors.length > 0 ? enrichedDirectErrors : directFeedback,
    socraticQuestions:     enrichedSocraticQuestions.length > 0 ? enrichedSocraticQuestions : socraticQuestions,
    overallMessage:        parsed.overall_message || null,
    invitation:            parsed.invitation || null,
    assessment:            parsed.assessment || null,
    acceptsPushback:       parsed.accepts_pushback || null,
    outcome:               parsed.outcome || null,
    stageComplete:         parsed.stage_complete || false,
    whatImproved:          parsed.what_improved || null,
    formatCheck:           parsed.format_check || null,
    topicCheck:            parsed.topic_check || null,
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
