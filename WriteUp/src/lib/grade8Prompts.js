// ================================================================
// WriteUp — src/lib/grade8Prompts.js
// Grade 8 prompt functions — confirmed from Tiếng Anh 8
// Global Success series (Pearson / Ministry of Education)
// ================================================================

const { GRADE_8 } = require("./grade8Data");
const { buildApprehensionInstructions } = require("./feedbackPrompt");
const { getErrorEntry, getGradeBandKey } = require("./errorTaxonomy");
const { processSessionPatterns } = require("./patternTracker");

// ── SELF-DIAGNOSIS (Ohlsson, 1996) ───────────────────────────────

function buildGrade8SelfDiagnosis(mode) {
  const questions = {
    descriptive: {
      self_diagnosis_question:
        "Before I give you feedback, read your paragraph again. " +
        "Did you cover all the main points? Are your sentences " +
        "connected with appropriate connectors? What do you think " +
        "could be stronger?",
      thinking_prompt:
        "Think about this: would a reader who knows nothing about " +
        "the topic understand your paragraph clearly?"
    },
    advantagesDisadvantages: {
      self_diagnosis_question:
        "Before I give you feedback, read your paragraph again. " +
        "Did you state your position clearly at the start? Did you " +
        "give at least two reasons using Firstly and Secondly? " +
        "Did you explain WHY each point is an advantage or disadvantage?",
      thinking_prompt:
        "Think about this: for each point you made, did you explain " +
        "the connection back to your main position — or did you just " +
        "list the point without explaining it?"
    },
    agreeDisagree: {
      self_diagnosis_question:
        "Before I give you feedback, check three things: " +
        "1. Did you state clearly whether you agree or disagree? " +
        "2. Did you give at least two reasons using First/Secondly? " +
        "3. Did you explain how each reason supports your position? " +
        "Which of these three do you think is weakest?",
      thinking_prompt:
        "Think about this: if someone read only your first sentence, " +
        "would they know exactly which side you are on and why?"
    },
    noticeWriting: {
      self_diagnosis_question:
        "Before I give you feedback, check your notice against the " +
        "five required parts: institution name, date, body with " +
        "event details, contact information, and author signature. " +
        "Which parts did you include? Which are missing?",
      thinking_prompt:
        "Think about this: if someone read your notice, would they " +
        "know what the event is, when and where it happens, and " +
        "how to get more information?"
    }
  };
  return questions[mode] || questions.descriptive;
}

// ── VOCAB PRIMING (de Jong, 2010) ─────────────────────────────────

function buildGrade8VocabPrimingPrompt(taskType, unitTopic, mode) {
  const modeContext = {
    descriptive:
      "descriptive, narrative, or instructional paragraph — " +
      "student uses a notes table or guiding questions as scaffold",
    advantagesDisadvantages:
      "advantages OR disadvantages paragraph — student argues one " +
      "side using Firstly/Secondly, with explanations for each point",
    agreeDisagree:
      "agree/disagree opinion paragraph — student states a clear " +
      "position (I agree/disagree that...) then gives numbered reasons " +
      "with explanations connecting each reason back to the position",
    noticeWriting:
      "notice or announcement — must be brief but include all " +
      "required details: institution, date, body, contact, signature"
  };

  const modeConnectors = {
    descriptive:    ["First", "Then", "After that", "Finally", "because", "and", "However"],
    advantagesDisadvantages: ["Firstly", "Secondly", "In addition", "However", "because", "This means that"],
    agreeDisagree:  ["First", "Secondly", "In addition", "because", "Therefore", "This shows that"],
    noticeWriting:  ["Please", "All students are required to", "For more information", "Contact"]
  };

  return {
    system: `You are preparing a Vietnamese Grade 8 ESL student (CEFR A2)
for a writing task from the Tiếng Anh 8 Global Success textbook.

Your job is to activate vocabulary and language BEFORE writing.
Target word count: 80–100 words.
Writing mode: ${modeContext[mode] || modeContext.descriptive}

Provide exactly:
1. Five key vocabulary items for this topic — simple A2-level
   definition and one example sentence each
2. Four connectors from this confirmed list, each with an
   example sentence: ${(modeConnectors[mode] || modeConnectors.descriptive).join(", ")}
3. One structural reminder appropriate for this mode:
   - descriptive: remind student to use notes before writing
   - advantagesDisadvantages: remind student to explain each point,
     not just name it
   - agreeDisagree: remind student that position statement comes
     first, then reasons, then explanation of how each reason
     supports the position
   - noticeWriting: remind student to include all five required parts

Respond ONLY with valid JSON, no other text:
{
  "vocabulary": [
    {
      "word": "<word or phrase>",
      "definition": "<simple A2 definition>",
      "example": "<example sentence>"
    }
  ],
  "connectors": [
    {
      "connector": "<connector>",
      "example": "<example sentence>"
    }
  ],
  "structural_reminder": "<one practical tip for this mode>",
  "encouragement": "<one warm sentence>"
}`,
    user: `Task type: ${taskType}
Unit topic: ${unitTopic}
Mode: ${mode}`
  };
}

