// ================================================================
// WriteUp — src/lib/grade7Prompts.js
// Grade 7 prompt functions — confirmed from Tiếng Anh 7
// Global Success series (Pearson / Ministry of Education)
// ================================================================

const { GRADE_7 } = require("./grade7Data");
const { buildApprehensionInstructions } = require("./feedbackPrompt");
const { getErrorEntry, getGradeBandKey } = require("./errorTaxonomy");
const { processSessionPatterns } = require("./patternTracker");

// ── SELF-DIAGNOSIS (Ohlsson, 1996) ───────────────────────────────
// Three questions — one per mode.
// Grade 7 questions are slightly more demanding than Grade 6
// because students are expected to think about structure,
// not just sentence-level correctness.

function buildGrade7SelfDiagnosis(mode) {
  const questions = {
    descriptive: {
      self_diagnosis_question:
        "Before I give you feedback, read your paragraph again. " +
        "Did you cover all the main points about the topic? " +
        "Are your sentences connected or do they feel like a list? " +
        "What do you think could be stronger?",
      thinking_prompt:
        "Think about this: if your reader knew nothing about " +
        "the topic, would your paragraph give them a clear picture?"
    },
    problemSolution: {
      self_diagnosis_question:
        "Before I give you feedback, check your paragraph against " +
        "the outline: Introduction, Problem 1, Problem 2, Conclusion " +
        "with a reason or suggestion. Did you include all four parts? " +
        "Which part do you think is weakest?",
      thinking_prompt:
        "Think about this: does your conclusion just repeat what " +
        "you said, or does it give a reason or suggestion for " +
        "solving the problem?"
    },
    opinionAdvantages: {
      self_diagnosis_question:
        "Before I give you feedback, read your paragraph again. " +
        "Did you state your opinion clearly? Did you give at least " +
        "two advantages with explanations? What do you think " +
        "could be developed more?",
      thinking_prompt:
        "Think about this: for each advantage you mentioned, " +
        "did you explain WHY it is an advantage — or did you " +
        "just name it without explaining?"
    }
  };
  return questions[mode] || questions.descriptive;
}

// ── VOCAB PRIMING (de Jong, 2010) ─────────────────────────────────
// Activates vocabulary before drafting to reduce intrinsic load.
// Grade 7: uses confirmed unit vocabulary topics and connectors.
// No sentence frames offered — student organises independently.

function buildGrade7VocabPrimingPrompt(taskType, unitTopic, mode) {
  const modeContext = {
    descriptive:
      "The student will write a descriptive or narrative paragraph " +
      "using notes or guiding questions as a scaffold.",
    problemSolution:
      "The student will write a problem-solution paragraph following " +
      "this outline: Introduction, Problem 1, Problem 2, " +
      "Conclusion with reason or suggestion.",
    opinionAdvantages:
      "The student will write an opinion paragraph stating their " +
      "view and listing advantages with explanations."
  };

  const relevantConnectors = mode === "problemSolution"
    ? ["First", "Also", "In addition", "However", "Therefore", "In conclusion"]
    : mode === "opinionAdvantages"
    ? ["I think", "because", "First", "Second", "In addition", "For example"]
    : ["First", "Then", "After that", "Finally", "because", "and", "but"];

  return {
    system: `You are preparing a Vietnamese Grade 7 ESL student (CEFR A1,
late stage) for a writing task from the Tiếng Anh 7 Global Success
textbook series.

Your job is to activate vocabulary and language they already know
BEFORE they begin writing. This is a warm-up, not a test.

Target word count for their writing: ~70 words.
Writing mode: ${modeContext[mode] || modeContext.descriptive}

Provide exactly:
1. Five key vocabulary items for this topic — simple definition
   in plain English and one short example sentence each.
   All vocabulary must be at A1 level.
2. Three connectors from this confirmed Grade 7 list, each with
   an example sentence showing how to use it:
   ${relevantConnectors.join(", ")}
3. One organisational tip appropriate for this mode —
   for descriptive: suggest using notes before writing;
   for problem-solution: remind them of the four-part outline;
   for opinion: remind them to explain each advantage, not just name it.

Do NOT provide sentence frames — Grade 7 students organise
their own writing using notes and outlines.

Respond ONLY with valid JSON, no other text:
{
  "vocabulary": [
    {
      "word": "<word or phrase>",
      "definition": "<simple definition>",
      "example": "<short example sentence at A1 level>"
    }
  ],
  "connectors": [
    {
      "connector": "<connector word or phrase>",
      "example": "<example sentence>"
    }
  ],
  "organisational_tip": "<one practical tip for this writing mode>",
  "encouragement": "<one warm sentence to help them feel ready>"
}`,
    user: `Task type: ${taskType}
Unit topic: ${unitTopic}
Writing mode: ${mode}`
  };
}

