// ================================================================
// WriteUp — src/lib/grade8Data.js
// Grade 8 curriculum data — confirmed from Tiếng Anh 8
// Global Success series (Pearson / Ministry of Education)
// All parameters derived from textbook writing pages only.
// CEFR: A2
// ================================================================

const GRADE_8 = {
  cefr: "A2",
  cefr_note:
    "A2 per Ministry curriculum. First grade with formal opinion " +
    "paragraph requiring a clear position statement and numbered reasons.",
  wordCount: "80–100 words",

  // ── WRITING MODES ──────────────────────────────────────────────

  modes: {

    descriptive: {
      units: "1, 4, 5, 9, 12",
      description:
        "Descriptive, narrative, or instructional paragraph. " +
        "Scaffold is a notes table or guiding questions. " +
        "No argument structure required.",
      taskTypes: [
        "informal email",
        "descriptive paragraph",
        "advice email with dos and don'ts",
        "instructional paragraph",
        "creative descriptive paragraph"
      ]
    },

    advantagesDisadvantages: {
      units: "2, 6, 8, 10",
      description:
        "Opinion paragraph arguing one side of an advantages/disadvantages " +
        "topic. Student brainstorms both sides using a table, then " +
        "writes a paragraph arguing one side only using Firstly/Secondly. " +
        "No counterargument required — student picks one side and develops it.",
      taskTypes: [
        "advantages paragraph",
        "disadvantages paragraph",
        "like/dislike paragraph"
      ],
      confirmedStarters: [
        "There are some things I like / dislike about life in the countryside.",
        "Shopping ... is interesting / convenient / safe / ...",
        "Firstly, ...",
        "Secondly, ..."
      ],
      scaffold: "Two-column table: Advantages / Disadvantages or Like / Dislike"
    },

    agreeDisagree: {
      units: "3, 11",
      description:
        "Formal opinion paragraph. Student fills in an Agree/Disagree " +
        "table brainstorming both sides, then takes one position and " +
        "argues it with numbered reasons. First appearance of a formal " +
        "position statement in the series. No counterargument in the " +
        "paragraph itself — both sides are explored in the planning stage only.",
      taskTypes: [
        "agree/disagree paragraph",
        "cause and solution paragraph"
      ],
      confirmedStarters: [
        "I agree / disagree that robots will soon replace teachers at school. First, they ...",
        "I often feel stressed because of __ and here are the ways I deal with my stress."
      ],
      scaffold: "Agree/Disagree table — brainstorm both sides, write one",
      significance:
        "This is the entry point for the 3-stage argumentative cycle. " +
        "Stage 1: position statement with I agree/disagree. " +
        "Stage 2: reasons with First/Secondly. " +
        "Stage 3: analytical link connecting each reason back to the position — " +
        "this is what the system teaches at Grade 8."
    },

    noticeWriting: {
      units: "7",
      description:
        "Notice or announcement writing. New genre at Grade 8. " +
        "Must be brief and contain all necessary details: " +
        "institution name, date, body, contact details, author signature.",
      taskTypes: ["notice", "announcement"],
      writingTip:
        "A notice can be an announcement, a warning, or an invitation. " +
        "A notice should be brief but contain all the necessary details.",
      requiredParts: [
        "Name of institution or organisation",
        "Date of writing",
        "Body (date, time, duration, place)",
        "Contact details",
        "Author name and signature"
      ]
    }
  },

  // ── CONFIRMED WRITING TASKS BY UNIT ────────────────────────────

  unitTasks: {
    1:  { topic: "Leisure Time",               task: "Email to penfriend about free time activities",         mode: "descriptive",           starter: "Hi __, It's nice to hear from you again. Let me tell you about..." },
    2:  { topic: "Life in the Countryside",    task: "Opinion paragraph: like or dislike countryside life",   mode: "advantagesDisadvantages", starter: "There are some things I like / dislike about life in the countryside." },
    3:  { topic: "Teenagers",                  task: "Cause and solution paragraph about stress",             mode: "agreeDisagree",          starter: "I often feel stressed because of __ and here are the ways I deal with my stress." },
    4:  { topic: "Ethnic Groups of Viet Nam",  task: "Descriptive paragraph about helping your family",       mode: "descriptive",            starter: null },
    5:  { topic: "Our Customs and Traditions", task: "Advice email about festival dos and don'ts",            mode: "descriptive",            starter: "Dear Tom," },
    6:  { topic: "Lifestyles",                 task: "Advantages OR disadvantages of online learning",        mode: "advantagesDisadvantages", starter: null },
    7:  { topic: "Environmental Protection",   task: "Notice about a school writing contest",                 mode: "noticeWriting",          starter: null },
    8:  { topic: "Shopping",                   task: "Advantages OR disadvantages of a type of shopping",     mode: "advantagesDisadvantages", starter: "Shopping ... is interesting / convenient / safe / ... Firstly, ... Secondly, ..." },
    9:  { topic: "Natural Disasters",          task: "Instructions: things to do before, during, after flood", mode: "descriptive",           starter: "Here are the things you should do before, during, and after a flood. Before: ... During: ... After: ..." },
    10: { topic: "Communication in the Future", task: "Descriptive paragraph about a modern communication tool", mode: "advantagesDisadvantages", starter: null },
    11: { topic: "Science and Technology",     task: "Opinion paragraph: agree or disagree about robot teachers", mode: "agreeDisagree",       starter: "I agree / disagree that robots will soon replace teachers at school. First, they ..." },
    12: { topic: "Life on Other Planets",      task: "Descriptive paragraph about imaginary aliens",          mode: "descriptive",            starter: "Creatures living on __ are called __" }
  },

  // ── CONFIRMED CONNECTORS ────────────────────────────────────────

  connectors: {
    sequence:    ["Firstly", "Secondly", "Finally", "First", "Then"],
    addition:    ["In addition", "Also", "Moreover"],
    contrast:    ["However", "Although", "but"],
    reason:      ["because", "because of", "since", "as"],
    result:      ["so", "therefore", "as a result"],
    opinion:     ["I think", "I believe", "In my opinion", "I agree", "I disagree"]
  },

  // ── CONFIRMED GRAMMAR TAUGHT ────────────────────────────────────

  grammarTaught: [
    "present simple and continuous",
    "past simple and past continuous",
    "present perfect",
    "future simple and be going to",
    "passive voice — present and past simple",
    "reported speech",
    "relative clauses (who, which, that)",
    "conditional sentences type 1 and type 2",
    "modal verbs — can, could, should, must, might, need",
    "gerunds and infinitives",
    "comparatives and superlatives",
    "articles — a, an, the"
  ],

  // ── CONFIRMED VOCABULARY TOPICS ─────────────────────────────────

  vocabularyTopics: [
    "leisure activities and hobbies",
    "rural and urban life",
    "teenage problems and solutions",
    "ethnic minority groups and traditions",
    "customs, traditions and festivals",
    "modern lifestyles and technology",
    "environmental protection and pollution",
    "shopping types and habits",
    "natural disasters and emergency response",
    "modern communication tools",
    "science, technology and inventions",
    "space and life on other planets"
  ],

  // ── WHAT GRADE 8 DOES NOT EXPECT ────────────────────────────────

  notExpected: [
    "counterargument in the paragraph body",
    "formal academic evidence with citations",
    "topic sentence + evidence + analysis structure in full",
    "academic register (Nevertheless, Furthermore, Consequently)",
    "discursive essay structure",
    "THPT exam-style writing"
  ],

  // ── KEY ADVANCES FROM GRADE 7 ───────────────────────────────────

  advancesFromGrade7: [
    "Word count increases from ~70 to 80–100 words",
    "First formal position statement: 'I agree/disagree that...'",
    "First Agree/Disagree planning table — student sees both sides before writing",
    "Advantages/disadvantages writing formalised with Firstly/Secondly structure",
    "Notice writing introduced as a new genre (Unit 7)",
    "Cause-and-solution structure introduced (Unit 3)",
    "Four-part outline for descriptive paragraph (Unit 10: What? Advantages? Disadvantages? Future?)"
  ],

  // ── 3-STAGE CYCLE ENTRY POINT ───────────────────────────────────
  // Grade 8 is where the argumentative cycle begins in WriteUp.
  // Confirmed from Unit 11 (agree/disagree) and Units 6/8 (advantages/disadvantages).

  threeStageEntry: {
    stage1: {
      name: "Position statement",
      confirmedForm: "I agree / disagree that [claim]. First, they...",
      evaluationCriteria:
        "Does the sentence state a clear position (agree or disagree)? " +
        "Does it preview that reasons will follow?"
    },
    stage2: {
      name: "Reasons with Firstly/Secondly",
      confirmedForm: "Firstly, ... Secondly, ...",
      evaluationCriteria:
        "Is each reason specific? Does it directly support the position? " +
        "Is it introduced with Firstly/Secondly?"
    },
    stage3: {
      name: "Analytical link",
      confirmedForm: "This shows that... / This means that... / Therefore...",
      evaluationCriteria:
        "Does the student explain HOW each reason supports the position? " +
        "This is the most commonly missing element at Grade 8 — " +
        "students give reasons but do not connect them back to the claim."
    }
  },

  // ── FEEDBACK TONE CALIBRATION ───────────────────────────────────

  feedbackTone: {
    maxCorrections: 3,
    priority:
      "Check position statement first — if the student has not taken " +
      "a clear position, everything else is premature. " +
      "Then check that reasons are specific. " +
      "Then check analytical links.",
    approach:
      "More demanding than Grade 7 — students are expected to argue a " +
      "position with reasons. If reasons are given but not explained, " +
      "that is the primary feedback focus. " +
      "Only flag grammar errors in structures from grammarTaught list."
  }
};

module.exports = { GRADE_8 };
