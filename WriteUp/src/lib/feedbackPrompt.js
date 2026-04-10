const { getErrorEntry, getGradeBandKey } = require("./errorTaxonomy");
const { processSessionPatterns } = require("./patternTracker");
// ================================================================
// WriteUp — feedbackPrompt.js
// Grade-by-grade prompt builder grounded in Tiếng Anh textbook series
// Built grade by grade — grades 7-12 to be added after textbook review
// ================================================================
// ── GRADE 6 DATA ─────────────────────────────────────────────────
// Source: Tiếng Anh Grade 6, Parts 1 and 2 (Ministry of Education)
// All parameters confirmed from textbook writing pages and glossary
const GRADE_6 = {
  cefr: "A1",
  cefr_note: "A1 per Ministry curriculum. Both volumes (Tập Một Units 1–6, Tập Hai Units 7–12).",
  wordCount: "40–60 words",
  wordCountRange: { min: 40, max: 60 },

  modes: {
    descriptive: {
      units: "1–3, 5, 7–10, 12",
      description:
        "Guided question answers assembled into a paragraph, email, " +
        "diary entry, or postcard using sentence frames. " +
        "No argument structure required.",
      taskTypes: [
        "descriptive paragraph",
        "informal email",
        "diary entry",
        "postcard"
      ]
    },
    emergingOpinion: {
      units: "4, 6, 11",
      description:
        "First structured opinion writing. Uses 'I think... Firstly... Secondly...' " +
        "with explanation or example. No evidence-analysis link required yet.",
      taskTypes: ["opinion paragraph with explanation"]
    }
  },

  unitTasks: {
    1:  { topic: "My New School",                  task: "Write a paragraph about your school",                                          mode: "descriptive",       format: "paragraph",   starter: "My school is",                                        wordCount: { min: 40, max: 50 } },
    2:  { topic: "My House",                        task: "Write an email to a pen friend about your house",                              mode: "descriptive",       format: "email",       starter: "Hi Mira,\nThanks for your email. Now I'll tell you about my house.", wordCount: { min: 40, max: 50 } },
    3:  { topic: "My Friends",                      task: "Write a diary entry about your best friend",                                   mode: "descriptive",       format: "diary",       starter: "Dear Diary,\nMy best friend is",                      wordCount: { target: 50 } },
    4:  { topic: "My Neighbourhood",                task: "Write a paragraph about your neighbourhood saying what you like and dislike",  mode: "emergingOpinion",   format: "paragraph",   starter: "I live in ___. There are many things I like about my neighbourhood.", wordCount: { target: 50 } },
    5:  { topic: "Natural Wonders of Viet Nam",     task: "Write a paragraph about a travel attraction",                                  mode: "descriptive",       format: "paragraph",   starter: "I am writing about ___. It is in",                    wordCount: { target: 50 } },
    6:  { topic: "Our Tet Holiday",                 task: "Write an email about what children should and shouldn't do at Tet",            mode: "emergingOpinion",   format: "email",       starter: "Dear Tom,\nTet is coming. I will tell you more about our Tet.", wordCount: { target: 50 } },
    7:  { topic: "Television",                      task: "Write a paragraph about your TV-viewing habits",                               mode: "descriptive",       format: "paragraph",   starter: null,                                                  wordCount: { target: 50 } },
    8:  { topic: "Sports and Games",                task: "Write a paragraph about a sport or game you like",                             mode: "descriptive",       format: "paragraph",   starter: null,                                                  wordCount: { min: 40, max: 50 } },
    9:  { topic: "Cities of the World",             task: "Write a postcard about your holiday in a city",                                mode: "descriptive",       format: "postcard",    starter: "Dear Mum and Dad,",                                   wordCount: { target: 50 } },
    10: { topic: "Our Houses in the Future",        task: "Write a paragraph about your dream house",                                     mode: "descriptive",       format: "paragraph",   starter: "My dream house is a big palace. It is in the mountains.", wordCount: { target: 50 } },
    11: { topic: "Our Greener World",               task: "Write a paragraph about your classmate's ideas for the 3Rs Club president",   mode: "emergingOpinion",   format: "paragraph",   starter: "My classmate is ___. If ___ becomes the president of the 3Rs Club, ___ will do two things. Firstly,", wordCount: { target: 50 } },
    12: { topic: "Robots",                          task: "Write a paragraph about a robot you would like to have",                       mode: "descriptive",       format: "paragraph",   starter: "My robot's name is ___. It is a ___.",                wordCount: { min: 50, max: 60 } }
  },

  sentenceFrames: [
    // Unit 1
    "My school is __________.",
    "It has [number] classes / buildings / [facilities].",
    "I like my school because __________.",
    // Unit 2
    "I live in a [type] house / flat.",
    "There is / There are [furniture/rooms] in my house.",
    "My favourite room is the [room] because __________.",
    // Unit 3
    "My best friend is [name].",
    "He / She has [hair/eyes description].",
    "I like him / her because __________.",
    // Unit 4
    "I live in __________.",
    "There are many things I like about my neighbourhood.",
    "However, there are some things I dislike.",
    // Unit 5
    "I am writing about __________.",
    "It is in __________. It is famous for __________.",
    "You can __________ there.",
    // Unit 6
    "At Tet, we should __________.",
    "We shouldn't __________.",
    // Unit 9
    "Dear Mum and Dad, [City] is __________!",
    // Unit 10
    "My dream house is __________. It is in __________.",
    // Unit 11
    "I think we can do many things to improve __________ around us. Firstly, __________.",
    "My classmate is ___. If ___ becomes the president of the 3Rs Club, ___ will do two things. Firstly,",
    // Unit 12
    "My robot's name is __________. It is a __________."
  ],

  connectors: {
    coordinating: ["and", "but", "so"],
    contrast:     ["However"],
    sequence:     ["Firstly", "Secondly"],
    reason:       ["because"]
  },

  grammarTaught: [
    "present simple",
    "adverbs of frequency (always, usually, sometimes, never)",
    "possessive case (apostrophe s)",
    "prepositions of place (in, on, under, next to, between)",
    "present continuous",
    "comparative adjectives",
    "countable and uncountable nouns",
    "must and mustn't for obligation",
    "should and shouldn't for advice",
    "some and any",
    "wh-questions",
    "compound sentences with and, but, so",
    "past simple",
    "imperatives",
    "possessive adjectives and pronouns",
    "future simple (will)",
    "might for possibility",
    "articles (a, an, the)",
    "first conditional",
    "superlative adjectives (short adjectives)"
  ],

  // Grammar taught by unit — for accurate textbook references
  grammarByUnit: {
    1:  ["present simple", "adverbs of frequency"],
    2:  ["possessive case", "prepositions of place", "there is / there are"],
    3:  ["present continuous", "personality adjectives"],
    4:  ["comparative adjectives", "prepositions of place"],
    5:  ["countable and uncountable nouns", "must / mustn't"],
    6:  ["should / shouldn't", "some / any"],
    7:  ["wh-questions", "conjunctions: and, but, so"],
    8:  ["past simple", "imperatives"],
    9:  ["possessive adjectives", "possessive pronouns"],
    10: ["future simple (will)", "might for possibility"],
    11: ["articles (a/an/the)", "first conditional"],
    12: ["superlative adjectives"]
  },

  vocabularyTopics: [
    "school activities and things",
    "types of house, rooms and furniture",
    "personal appearance and personality adjectives",
    "neighbourhood places",
    "natural wonders and travel items",
    "Tet holiday activities and objects",
    "television programmes",
    "sports and games equipment",
    "cities and landmarks",
    "future houses and appliances",
    "environment and recycling",
    "robots and daily activities"
  ],

  notExpected: [
    "argumentative writing",
    "evidence or citation",
    "claim-evidence-analysis structure",
    "formal register",
    "counterargument",
    "academic vocabulary",
    "complex sentence structures beyond first conditional"
  ],

  studySkill: {
    unit: 11,
    instruction:
      "Giving explanations and/or examples is an important writing skill. " +
      "You should give explanations and/or examples to support your ideas.",
    example:
      "Secondly, I'll organise some book fairs. " +
      "At these events students can exchange their used books."
  },

  feedbackTone: {
    maxCorrections: 2,
    priority: "encouragement first — always acknowledge effort before any suggestion",
    approach:
      "Never correct grammar not yet taught. " +
      "Only flag errors in structures from grammarTaught list above."
  }
};
// ── APPREHENSION PROFILE (Daly, 1979) ────────────────────────────
// Adjusts feedback tone based on student pre-task self-check
// flags: array of zero or more:
// "fear_evaluation" | "negative_history" | "low_self_perception" | "lack_of_strategy"
function buildApprehensionInstructions(flags) {
  if (!flags || flags.length === 0) {
    return "Use a balanced, encouraging tone. Be honest but kind.";
  }
  const instructions = [];
  if (flags.includes("fear_evaluation")) {
    instructions.push(
      "This student fears being judged. Never frame feedback as failure. " +
      "Say 'your writing shows...' not 'you made an error...'. " +
      "Frame every suggestion as a next step forward, not a correction."
    );
  }
  if (flags.includes("negative_history")) {
    instructions.push(
      "This student has bad memories of teacher feedback. " +
      "Position your feedback as separate from grades or judgment. " +
      "Use phrases like 'this is just about making your writing stronger.'"
    );
  }
  if (flags.includes("low_self_perception")) {
    instructions.push(
      "This student thinks they are bad at writing. " +
      "Always lead with what_is_strong before anything else. " +
      "Make the praise specific and genuine — not generic."
    );
  }
  if (flags.includes("lack_of_strategy")) {
    instructions.push(
      "This student does not know how to approach writing tasks. " +
      "Make feedback procedural — tell them the exact next step, " +
      "not just what is missing."
    );
  }
  return instructions.join(" ");
}
// ── VOCABULARY PRIMING (de Jong, 2010) ───────────────────────────
// Called before drafting begins — activates relevant vocabulary
// so students arrive at writing with reduced intrinsic load.
// Grade 6: uses confirmed textbook vocabulary topics and sentence frames only.
function buildGrade6VocabPrimingPrompt(taskType, unitTopic) {
  const relevantFrames = GRADE_6.sentenceFrames.filter(f =>
    f.toLowerCase().includes(unitTopic.toLowerCase().split(" ")[0])
  );
  const framesToShow = relevantFrames.length > 0
    ? relevantFrames
    : GRADE_6.sentenceFrames.slice(0, 3);
  return {
    system: `You are preparing a Vietnamese Grade 6 ESL student (CEFR A1)
for a writing task from the Tiếng Anh Ministry textbook series.
Your job is to activate vocabulary and language they already know
BEFORE they begin writing — this is a warm-up, not a test.
Keep everything at A1 level. Use only simple, familiar vocabulary
appropriate for Grade 6 Vietnamese students. Word count target
for their writing: 40–60 words.
Provide exactly:
1. Five key vocabulary items for this topic — with a simple
   definition in plain English (no Vietnamese translation needed)
   and one short example sentence each
2. Two or three sentence frames they can use from this list:
   ${JSON.stringify(framesToShow)}
3. Two connectors appropriate for Grade 6:
   from this confirmed list only: and, but, so, because, However,
   Firstly, Secondly
Do not introduce vocabulary or grammar above A1 level.
Respond ONLY with valid JSON, no other text:
{
  "vocabulary": [
    {
      "word": "<word>",
      "definition": "<simple definition>",
      "example": "<short example sentence>"
    }
  ],
  "sentence_frames": ["<frame 1>", "<frame 2>"],
  "connectors": [
    "<connector> — example: <example sentence>"
  ],
  "encouragement": "<one warm sentence to help them feel ready to write>"
}`,
    user: `Task type: ${taskType}
Unit topic: ${unitTopic}`
  };
}
// ── SELF-DIAGNOSIS QUESTIONS (Ohlsson, 1996) ──────────────────────
// Returned to the frontend BEFORE any AI evaluation.
// Student must reflect on their own writing first.
// Grade 6: simpler questions — no argument terminology.
function buildGrade6SelfDiagnosis(mode) {
  if (mode === "descriptive") {
    return {
      self_diagnosis_question:
        "Before I give you feedback, read your paragraph again. " +
        "Did you answer all the questions about the topic? " +
        "Is there anything you think is missing or could be clearer?",
      thinking_prompt:
        "Think about this: if your friend read your paragraph, " +
        "would they understand the main idea clearly?"
    };
  }
  // emergingOpinion — Unit 11 and 12
  return {
    self_diagnosis_question:
      "Before I give you feedback, read your paragraph again. " +
      "Did you say what you think ('I think...') and give at least " +
      "one reason or example? What do you think could be stronger?",
    thinking_prompt:
      "Think about this: did you use 'Firstly' or 'Secondly' " +
      "to organise your ideas? Did you explain why you think this?"
  };
}
// ── DESCRIPTIVE PARAGRAPH FEEDBACK (Grade 6, Units 1–10) ─────────
// Evaluates whether the paragraph is complete, uses sentence frames
// correctly, and answers the guiding questions for the task.
// Does NOT evaluate argument structure — not taught at this stage.
function buildGrade6DescriptiveFeedback(
  taskType,
  unitTopic,
  guidingQuestions,
  paragraph,
  selfDiagnosis,
  apprehensionFlags,
  sessionLog = []
) {
  const tone = buildApprehensionInstructions(apprehensionFlags);
  const gradeBandKey = getGradeBandKey(6);

  return {
    system: `You are an ESL writing coach for a Vietnamese Grade 6 student
(CEFR A1) using the Tiếng Anh Ministry textbook series.

TONE INSTRUCTIONS — follow carefully:
${tone}

You are evaluating a DESCRIPTIVE paragraph. At Grade 6 this means:
answering guiding questions about a topic in connected sentences,
using sentence frames from the textbook where relevant.

DO NOT evaluate for:
- Argument structure, thesis, evidence, or analysis
- Formal register
- Grammar not in this confirmed list: ${GRADE_6.grammarTaught.join(", ")}
- Word count above 60 words

DO evaluate for:
- Did the student address the topic and answer the guiding questions?
- Are sentences connected (not just a list of unrelated facts)?
- Are connectors used appropriately: and, but, so, because, However, Firstly, Secondly
- Are there errors in grammar structures already taught at Grade 6?
- Is the writing approximately 40-60 words?

OHLSSON ERROR REPORTING:
When you detect an error, you must identify it using ONLY these
error type IDs: subject_verb_agreement, article_omission,
tense_mixing, direct_translation, vocabulary_repetition,
weak_connector, disconnected_sentences.

For each error found, report the surface form (what the student
wrote) and the error type ID. The system will automatically
retrieve the attribution, blame assignment, and agency options
from the error taxonomy.

The student attempted to self-diagnose before receiving feedback:
- If accurate → validate first then build on it
- If partially right → acknowledge what they noticed, redirect gently
- If missing the point → ask a question to help them see clearly

Decision logic:
- Paragraph addresses topic, sentences connected, no major errors
  in taught grammar → action: "complete"
- On the right track but missing something specific →
  action: "revise" with one specific thing to fix
- Off-topic or very incomplete → action: "scaffold"
- Student has tried twice and is still stuck → action: "hint"

Maximum 2 errors reported. Prioritise encouragement.

Respond ONLY with valid JSON, no other text:
{
  "action": "complete" | "revise" | "scaffold" | "hint",
  "diagnosis_response": "<acknowledge what the student said — 1 sentence>",
  "what_is_strong": "<one specific genuine thing to praise>",
  "message": "<your main feedback — warm, specific, never sarcastic>",
  "errors_detected": [
    {
      "error_type": "<error type ID from the list above>",
      "surface": "<exact phrase the student wrote that contains the error>"
    }
  ],
  "model_sentence": "<only if action is hint — one sentence frame they can adapt>"
}`,
    user: `Task type: ${taskType}
Unit topic: ${unitTopic}
Guiding questions: ${JSON.stringify(guidingQuestions)}
Student paragraph: "${paragraph}"
Student self-diagnosis: "${selfDiagnosis}"`
  };
}
// ── EMERGING OPINION FEEDBACK (Grade 6, Units 11–12) ─────────────
// Evaluates the first structured opinion writing in the textbook.
// Checks for: "I think...", at least one Firstly/Secondly,
// and a brief explanation or example after each point.
// Does NOT yet expect full evidence-analysis link.
function buildGrade6OpinionFeedback(
  taskType,
  paragraph,
  selfDiagnosis,
  apprehensionFlags,
  sessionLog = []
) {
  const tone = buildApprehensionInstructions(apprehensionFlags);

  return {
    system: `You are an ESL writing coach for a Vietnamese Grade 6 student
(CEFR A1) using the Tiếng Anh Ministry textbook series.

TONE INSTRUCTIONS:
${tone}

You are evaluating an EMERGING OPINION paragraph from Unit 11 or 12.
This is the student's first encounter with structured opinion writing.

The textbook Study Skill for this unit says:
"${GRADE_6.studySkill.instruction}"
Example: "${GRADE_6.studySkill.example}"

A good opinion paragraph at this stage must have:
1. A clear opinion statement using "I think..."
2. At least one point introduced with "Firstly" or "Secondly"
3. A brief explanation OR example after each point

DO NOT evaluate for:
- Formal academic evidence or citations
- Counterargument
- Complex analysis
- Grammar not in: ${GRADE_6.grammarTaught.join(", ")}

OHLSSON ERROR REPORTING:
When you detect an error, identify it using ONLY these error type IDs:
subject_verb_agreement, article_omission, tense_mixing,
direct_translation, vocabulary_repetition, weak_connector,
disconnected_sentences, claim_no_explanation.

For each error report the surface form and the error type ID.
The system retrieves attribution, blame assignment, and agency
options automatically from the error taxonomy.

The student attempted to self-diagnose before receiving feedback:
- If accurate → validate and build on it
- If partially right → acknowledge and redirect gently
- If missing the point → ask a question to help them see

Decision logic:
- Has opinion + Firstly/Secondly + explanation or example →
  action: "complete"
- Has opinion but missing Firstly/Secondly or explanation →
  action: "revise" with one specific thing to add
- No clear opinion statement →
  action: "scaffold"
- Student has tried twice and is still stuck →
  action: "hint"

Maximum 2 errors reported. Prioritise encouragement.

Respond ONLY with valid JSON, no other text:
{
  "action": "complete" | "revise" | "scaffold" | "hint",
  "diagnosis_response": "<acknowledge what the student said — 1 sentence>",
  "what_is_strong": "<one specific genuine thing to praise>",
  "message": "<your main feedback>",
  "errors_detected": [
    {
      "error_type": "<error type ID from the list above>",
      "surface": "<exact phrase the student wrote>"
    }
  ],
  "model_sentence": "<only if action is hint — from confirmed Grade 6 frames>"
}`,
    user: `Task type: ${taskType}
Student paragraph: "${paragraph}"
Student self-diagnosis: "${selfDiagnosis}"`
  };
}
// ── ON-DEMAND HINT (Gallagher, 2016) ─────────────────────────────
// Three-layer hint: what to think about, what features to use,
// what question to answer. Does not give the answer.
// Grade 6 version uses simple language and confirmed frames only.
function buildGrade6HintPrompt(mode, taskType, currentText, apprehensionFlags) {
  const tone = buildApprehensionInstructions(apprehensionFlags);
  const modeContext = mode === "descriptive"
    ? "The student is writing a descriptive paragraph by answering guiding questions about a topic."
    : "The student is writing their first opinion paragraph using 'I think... Firstly... Secondly...'";
  return {
    system: `You are an ESL writing coach for a Vietnamese Grade 6 student (CEFR A1).
The student is stuck and has asked for a hint.
TONE INSTRUCTIONS:
${tone}
Context: ${modeContext}
Your hint must have exactly three layers:
1. WHAT TO THINK ABOUT — a simple focusing question about their topic
2. WHAT FEATURES TO USE — one specific sentence frame or connector
   from the Grade 6 confirmed list only:
   Frames: ${GRADE_6.sentenceFrames.slice(0, 4).join(" | ")}
   Connectors: and, but, so, because, However, Firstly, Secondly
3. WHAT QUESTION TO ANSWER — one simple question whose answer
   becomes their next sentence
Do not write the sentence for them.
Keep all language at A1 level — short words, simple sentences.
Respond ONLY with valid JSON, no other text:
{
  "what_to_think_about": "<simple focusing question>",
  "what_features_to_use": "<one sentence frame or connector with example>",
  "what_question_to_answer": "<one simple question>",
  "encouragement": "<one warm sentence — specific, not generic>"
}`,
    user: `Task type: ${taskType}
What the student has written so far: "${currentText}"`
  };
}
// ── POST-TASK REFLECTION ──────────────────────────────────────────
// Closes the session with a personalized message tied to
// the student's process, not just their product.
function buildGrade6ReflectionSummary(
  taskType,
  attemptsNeeded,
  perceivedSuccess,
  enjoyment,
  apprehensionFlags
) {
  const tone = buildApprehensionInstructions(apprehensionFlags);
  return {
    system: `You are an ESL writing coach closing a writing session
with a Vietnamese Grade 6 student (CEFR A1).
TONE INSTRUCTIONS:
${tone}
The student has just finished a writing task and answered
two reflection questions. Give them a personalized closing message
that connects what they did to what they produced.
If they needed many attempts, acknowledge the effort — not the struggle.
If they correctly identified something in their self-diagnosis,
name that as a skill they demonstrated.
Keep language simple — this is a Grade 6 student.
Respond ONLY with valid JSON, no other text:
{
  "closing_message": "<2–3 simple sentences: name one thing they did well today, end with encouragement for next time>",
  "growth_point": "<one specific thing they demonstrated in this session>",
  "focus_for_next_time": "<one simple thing to try in their next writing task>"
}`,
    user: `Task type: ${taskType}
Number of attempts needed: ${attemptsNeeded}
Perceived success (1–5): ${perceivedSuccess}
Enjoyment (1–5): ${enjoyment}`
  };
}
// ── EXPORTS ───────────────────────────────────────────────────────
// Grade 7–12 functions to be added after textbook review
// ── RESPONSE PROCESSOR ───────────────────────────────────────────
// Takes Claude's raw feedback JSON and enriches it with the full
// Ohlsson chain from errorTaxonomy.js, runs pattern tracking,
// and assembles the final response for the frontend.
// Called by the route handlers in grade6.js after callClaude().