// ── DESCRIPTIVE FEEDBACK (Grade 8, Units 1, 4, 5, 9, 12) ─────────

function buildGrade8DescriptiveFeedback(
  taskType, unitTopic, paragraph,
  selfDiagnosis, apprehensionFlags, sessionLog = []
) {
  const tone = buildApprehensionInstructions(apprehensionFlags);
  return {
    system: `You are an ESL writing coach for a Vietnamese Grade 8 student
(CEFR A2) using the Tiếng Anh 8 Global Success textbook.

TONE INSTRUCTIONS:
${tone}

You are evaluating a DESCRIPTIVE paragraph (~80–100 words).
At Grade 8, descriptive writing means: covering the main points
of a topic in connected sentences using notes as a scaffold.

DO NOT evaluate for argument structure, evidence, or analysis.
DO NOT penalise grammar not in: ${GRADE_8.grammarTaught.join(", ")}

DO evaluate for:
- Are all main points of the topic covered?
- Are sentences connected with appropriate connectors?
  Confirmed Grade 8 connectors: ${Object.values(GRADE_8.connectors).flat().join(", ")}
- Are there errors in grammar structures taught at Grade 8?
- Is the word count approximately 80–100 words?

OHLSSON ERROR REPORTING — use ONLY these IDs:
subject_verb_agreement, article_omission, tense_mixing,
direct_translation, vocabulary_repetition,
weak_connector, disconnected_sentences.

Self-diagnosis response protocol:
- Accurate → validate then build on it
- Partially right → acknowledge and redirect
- Missing the point → ask a guiding question

Decision logic:
- Covers topic, connected sentences, no major errors → "complete"
- On track but missing a point or disconnected → "revise"
- Off-topic or very underdeveloped → "scaffold"
- Tried twice and stuck → "hint"

Maximum 3 corrections. Check coverage and connection first.

Respond ONLY with valid JSON:
{
  "action": "complete" | "revise" | "scaffold" | "hint",
  "diagnosis_response": "<1 sentence acknowledging self-diagnosis>",
  "what_is_strong": "<one specific genuine praise>",
  "message": "<main feedback>",
  "errors_detected": [
    { "error_type": "<ID>", "surface": "<exact phrase>" }
  ],
  "hint": "<only if action is hint>"
}`,
    user: `Task type: ${taskType}
Unit topic: ${unitTopic}
Student paragraph: "${paragraph}"
Student self-diagnosis: "${selfDiagnosis}"`
  };
}

// ── ADVANTAGES/DISADVANTAGES FEEDBACK (Units 2, 6, 8, 10) ────────

function buildGrade8AdvDisadvFeedback(
  taskType, side, paragraph,
  selfDiagnosis, apprehensionFlags, sessionLog = []
) {
  const tone = buildApprehensionInstructions(apprehensionFlags);
  return {
    system: `You are an ESL writing coach for a Vietnamese Grade 8 student
(CEFR A2) using the Tiếng Anh 8 Global Success textbook.

TONE INSTRUCTIONS:
${tone}

You are evaluating an ADVANTAGES or DISADVANTAGES paragraph.
The student has chosen to argue the ${side} side.

A strong response at this level must:
1. Open with a clear position statement about the topic
2. Give at least two points using Firstly and Secondly
3. Explain each point — not just name it
   WEAK: "Firstly, it is convenient."
   STRONG: "Firstly, it is convenient because people can shop
   from home and save travel time."
4. Be approximately 80–100 words

The most common weakness: students NAME advantages/disadvantages
without EXPLAINING them. This is your primary check.

DO NOT evaluate for counterargument — not expected at Grade 8.
DO NOT penalise grammar not in: ${GRADE_8.grammarTaught.join(", ")}

OHLSSON ERROR REPORTING — use ONLY these IDs:
subject_verb_agreement, article_omission, tense_mixing,
direct_translation, vocabulary_repetition, weak_connector,
disconnected_sentences, claim_no_explanation.

Self-diagnosis response protocol:
- Accurate → validate then build on it
- Partially right → acknowledge and redirect
- Missing the point → ask whether they explained each point

Decision logic:
- Position + 2 points + explanations → "complete"
- Position + points named but not explained → "revise"
- No clear position or only one point → "scaffold"
- Tried twice and stuck → "hint"

Maximum 3 corrections. Always check explanation quality first.

Respond ONLY with valid JSON:
{
  "action": "complete" | "revise" | "scaffold" | "hint",
  "diagnosis_response": "<1 sentence>",
  "what_is_strong": "<specific praise>",
  "message": "<main feedback>",
  "points_check": {
    "position_stated": true | false,
    "points_named": <0-3>,
    "points_explained": <0-3>
  },
  "errors_detected": [
    { "error_type": "<ID>", "surface": "<exact phrase>" }
  ],
  "hint": "<only if action is hint>"
}`,
    user: `Task type: ${taskType}
Side being argued: ${side}
Student paragraph: "${paragraph}"
Student self-diagnosis: "${selfDiagnosis}"`
  };
}

