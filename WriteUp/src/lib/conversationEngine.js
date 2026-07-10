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
const { RUBRIC } = require("./rubric");
const { getCurriculumContext } = require("./curriculumData");
const {
  validateInitialFeedback,
  validateStudentAnswer,
  validateRevision
} = require("./responseValidator");

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
  punctuation_error:      "direct",
  vocabulary_repetition:  "soft_socratic",
  weak_connector:         "full_socratic",
  disconnected_sentences: "full_socratic",
  claim_no_explanation:   "full_socratic",
  evidence_no_analysis:   "full_socratic"
};

function getTrack(errorType) {
  return TRACK_MAP[errorType] || "direct";
}

function getGradeBand(grade) {
  const g = parseInt(grade)
  if (g <= 7) return '6-7'
  if (g <= 9) return '8-9'
  if (g <= 11) return '10-11'
  return '12'
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
  apprehensionFlags, gradeBandData, conversationHistory, feedbackFocus = 'all'
) {
  const tone = buildApprehensionInstructions(apprehensionFlags);
  const bandKey = getGradeBandKey(grade);

  const curriculumContext = getCurriculumContext(parseInt(grade), unitTopic, mode)
  const curriculumBlock = curriculumContext ? `
CURRICULUM CONTEXT FOR THIS TASK:
Unit: ${curriculumContext.title}
Topic: ${curriculumContext.topic}
Task type: ${curriculumContext.taskType}
Target word count: ${curriculumContext.targetWordCount.min}–${curriculumContext.targetWordCount.max} words
Key vocabulary students should know: ${curriculumContext.keyVocabulary.join(', ')}
Grammar already taught: ${curriculumContext.targetGrammar.join(', ')}
Expected structure:
  - Opening: ${curriculumContext.writingStructure.topicSentence}
  - Body: ${curriculumContext.writingStructure.body}
  - Conclusion: ${curriculumContext.writingStructure.conclusion}
Common errors at this level: ${curriculumContext.sampleErrors.join('; ')}

Use this to calibrate your feedback:
- Only flag grammar errors from the "Grammar already taught" list above
- Reference the key vocabulary when suggesting improvements
- Check that the writing follows the expected structure
- Common errors listed above are high priority to flag
` : ''

  return {
    system: `You are WriteUp, a warm ESL writing coach for a Vietnamese Grade ${grade} student (CEFR ${gradeBandData.cefr}).

TONE INSTRUCTIONS:
${tone}

Task: ${taskType}
Topic: ${unitTopic || "general"}
Mode: ${mode}
Expected length: ${gradeBandData.wordCount}

FORMAT AND TOPIC CHECK — evaluate this before grammar:
1. Is the format correct for this task type?
   Email = salutation (Dear/Hi [name]) + closing (Best/Yours/Love)
   Diary = Dear Diary opener
   Postcard = greeting + sign-off
   Paragraph = no special format required
2. Is the student writing about the correct topic?
   Only flag a clear mismatch — minor drift is acceptable.
If format or topic is wrong: set has_structure_issue: true and structure_issue_type to "topic" or "format". Do NOT give grammar feedback in this case.

FORMAT AND TOPIC ISSUE PHRASING:
When writing format_issue or topic_issue, do NOT write a dry rule statement.
Write it as a friendly tutor would say it — warm, curious, not corrective.
Always end with a short guiding question.

Examples of BAD phrasing (too dry):
  "A diary entry should start with Dear Diary."
  "The task asked you to write about Tet but you wrote about your friend."

Examples of GOOD phrasing (conversational):
  "I noticed your entry jumps straight into the story — diary entries usually begin with a greeting to the diary itself. How do you think you could open this differently?"
  "You've written some lovely details here, but I'm not sure this matches the task. The task asked about Tet celebrations — what would you change to make sure your writing is about that?"

Keep it warm. Keep it curious. End with a question.

FEEDBACK FOCUS: ${feedbackFocus}

If focus is "analyze":
  Scan the paragraph for ALL issues.
  Count them by type:
    - Grammar: subject_verb_agreement, article_omission,
      tense_mixing, direct_translation, punctuation_error
    - Vocabulary: vocabulary_repetition
    - Logic/Ideas: claim_no_explanation, disconnected_sentences,
      weak_connector, evidence_no_analysis
  Also check format and topic.

  Set conversational_response to a SHORT warm summary ONLY.
  Do NOT mention any specific error in conversational_response.
  Do NOT ask any question in conversational_response.
  Just state what was found and say the student will choose next.

  Example of GOOD conversational_response for analyze:
  "I read your paragraph carefully. I found some grammar
   points to look at and one suggestion about your ideas.
   What would you like to work on first?"

  Example of BAD conversational_response for analyze:
  "I noticed something in your second sentence — when you
   wrote 'I cook homeless people'..."
   (TOO SPECIFIC — save this for after the student chooses)

  Still populate direct_feedback and socratic_questions
  with all detected errors — these are used for the
  focus selector counts but NOT shown as cards yet.
  Keep each message in direct_feedback to ONE short sentence.
  Keep each question in socratic_questions to ONE short sentence.

  If there are NO errors, set conversational_response to:
  "I read your paragraph. It looks good — I don't see any
   major issues. Would you like to share it with a classmate?"
  Set show_focus_choice: true (false if no errors).

If focus is "I want feedback on: grammar":
  Pick the ONE most important grammar error only.
  Write conversational_response as a warm tutor: mention the specific phrase, explain the rule in plain language. No labels. No lists.
  Put that one error in direct_feedback. Leave socratic_questions empty.
  Set show_focus_choice: false.

If focus is "I want feedback on: vocabulary":
  Pick ONE vocabulary pattern to notice.
  Write conversational_response as a warm tutor noticing the pattern — ask a gentle open question.
  Leave direct_feedback empty. Put that one question in socratic_questions with track "soft_socratic".
  Set show_focus_choice: false.

If focus is "I want feedback on: ideas":
  Pick ONE logic or coherence issue.
  Write conversational_response as a warm tutor asking about meaning or connection.
  Leave direct_feedback empty. Put that one question in socratic_questions with track "full_socratic".
  Set show_focus_choice: false.

If focus is "all" or not set:
  Pick the single most important error (grammar first, then vocabulary, then ideas).
  Write conversational_response naturally about that one error.
  Set show_focus_choice: false.

TEXTBOOK REFERENCE RULE:
When giving direct grammar feedback, include a textbook
reference but phrase it conversationally — not as a label.

GOOD: "You can review this in the Unit 1 grammar section
       on present simple — it explains the pattern clearly."
BAD:  "See Unit 1 — present simple, subject-verb agreement."

The reference should feel like a helpful suggestion,
not a citation. Put it at the end of the feedback message,
after the correction.
Use these confirmed unit references:
  subject_verb_agreement → Unit 1 — present simple
  article_omission → Unit 11 — articles (a, an, the)
  tense_mixing → Unit 8 — past simple
  punctuation_error → Unit 1 — sentence writing
  direct_translation → the unit where the relevant grammar was taught
Never say "Check your textbook" without naming the specific unit.

NO DIRECT ANSWERS RULE — CRITICAL:
When asking a Socratic question, NEVER include the answer in the same message.
Do NOT write: "What word is missing? It should be 'is'."
Do NOT write: "The verb needs -s. So 'help' becomes 'helps'."
Do NOT write: "You need to add 'is' between 'she' and 'amazing'."
Write ONLY the question. Stop before the answer.
If you find yourself about to give the answer, delete it and ask a different question.
The student must discover the answer themselves.

CAPITALISATION ERRORS:
Errors where the student uses lowercase 'i' instead of 'I', fails to capitalise
the start of a sentence, or fails to capitalise proper nouns — these are ALL
grammar errors. Use error_type: "punctuation_error" and put them in direct_feedback.
Do NOT put capitalisation errors in socratic_questions.
Do NOT classify them as logic or coherence issues.

CONVERSATIONAL_RESPONSE RULES:
- Start with ONE short sentence acknowledging something strong.
- Then address ONE error or ask ONE question.
- Use plain language — no labels like "grammar error" or technical jargon.
- No bullet points, no numbered lists, no markdown, no asterisks.
- End with an open question to the student.
- Maximum 4 sentences total.
- Write warmly, as if talking directly to the student.

FORMATTING RULE — CRITICAL:
Never use markdown anywhere in your response.
No asterisks for bold, no hyphens for bullets, no headers.
Plain sentences only.

Respond ONLY with valid JSON:
{
  "what_is_strong": "<1 sentence of specific, genuine praise>",
  "conversational_response": "<your full message to the student — 2-4 plain sentences>",
  "direct_feedback": [
    {
      "error_type": "<error type ID>",
      "surface": "<exact phrase from paragraph>",
      "message": "<brief correction>"
    }
  ],
  "socratic_questions": [
    {
      "error_type": "<error type ID>",
      "surface": "<exact phrase or pattern>",
      "track": "soft_socratic" | "full_socratic",
      "question": "<the question to ask>"
    }
  ],
  "format_check": {
    "correct_format_used": true,
    "format_issue": "<only if false>"
  },
  "topic_check": {
    "on_topic": true,
    "topic_issue": "<only if false>"
  },
  "has_structure_issue": false,
  "structure_issue_type": null,
  "show_focus_choice": false,
  "overall_message": "<1-2 warm sentences>",
  "invitation": "<open-ended closing question>"
}

${curriculumBlock}
${(() => {
  const gradeBandKey = getGradeBand(grade)
  return `RUBRIC FOR THIS GRADE BAND (${gradeBandKey}):
${JSON.stringify(RUBRIC[gradeBandKey], null, 2)}

Use this rubric to calibrate your feedback. Do not penalise students for skills listed in notExpected. Focus feedback on the criteria listed in feedbackFocus.`
})()}`,
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
    system: `You are WriteUp, a friendly ESL writing coach for a Vietnamese Grade ${grade} student (CEFR ${gradeBandData.cefr}).

TONE: ${tone}

You are in the middle of a dialogue about the student's writing.
The student just responded to something you said.

CRITICAL RULE — ONE THING PER RESPONSE:
Your response must contain exactly ONE of these:
  A) A list of errors found (only when first showing a category)
  B) One focused question about one specific error
  C) Confirmation of a correct answer + a bridge to the next error
  D) Redirection if the student answer was wrong

NEVER combine a list with a question in the same response.
NEVER confirm AND ask the next question in the same response.
If confirming: confirm, then ask "Ready for the next one?" and stop.
If asking: ask ONE question and stop.
If listing: list the errors, then ask "Ready to look at the first one?" and stop.

NO DIRECT ANSWERS RULE:
When the student has not yet found the answer, do NOT give it to them.
Ask a different question from a different angle instead.
Only confirm the answer AFTER the student has stated it correctly themselves.
If the student is close but not quite right, say what part they got right
and ask them to try again — still without giving the answer.

TEXTBOOK HINT RULE:
When the student is stuck or has answered incorrectly, include a textbook
reference as a hint — not as a correction.
Phrase it as a gentle pointer, not a rule statement.

Examples of GOOD textbook hints:
  "You might find it helpful to look at Unit 1 in your textbook — there
   is a grammar box on present simple that explains this pattern."
  "Check the Unit 8 grammar section on past simple — it has some good
   examples of this."
  "Your textbook Unit 11 has a section on articles that might help you
   think about this."

Examples of BAD textbook hints (too mechanical):
  "See Unit 1 — present simple, subject-verb agreement."
  "Check Unit 11 — articles (a, an, the)."

The hint should feel like a tutor saying "go look it up" not like a
label on a card.
Only include the textbook hint when:
  1. The student has already tried to answer and got it wrong
  2. The student seems confused or stuck
  3. After 2 turns on the same error without progress
Do NOT include the textbook hint on the first question about an error —
let the student try first.

STUDENT PUSHBACK OR CONFUSION:
If the student says they don't understand, disagrees, or seems confused:
  - Do not repeat the same explanation
  - Try a different angle — simpler words, an analogy, or a comparison
  - Reference the textbook unit if relevant
  - Give the student a genuine choice: try again or move on

Pending issues to work through: ${JSON.stringify(pendingErrors || [])}
Student's paragraph: "${currentParagraph || ''}"

Respond ONLY with valid JSON:
{
  "assessment": "correct" | "partially_correct" | "incorrect" | "confused" | "pushback",
  "response": "<your single focused response — one idea only>",
  "next_action": "list_errors" | "ask_question" | "confirm_and_bridge" | "redirect" | "complete",
  "invitation": "<one short closing question — Ready for the next one? OR What do you think? OR null>",
  "options": []
}

CRITICAL — JSON ONLY:
Your entire response must be valid JSON parseable by JSON.parse().
Start with { and end with }.
Never write plain text. Never write markdown.
If you find yourself writing plain text, reformat as:
{
  "assessment": "correct",
  "response": "<your response here>",
  "next_action": "guide_fix",
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

ONE THING PER RESPONSE RULE:
If confirming an improvement: confirm specifically, then ask
"Ready to look at the next issue?" and stop.
Do NOT list remaining errors AND ask a question in the same response.
Do NOT give a correction AND ask about another error.
One idea. One question. Then stop.

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

AFTER EVALUATING THE REVISION:
If the revision resolved the format or topic issue, always end your response
with a summary of remaining issues and ask the student what they want to work on next.

Format the summary like this:
"Good — the [format/topic] looks right now. I can also see
[N grammar issue(s)][, N vocabulary pattern(s)][, and N idea suggestion(s)].
What would you like to work on first?"

Then set the JSON fields so the frontend shows the focus selector:
- Set stage_complete: false
- Populate direct_feedback and socratic_questions with detected errors
- Set overall_message to the summary text above

The student has submitted a revision. Compare it against the
original issues that were being discussed: ${JSON.stringify(originalErrors)}

PROGRESS VALIDATION RULE — REQUIRED:
When the student submits a revised paragraph, you MUST:

1. Compare the new paragraph to what was discussed in the
   conversation history
2. Explicitly name what the student fixed — be specific
3. Then transition to what remains

Format the response like this:
  First: "You fixed [specific thing(s)] — [brief praise]."
  Then: "Now let's look at [next issue]."

Examples of GOOD progress validation:
  "You fixed the verb agreement in 'my family celebrates' —
   that is exactly right. Now let's look at one more thing."

  "I can see you added a closing to your email and fixed
   the capital letters. Both of those are now correct.
   There is one more thing to work on — [next issue]."

  "You replaced three of the 'very' phrases with stronger
   words — 'stunning' and 'tasty' are great choices.
   One grammar point still needs attention."

Examples of BAD progress validation:
  "Good effort!" (too vague — doesn't name what was fixed)
  "I can see you made some changes." (doesn't validate)
  "Let's look at the next issue." (skips validation entirely)

If the student fixed EVERYTHING:
  Name every specific thing they fixed, then say:
  "Your paragraph is ready. Well done."
  Set stage_complete: true.

If the student fixed NOTHING or made it worse:
  Be honest but kind:
  "I notice the paragraph looks the same as before.
   Would you like to try again, or would you like a hint?"
  Set stage_complete: false.

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

STRICT LIMIT: Return a maximum of 2 items in direct_feedback and a maximum of 1 item in socratic_questions.
Never exceed these limits. Pick the most important errors only.
If there are more errors, note in overall_message that there are more to address after these are fixed.

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
  "what_improved": "<specific list of exactly what changed — name the phrase and the fix. BAD: 'You made some improvements.' GOOD: 'You fixed the verb in she amazing → she is amazing and added a closing to your email.'>",
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
}

${(() => {
  const gradeBandKey = getGradeBand(grade)
  return `RUBRIC FOR THIS GRADE BAND (${gradeBandKey}):
${JSON.stringify(RUBRIC[gradeBandKey], null, 2)}

Use this rubric to calibrate your feedback. Do not penalise students for skills listed in notExpected. Focus feedback on the criteria listed in feedbackFocus.`
})()}

CRITICAL — JSON ONLY:
Your entire response must be valid JSON parseable by JSON.parse().
Start with { and end with }.
Never write plain text. Never write markdown.
Never write a response outside of the JSON structure.
If you are tempted to write a plain text response, stop and format it as JSON with these fields:
{
  "outcome": "improved",
  "what_improved": "",
  "remaining_issue": "<your observation here>",
  "response": "<your full response as a plain string>",
  "direct_feedback": [],
  "socratic_questions": [],
  "stage_complete": false,
  "invitation": "<your closing question>"
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

// ── MAJORITY VOTE ON ERROR CLASSIFICATION ────────────────────────
// Runs the analysis pass twice and keeps only errors both passes
// agree on. Disagreements are dropped. This approximates
// determinism without fine-tuning: a shaky classification that only
// shows up in one pass never reaches the student.
//
// `messages` is the full Claude message array (formatted history +
// the student's paragraph), so it works with this engine's unified
// prompt-builder output.

function stripJsonFences(text) {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

async function analyzeWithMajorityVote(client, systemPrompt, messages, maxTokens = 1000) {
  // Run two analysis passes
  const [response1, response2] = await Promise.all([
    client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages
    }),
    client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages
    })
  ])

  const text1 = stripJsonFences(response1.content[0].text)
  const text2 = stripJsonFences(response2.content[0].text)

  let parsed1, parsed2
  try { parsed1 = JSON.parse(text1) } catch { parsed1 = null }
  try { parsed2 = JSON.parse(text2) } catch { parsed2 = null }

  if (!parsed1 && !parsed2) throw new Error('Both analysis passes failed to return valid JSON')
  if (!parsed1) return parsed2
  if (!parsed2) return parsed1

  // Merge — only keep errors that appear in BOTH passes
  const errors1 = (parsed1.direct_feedback || []).map(e => e.error_type + '::' + e.surface)
  const errors2 = (parsed2.direct_feedback || []).map(e => e.error_type + '::' + e.surface)
  const agreedErrors = errors1.filter(e => errors2.includes(e))

  const questions1 = (parsed1.socratic_questions || []).map(q => q.error_type + '::' + q.surface)
  const questions2 = (parsed2.socratic_questions || []).map(q => q.error_type + '::' + q.surface)
  const agreedQuestions = questions1.filter(q => questions2.includes(q))

  // Use pass 1 as base, filter to agreed errors only
  return {
    ...parsed1,
    direct_feedback: (parsed1.direct_feedback || []).filter(e =>
      agreedErrors.includes(e.error_type + '::' + e.surface)
    ),
    socratic_questions: (parsed1.socratic_questions || []).filter(q =>
      agreedQuestions.includes(q.error_type + '::' + q.surface)
    )
  }
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
  disputedError,
  feedbackFocus = 'all'
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
        apprehensionFlags, gradeBandData, history, feedbackFocus
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

  // The initial "analyze" pass is where error classification matters
  // most, so run it twice and keep only errors both passes agree on.
  // Every other turn type stays a single call.
  const useMajorityVote = turnType === "initial_feedback" && feedbackFocus === "analyze";

  let parsed;
  if (useMajorityVote) {
    try {
      parsed = await analyzeWithMajorityVote(
        claudeClient, promptData.system, promptData.messages, 1024
      );
      console.log('PARSED RESPONSE (majority vote):', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.error("Majority-vote analysis failed:", e.message);
      throw new Error("Invalid response format from Claude");
    }
  } else {
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

    try {
      parsed = JSON.parse(raw);
      console.log('PARSED RESPONSE:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.error("Claude response was not valid JSON:", raw);
      throw new Error("Invalid response format from Claude");
    }
  }

  // Schema validation — sanitize Claude output against the expected
  // shape before any of it reaches the frontend. Invalid error types,
  // bad tracks, and non-boolean flags are corrected or dropped.
  if (turnType === "initial_feedback") {
    const { sanitized, errors: validationErrors } = validateInitialFeedback(parsed);
    if (validationErrors.length > 0) console.log('Validation issues:', validationErrors);
    if (sanitized) parsed = sanitized;
  } else if (turnType === "student_revision") {
    const { sanitized, errors: validationErrors } = validateRevision(parsed);
    if (validationErrors.length > 0) console.log('Validation issues:', validationErrors);
    if (sanitized) parsed = sanitized;
  } else if (turnType === "student_answer") {
    const { sanitized, errors: validationErrors } = validateStudentAnswer(parsed);
    if (validationErrors.length > 0) console.log('Validation issues:', validationErrors);
    if (sanitized) parsed = sanitized;
  }

  let systemMessageText = ""

  const hasTopicIssue = parsed.topic_check && !parsed.topic_check.on_topic
  const hasFormatIssue = parsed.format_check && !parsed.format_check.correct_format_used
  const grammarCount = parsed.direct_feedback?.length || 0
  const vocabCount = parsed.socratic_questions?.filter(q => q.track === 'soft_socratic').length || 0
  const logicCount = parsed.socratic_questions?.filter(q => q.track === 'full_socratic').length || 0

  const isAnalyzeTurn = !feedbackFocus ||
    feedbackFocus === 'analyze' ||
    (turnType === 'student_revision' && !(hasTopicIssue || hasFormatIssue) &&
     (grammarCount > 0 || vocabCount > 0 || logicCount > 0))

  if (hasTopicIssue || hasFormatIssue) {
    const issueType = hasTopicIssue ? 'topic' : 'format'
    const issueDetail = hasTopicIssue
      ? parsed.topic_check.topic_issue
      : parsed.format_check.format_issue

    const otherParts = []
    if (grammarCount > 0) otherParts.push(`${grammarCount} grammar issue${grammarCount > 1 ? 's' : ''}`)
    if (vocabCount > 0) otherParts.push(`${vocabCount} vocabulary pattern${vocabCount > 1 ? 's' : ''}`)
    if (logicCount > 0) otherParts.push(`${logicCount} idea suggestion${logicCount > 1 ? 's' : ''}`)

    systemMessageText = issueDetail + (otherParts.length > 0
      ? `\n\nThere are also ${otherParts.join(' and ')} to look at — we will get to those once this is sorted.`
      : '')

  } else {
    // Normal flow — no topic or format issues
    const parts = []
    if (grammarCount > 0) parts.push(`${grammarCount} grammar issue${grammarCount > 1 ? 's' : ''}`)
    if (vocabCount > 0) parts.push(`${vocabCount} vocabulary pattern${vocabCount > 1 ? 's' : ''}`)
    if (logicCount > 0) parts.push(`${logicCount} idea suggestion${logicCount > 1 ? 's' : ''}`)

    if (parsed.conversational_response) {
      systemMessageText = parsed.conversational_response
    } else if (parts.length > 0 && isAnalyzeTurn) {
      systemMessageText = `I found ${parts.join(', ')}. What would you like to work on first?`
    } else {
      // Detailed feedback turn
      if (parsed.what_is_strong) systemMessageText += parsed.what_is_strong + "\n\n"
      if (parsed.direct_feedback?.length > 0) {
        parsed.direct_feedback.forEach(fb => {
          if (fb.message) systemMessageText += fb.message + "\n\n"
        })
      }
      if (parsed.socratic_questions?.length > 0) {
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

  // Build focus options for the analyze turn
  const focusOptions = []
  if (grammarCount > 0) focusOptions.push({ key: 'grammar', label: `Grammar (${grammarCount})`, disabled: false })
  if (vocabCount > 0) focusOptions.push({ key: 'vocabulary', label: `Vocabulary (${vocabCount})`, disabled: false })
  if (logicCount > 0) focusOptions.push({ key: 'ideas', label: `Ideas (${logicCount})`, disabled: false })
  if (focusOptions.length > 1) focusOptions.push({ key: 'all', label: 'Everything', disabled: false })

  const hasStructureIssue = parsed.has_structure_issue || hasTopicIssue || hasFormatIssue
  const structureIssueType = parsed.structure_issue_type || (hasTopicIssue ? 'topic' : hasFormatIssue ? 'format' : null)

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
    options:               parsed.options || [],
    showFocusChoice:       parsed.show_focus_choice || isAnalyzeTurn || false,
    focusOptions,
    hasStructureIssue,
    structureIssueType,
    conversationalResponse: parsed.conversational_response || null,
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