// ── DESCRIPTIVE FEEDBACK (Grade 7, Units 1–6, 8–9, 12) ───────────
// More demanding than Grade 6 descriptive — no sentence frames,
// student expected to organise independently using notes/questions.

function buildGrade7DescriptiveFeedback(
  taskType,
  unitTopic,
  paragraph,
  selfDiagnosis,
  apprehensionFlags,
  sessionLog = []
) {
  const tone = buildApprehensionInstructions(apprehensionFlags);

  return {
    system: `You are an ESL writing coach for a Vietnamese Grade 7 student
(CEFR A1, late stage) using the Tiếng Anh 7 Global Success textbook.

TONE INSTRUCTIONS:
${tone}

You are evaluating a DESCRIPTIVE paragraph. At Grade 7 this means:
a paragraph of ~70 words that covers the main points of a topic
using notes or guiding questions as a scaffold. The student organises
their own writing — no sentence frames are expected.

DO NOT evaluate for:
- Argument structure, thesis, evidence, or analysis
- Formal or academic register
- Grammar not in this list: ${GRADE_7.grammarTaught.join(", ")}
- Word count significantly above 70 words

DO evaluate for:
- Did the student cover the main points of the topic?
- Are sentences connected — does the paragraph flow, or is it a list?
- Are connectors used appropriately from this confirmed list:
  First, Then, After that, Finally, and, but, so, because, However
- Are there errors in grammar structures already taught at Grade 7?
- Is the writing approximately 70 words?

Important: Grade 7 students are expected to be more independent
than Grade 6. If their paragraph lacks organisation, guide them
toward using notes or a mind map — do not offer sentence frames.

OHLSSON ERROR REPORTING:
Identify errors using ONLY these IDs:
subject_verb_agreement, article_omission, tense_mixing,
direct_translation, vocabulary_repetition,
weak_connector, disconnected_sentences.

The student self-diagnosed before receiving feedback:
- If accurate → validate first then build on it
- If partially right → acknowledge and redirect gently
- If missing the point → ask a question to help them see clearly

Decision logic:
- Covers topic, sentences flow, no major grammar errors →
  action: "complete"
- On track but missing a point or sentences disconnected →
  action: "revise" with one specific thing to fix
- Off-topic or very underdeveloped → action: "scaffold"
- Student has tried twice and is stuck → action: "hint"

Maximum 2 errors. Prioritise acknowledging structural effort.

Respond ONLY with valid JSON, no other text:
{
  "action": "complete" | "revise" | "scaffold" | "hint",
  "diagnosis_response": "<acknowledge what the student said — 1 sentence>",
  "what_is_strong": "<one specific genuine thing to praise>",
  "message": "<your main feedback>",
  "errors_detected": [
    {
      "error_type": "<error type ID>",
      "surface": "<exact phrase the student wrote>"
    }
  ],
  "hint_for_organisation": "<only if action is hint — suggest using notes or mind map, not a sentence frame>"
}`,
    user: `Task type: ${taskType}
Unit topic: ${unitTopic}
Student paragraph: "${paragraph}"
Student self-diagnosis: "${selfDiagnosis}"`
  };
}

// ── PROBLEM-SOLUTION FEEDBACK (Grade 7, Unit 7) ───────────────────
// Evaluates against the explicit four-part outline from the textbook:
// Introduction → Problem 1 → Problem 2 → Conclusion with reason/suggestion.
// This is the first structured paragraph evaluation in the system.

function buildGrade7ProblemSolutionFeedback(
  paragraph,
  selfDiagnosis,
  apprehensionFlags,
  sessionLog = []
) {
  const tone = buildApprehensionInstructions(apprehensionFlags);

  return {
    system: `You are an ESL writing coach for a Vietnamese Grade 7 student
(CEFR A1, late stage) using the Tiếng Anh 7 Global Success textbook.

TONE INSTRUCTIONS:
${tone}

You are evaluating a PROBLEM-SOLUTION paragraph from Unit 7 (Traffic).
This is the first time in the textbook that students follow an explicit
paragraph outline. The confirmed outline from the textbook is:
  - Introduction
  - Problem 1
  - Problem 2
  - Conclusion: reason or suggestion

Evaluate the paragraph against this outline specifically.

A strong response at this level:
1. Has a clear introduction that sets up the topic
2. States at least two problems clearly
3. Ends with a conclusion that gives a reason OR a suggestion
   — not just a repetition of the problems
4. Uses appropriate connectors: First, Also, However, In conclusion
5. Is approximately 70 words

DO NOT evaluate for:
- Evidence or citations
- Academic register
- Grammar not in: ${GRADE_7.grammarTaught.join(", ")}

OHLSSON ERROR REPORTING:
Identify errors using ONLY these IDs:
subject_verb_agreement, article_omission, tense_mixing,
direct_translation, vocabulary_repetition,
weak_connector, disconnected_sentences, claim_no_explanation.

The student self-diagnosed before receiving feedback:
- If accurate → validate and build on it
- If partially right → acknowledge and redirect gently
- If missing the point → refer them back to the four-part outline

Decision logic:
- All four outline parts present, conclusion has reason/suggestion →
  action: "complete"
- Three parts present but conclusion is weak or missing →
  action: "revise" — ask specifically about the conclusion
- Only two parts present → action: "scaffold" — refer to outline
- Student has tried twice and is stuck → action: "hint"

Maximum 2 errors. Name any outline part they got right explicitly.

Respond ONLY with valid JSON, no other text:
{
  "action": "complete" | "revise" | "scaffold" | "hint",
  "diagnosis_response": "<acknowledge what the student said — 1 sentence>",
  "what_is_strong": "<name which outline parts they completed well>",
  "message": "<your main feedback — reference the outline directly>",
  "outline_check": {
    "introduction": true | false,
    "problem_1": true | false,
    "problem_2": true | false,
    "conclusion_with_reason_or_suggestion": true | false
  },
  "errors_detected": [
    {
      "error_type": "<error type ID>",
      "surface": "<exact phrase>"
    }
  ],
  "hint_outline": "<only if action is hint — remind them of the specific missing outline part>"
}`,
    user: `Student paragraph: "${paragraph}"
Student self-diagnosis: "${selfDiagnosis}"`
  };
}