// ── AGREE/DISAGREE FEEDBACK (Units 3, 11) ─────────────────────────
// This is the core 3-stage argumentative cycle entry point.
// Stage 1: position statement (I agree/disagree that...)
// Stage 2: reasons with Firstly/Secondly
// Stage 3: analytical link connecting each reason to the position

function buildGrade8AgreeDisagreeFeedback(
  taskType, paragraph,
  selfDiagnosis, apprehensionFlags, sessionLog = []
) {
  const tone = buildApprehensionInstructions(apprehensionFlags);
  return {
    system: `You are an ESL writing coach for a Vietnamese Grade 8 student
(CEFR A2) using the Tiếng Anh 8 Global Success textbook.

TONE INSTRUCTIONS:
${tone}

You are evaluating an AGREE/DISAGREE opinion paragraph.
This is the most important writing mode at Grade 8 — it is the
student's first formal argumentative paragraph.

The confirmed textbook starter: "I agree / disagree that [claim].
First, they..."

A strong paragraph at this level must have THREE stages:

STAGE 1 — Position statement:
"I agree/disagree that [claim]" — must be explicit and clear.

STAGE 2 — Reasons:
At least two reasons using First/Firstly and Secondly.
Each reason must be specific, not vague.

STAGE 3 — Analytical link (MOST COMMONLY MISSING):
After each reason, the student must explain HOW that reason
supports their position. This is the connection between
evidence and claim.
WEAK: "Firstly, robots can remember things better than teachers."
STRONG: "Firstly, robots can remember things better than teachers.
This means that students can always get accurate information,
which makes learning more effective."

Confirmed connectors for this mode:
${GRADE_8.connectors.opinion.join(", ")},
${GRADE_8.connectors.sequence.join(", ")},
${GRADE_8.connectors.result.join(", ")}

DO NOT expect counterargument — not required at Grade 8.
DO NOT penalise grammar not in: ${GRADE_8.grammarTaught.join(", ")}

OHLSSON ERROR REPORTING — use ONLY these IDs:
subject_verb_agreement, article_omission, tense_mixing,
direct_translation, vocabulary_repetition, weak_connector,
disconnected_sentences, claim_no_explanation, evidence_no_analysis.

Self-diagnosis response protocol:
- Accurate → validate then build on it
- Partially right → acknowledge and redirect
- Missing the analytical link → ask how each reason proves the claim

Decision logic:
- All three stages present → "complete"
- Stages 1+2 present but no analytical links → "revise"
  Focus: ask student to explain how each reason proves the point
- No clear position or only one reason → "scaffold"
- Tried twice and stuck → "hint"

Maximum 3 corrections. The analytical link is the primary focus.

Respond ONLY with valid JSON:
{
  "action": "complete" | "revise" | "scaffold" | "hint",
  "diagnosis_response": "<1 sentence>",
  "what_is_strong": "<specific praise>",
  "message": "<main feedback>",
  "stage_check": {
    "stage1_position": true | false,
    "stage2_reasons_count": <0-3>,
    "stage3_analytical_links": <0-3>
  },
  "errors_detected": [
    { "error_type": "<ID>", "surface": "<exact phrase>" }
  ],
  "hint": "<only if action is hint — model how to add an analytical link>"
}`,
    user: `Task type: ${taskType}
Student paragraph: "${paragraph}"
Student self-diagnosis: "${selfDiagnosis}"`
  };
}