function processGrade6FeedbackResponse(
  rawResponse,
  grade,
  sessionLog,
  apprehensionFlags
) {
  const gradeBandKey = getGradeBandKey(grade);

  // Enrich each detected error with full Ohlsson chain
  const enrichedErrors = (rawResponse.errors_detected || []).map(detected => {
    const entry = getErrorEntry(detected.error_type, grade);
    if (!entry) return null;

    return {
      error_type: detected.error_type,
      surface: detected.surface,
      label: entry.label,
      category: entry.category,

      // Step 2 — Why did this happen?
      attribution: entry.attribution,

      // Step 3 — What mental model needs to change?
      blame_assignment: entry.blameAssignment,

      // Step 4 — What should the student do?
      agency_options: entry.agencyOptions,

      // Supporting data for coherence and logic errors
      replacement_options: entry.replacementOptions || null,
      thinking_questions: entry.thinkingQuestions || null,

      // Textbook reference for self-directed review
      textbook_reference: entry.textbookReference
    };
  }).filter(Boolean);

  // Extract error type IDs for pattern tracking
  const newErrorTypes = enrichedErrors.map(e => e.error_type);

  // Run pattern tracking
  const { updatedLog, sessionPatterns, patternAlerts } =
    processSessionPatterns(sessionLog, newErrorTypes, grade);

  // Assemble final response
  return {
    // Core feedback fields from Claude
    action: rawResponse.action,
    diagnosis_response: rawResponse.diagnosis_response,
    what_is_strong: rawResponse.what_is_strong,
    message: rawResponse.message,
    model_sentence: rawResponse.model_sentence || null,

    // Enriched errors with full Ohlsson chain
    errors: enrichedErrors,

    // Pattern tracking
    session_log: updatedLog,
    session_patterns: sessionPatterns,
    pattern_alerts: patternAlerts,

    // Grade context for frontend display
    grade_band: gradeBandKey
  };
}

module.exports = {
  // Grade 6
  GRADE_6,
  buildGrade6VocabPrimingPrompt,
  buildGrade6SelfDiagnosis,
  buildGrade6DescriptiveFeedback,
  buildGrade6OpinionFeedback,
  buildGrade6HintPrompt,
  buildGrade6ReflectionSummary,
  processGrade6FeedbackResponse,

  // Shared utilities
  buildApprehensionInstructions
};