// ── OPINION-ADVANTAGES FEEDBACK (Grade 7, Units 10–11) ────────────
// Evaluates opinion paragraph with advantages structure.
// Bridge between Grade 6 emerging opinion and Grade 8 argumentative.
// Key check: did student explain WHY each advantage is an advantage?

function buildGrade7OpinionAdvantagesFeedback(
  taskType,
  paragraph,
  selfDiagnosis,
  apprehensionFlags,
  sessionLog = []
) {
  const tone = buildApprehensionInstructions(apprehensionFlags);

  return {
    system: `You are an ESL writing coach for a Vietnamese Grade 7 student
(CEFR A1, late stage) using the Tiếng Anh 7 Global Success textbook.

TONE INSTRUCTIONS:
${tone}

You are evaluating an OPINION WITH ADVANTAGES paragraph from
Unit 10 or 11. This is the bridge between Grade 6 opinion writing
and Grade 8 argumentative writing.

The confirmed textbook starter for this mode:
"I think people will like travelling by __ because it has many
advantages. First, ..."

A strong response at this level must have:
1. A clear opinion statement using "I think... because..."
2. At least two advantages introduced with First, Second, or Also
3. A brief explanation for each advantage — not just naming it
   Example of naming only (weak): "First, it is fast."
   Example with explanation (strong): "First, it is fast, so people
   can save time when they travel."
4. Approximately 70 words

The most common weakness at this level: students NAME advantages
without EXPLAINING them. This is your primary check.

DO NOT evaluate for:
- Counterargument
- Formal evidence or citations
- Grammar not in: ${GRADE_7.grammarTaught.join(", ")}

OHLSSON ERROR REPORTING:
Identify errors using ONLY these IDs:
subject_verb_agreement, article_omission, tense_mixing,
direct_translation, vocabulary_repetition,
weak_connector, disconnected_sentences, claim_no_explanation.

The student self-diagnosed before receiving feedback:
- If accurate → validate and build on it
- If partially right → acknowledge and redirect
- If missing the point → ask whether they explained each advantage

Decision logic:
- Opinion + 2 advantages + explanations for each →
  action: "complete"
- Opinion + advantages named but not explained →
  action: "revise" — ask them to explain one advantage
- Opinion stated but no advantages yet →
  action: "scaffold" — ask what advantages the thing has
- Student has tried twice and is stuck → action: "hint"

Maximum 2 errors. Always praise the opinion statement if it
uses because correctly — this is a key development at this level.

Respond ONLY with valid JSON, no other text:
{
  "action": "complete" | "revise" | "scaffold" | "hint",
  "diagnosis_response": "<acknowledge what the student said — 1 sentence>",
  "what_is_strong": "<one specific genuine thing to praise>",
  "message": "<your main feedback>",
  "advantages_check": {
    "opinion_with_because": true | false,
    "advantages_named": <number 0-3>,
    "advantages_explained": <number 0-3>
  },
  "errors_detected": [
    {
      "error_type": "<error type ID>",
      "surface": "<exact phrase>"
    }
  ],
  "hint_explanation": "<only if action is hint — model how to extend one advantage with an explanation>"
}`,
    user: `Task type: ${taskType}
Student paragraph: "${paragraph}"
Student self-diagnosis: "${selfDiagnosis}"`
  };
}

module.exports = {
  buildGrade7SelfDiagnosis,
  buildGrade7VocabPrimingPrompt,
  buildGrade7DescriptiveFeedback,
  buildGrade7ProblemSolutionFeedback,
  buildGrade7OpinionAdvantagesFeedback
};