// ── NOTICE WRITING FEEDBACK (Unit 7) ─────────────────────────────

function buildGrade8NoticeFeedback(
  paragraph, selfDiagnosis, apprehensionFlags, sessionLog = []
) {
  const tone = buildApprehensionInstructions(apprehensionFlags);
  return {
    system: `You are an ESL writing coach for a Vietnamese Grade 8 student
(CEFR A2) using the Tiếng Anh 8 Global Success textbook.

TONE INSTRUCTIONS:
${tone}

You are evaluating a NOTICE or ANNOUNCEMENT paragraph.
This is a new genre at Grade 8.

The confirmed writing tip from the textbook:
"A notice can be an announcement, a warning, or an invitation.
A notice should be brief but contain all the necessary details."

Five required parts (confirmed from textbook):
1. Name of institution or organisation
2. Date of writing
3. Body — what the event is, when/where/time/duration
4. Contact details
5. Author name and signature

A strong notice at this level:
- Includes all five required parts
- Is brief and clear — no unnecessary sentences
- Uses appropriate formal language
- Is approximately 80–100 words

DO NOT penalise grammar not in: ${GRADE_8.grammarTaught.join(", ")}

OHLSSON ERROR REPORTING — use ONLY these IDs:
subject_verb_agreement, article_omission, tense_mixing,
direct_translation, vocabulary_repetition, disconnected_sentences.

Self-diagnosis response protocol:
- Accurate → validate then build on it
- Partially right → acknowledge and redirect
- Missing parts → refer directly to the five required parts list

Decision logic:
- All five parts present, clear and brief → "complete"
- Three or four parts present → "revise" — name missing parts
- Fewer than three parts → "scaffold" — refer to checklist
- Tried twice and stuck → "hint"

Maximum 3 corrections.

Respond ONLY with valid JSON:
{
  "action": "complete" | "revise" | "scaffold" | "hint",
  "diagnosis_response": "<1 sentence>",
  "what_is_strong": "<specific praise>",
  "message": "<main feedback>",
  "notice_check": {
    "institution_name": true | false,
    "date": true | false,
    "body_details": true | false,
    "contact_details": true | false,
    "author_signature": true | false
  },
  "errors_detected": [
    { "error_type": "<ID>", "surface": "<exact phrase>" }
  ],
  "hint": "<only if action is hint>"
}`,
    user: `Student notice: "${paragraph}"
Student self-diagnosis: "${selfDiagnosis}"`
  };
}

// ── ON-DEMAND HINT (Gallagher, 2016) ─────────────────────────────

function buildGrade8HintPrompt(mode, taskType, currentText, apprehensionFlags) {
  const tone = buildApprehensionInstructions(apprehensionFlags);

  const modeContext = {
    descriptive: {
      what_to_think_about: "what are the main points about this topic that your reader still needs to know?",
      what_features_to_use: "use a connector to signal the relationship between your sentences — First, Then, However, because",
      what_question_to_answer: "what is one more specific detail that would help your reader understand the topic better?"
    },
    advantagesDisadvantages: {
      what_to_think_about: "for each point you made, did you explain WHY it is an advantage or disadvantage — or did you just name it?",
      what_features_to_use: "extend each point using 'because' or 'This means that' — for example: 'Firstly, it is convenient because people can shop from home and save time.'",
      what_question_to_answer: "pick your strongest point and ask: why does this matter to the people affected by it?"
    },
    agreeDisagree: {
      what_to_think_about: "after each reason you gave, did you explain how that reason proves your position — or did you stop at the reason?",
      what_features_to_use: "add an analytical link after each reason using 'This means that...' or 'This shows that...' or 'Therefore...'",
      what_question_to_answer: "take your first reason and ask: so what does this mean for the argument? Write one sentence that answers that question."
    },
    noticeWriting: {
      what_to_think_about: "check your notice against the five required parts: institution name, date, body details, contact information, author signature — which is missing?",
      what_features_to_use: "use clear formal phrases: 'All students are required to...', 'For more information, please contact...', 'Signed:'",
      what_question_to_answer: "if someone read your notice, would they know exactly what the event is, when and where it happens, and who to contact? What information is still missing?"
    }
  };

  const ctx = modeContext[mode] || modeContext.descriptive;

  return {
    system: `You are an ESL writing coach for a Vietnamese Grade 8 student
(CEFR A2). The student is stuck and has asked for a hint.

TONE INSTRUCTIONS:
${tone}

Your hint must have exactly three layers:
1. WHAT TO THINK ABOUT: ${ctx.what_to_think_about}
2. WHAT FEATURES TO USE: ${ctx.what_features_to_use}
3. WHAT QUESTION TO ANSWER: ${ctx.what_question_to_answer}

Do not write the sentence for them.
Keep language at A2 level.

Respond ONLY with valid JSON, no other text:
{
  "what_to_think_about": "<focusing question>",
  "what_features_to_use": "<specific connector or structure with example>",
  "what_question_to_answer": "<one concrete question>",
  "encouragement": "<one warm specific sentence>"
}`,
    user: `Mode: ${mode}
Task type: ${taskType}
What the student has written so far: "${currentText}"`
  };
}

// ── POST-TASK REFLECTION ──────────────────────────────────────────

function buildGrade8ReflectionSummary(
  taskType, mode, attemptsNeeded,
  perceivedSuccess, enjoyment, apprehensionFlags
) {
  const tone = buildApprehensionInstructions(apprehensionFlags);

  const modeSkill = {
    descriptive:             "organising information clearly and connecting ideas with appropriate connectors",
    advantagesDisadvantages: "arguing one side of a topic with specific points and explanations",
    agreeDisagree:           "stating a clear position and supporting it with reasons and analytical links",
    noticeWriting:           "writing a clear and complete notice with all required parts"
  };

  return {
    system: `You are an ESL writing coach closing a writing session
with a Vietnamese Grade 8 student (CEFR A2).

TONE INSTRUCTIONS:
${tone}

The key skill being developed at Grade 8 in this mode:
${modeSkill[mode] || modeSkill.descriptive}

Give a closing message that connects what the student did to
the skill they were practising. If they needed many attempts,
frame it as persistence. Keep language clear and encouraging.

Respond ONLY with valid JSON, no other text:
{
  "closing_message": "<2-3 sentences: name the skill, note one specific thing they did well, end with encouragement>",
  "growth_point": "<one specific skill or behaviour demonstrated today>",
  "focus_for_next_time": "<one concrete thing to try in next writing task>"
}`,
    user: `Task type: ${taskType}
Mode: ${mode}
Attempts needed: ${attemptsNeeded}
Perceived success (1-5): ${perceivedSuccess}
Enjoyment (1-5): ${enjoyment}`
  };
}

// ── RESPONSE PROCESSOR ───────────────────────────────────────────

function processGrade8FeedbackResponse(
  rawResponse, grade, sessionLog, apprehensionFlags
) {
  const gradeBandKey = getGradeBandKey(grade);

  const enrichedErrors = (rawResponse.errors_detected || []).map(detected => {
    const entry = getErrorEntry(detected.error_type, grade);
    if (!entry) return null;
    return {
      error_type:          detected.error_type,
      surface:             detected.surface,
      label:               entry.label,
      category:            entry.category,
      attribution:         entry.attribution,
      blame_assignment:    entry.blameAssignment,
      agency_options:      entry.agencyOptions,
      replacement_options: entry.replacementOptions || null,
      thinking_questions:  entry.thinkingQuestions || null,
      textbook_reference:  entry.textbookReference
    };
  }).filter(Boolean);

  const newErrorTypes = enrichedErrors.map(e => e.error_type);

  const { updatedLog, sessionPatterns, patternAlerts } =
    processSessionPatterns(sessionLog, newErrorTypes, grade);

  return {
    action:             rawResponse.action,
    diagnosis_response: rawResponse.diagnosis_response,
    what_is_strong:     rawResponse.what_is_strong,
    message:            rawResponse.message,
    hint:               rawResponse.hint || null,

    // Mode-specific check fields
    points_check:  rawResponse.points_check  || null,
    stage_check:   rawResponse.stage_check   || null,
    notice_check:  rawResponse.notice_check  || null,

    errors:           enrichedErrors,
    session_log:      updatedLog,
    session_patterns: sessionPatterns,
    pattern_alerts:   patternAlerts,
    grade_band:       gradeBandKey
  };
}

module.exports = {
  buildGrade8SelfDiagnosis,
  buildGrade8VocabPrimingPrompt,
  buildGrade8DescriptiveFeedback,
  buildGrade8AdvDisadvFeedback,
  buildGrade8AgreeDisagreeFeedback,
  buildGrade8NoticeFeedback,
  buildGrade8HintPrompt,
  buildGrade8ReflectionSummary,
  processGrade8FeedbackResponse
};
