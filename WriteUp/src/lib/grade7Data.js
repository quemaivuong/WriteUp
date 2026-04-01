// ================================================================
// WriteUp — src/lib/grade7Data.js
// Grade 7 curriculum data — confirmed from Tiếng Anh 7
// Global Success series (Pearson / Ministry of Education)
// All parameters derived from textbook writing pages only.
// CEFR: A1 (late — moving toward A2 by Unit 11)
// ================================================================

const GRADE_7 = {
  cefr: "A1",
  cefr_note: "Late A1 moving toward A2 by Unit 11. Officially A1 per Ministry curriculum.",
  wordCount: "~70 words",

  // ── WRITING MODES ──────────────────────────────────────────────
  // Three distinct modes confirmed from textbook writing pages.
  // Mode is determined by unit number when student selects a task.

  modes: {

    descriptive: {
      units: "1, 2, 3, 5, 6, 8, 9, 12",
      description:
        "Descriptive, narrative, or informational paragraph. " +
        "More independent than Grade 6 — scaffolds are note tables " +
        "and guiding questions, not sentence frames. " +
        "Student organises content themselves.",
      taskTypes: [
        "descriptive paragraph",
        "informal email",
        "informal letter",
        "diary entry"
      ],
      scaffoldType: "notes table or guiding questions",
      writingTips: [
        "Use a mind map to organise your ideas before writing (Unit 1)",
        "For informal letters of invitation use: Let's... / How about + V-ing? (Unit 4)"
      ]
    },

    problemSolution: {
      units: "7",
      description:
        "Problem-solution paragraph. First time in the textbook " +
        "that an explicit paragraph outline is provided. " +
        "Student follows: Introduction → Problem 1 → Problem 2 → " +
        "Conclusion with reason or suggestion.",
      taskTypes: [
        "problem-solution paragraph"
      ],
      scaffoldType: "explicit paragraph outline",
      outline: [
        "Introduction",
        "Problem 1",
        "Problem 2",
        "Conclusion: reason or suggestion"
      ],
      significance:
        "First explicit paragraph structure in the series. " +
        "Students plan before they write for the first time."
    },

    opinionAdvantages: {
      units: "10, 11",
      description:
        "Opinion paragraph extended with advantages structure. " +
        "Builds on Grade 6 'I think... Firstly... Secondly...' " +
        "by adding 'because it has many advantages. First,...' " +
        "Student must now give reasons, not just preferences.",
      taskTypes: [
        "opinion paragraph with advantages"
      ],
      scaffoldType: "advantages table + sentence starter",
      confirmedStarter:
        "I think people will like travelling by __ because it has " +
        "many advantages. First, ...",
      significance:
        "Bridge to argumentative writing at Grade 8. " +
        "First time 'because' is used to introduce a list of reasons."
    }
  },

  // ── CONFIRMED WRITING TASKS BY UNIT ────────────────────────────
  // Source: writing pages from all 12 units

  unitTasks: {
    1:  { topic: "Hobbies",                    task: "Paragraph about your hobby",                    mode: "descriptive",       starter: "My hobby is..." },
    2:  { topic: "Healthy Living",             task: "Passage giving advice on avoiding viruses",     mode: "descriptive",       starter: null },
    3:  { topic: "Community Service",          task: "Email about school activities last summer",     mode: "descriptive",       starter: "Dear Tom, Things are good. We also did some interesting activities last summer." },
    4:  { topic: "Music and Arts",             task: "Informal letter of invitation",                 mode: "descriptive",       starter: "Hi __, Let's..." },
    5:  { topic: "Food and Drink",             task: "Paragraph about eating habits in your area",   mode: "descriptive",       starter: null },
    6:  { topic: "A Visit to a School",        task: "Paragraph about an outdoor activity",          mode: "descriptive",       starter: null },
    7:  { topic: "Traffic",                    task: "Paragraph about traffic problems in your city", mode: "problemSolution",   starter: null },
    8:  { topic: "Films",                      task: "Paragraph about your favourite film",           mode: "descriptive",       starter: null },
    9:  { topic: "Festivals Around the World", task: "Email about a festival your family celebrates", mode: "descriptive",       starter: "Dear Mark, How are you? I'm going to tell you about..." },
    10: { topic: "Energy Sources",             task: "Paragraph about how you save energy at home",  mode: "opinionAdvantages", starter: "We use a lot of energy at home and it costs us a lot. To save energy, we should..." },
    11: { topic: "Travelling in the Future",   task: "Paragraph about advantages of a transport type", mode: "opinionAdvantages", starter: "I think people will like travelling by __ because it has many advantages. First," },
    12: { topic: "English-speaking Countries", task: "Diary entry about a tour",                      mode: "descriptive",       starter: "First, I went to..." }
  },

  // ── CONFIRMED SENTENCE FRAMES ───────────────────────────────────
  // Only frames that appear explicitly in the textbook writing pages

  sentenceFrames: [
    "My hobby is __. I started __ ago.",
    "Dear __, Things are good. We also did some interesting activities last summer.",
    "Hi __, Let's go to __ on __.",
    "Looking forward to seeing you there. Best, __",
    "We use a lot of energy at home and it costs us a lot. To save energy, we should __.",
    "I think people will like travelling by __ because it has many advantages. First, __",
    "Dear __, How are you? I'm going to tell you about __",
    "I hope one day you can join the festival with us. Cheers, __",
    "First, I went to __."
  ],

  // ── CONFIRMED CONNECTORS ────────────────────────────────────────
  // Confirmed from writing pages and writing tips in the textbook

  connectors: {
    sequence:    ["First", "Then", "After that", "Finally"],
    addition:    ["and", "also"],
    contrast:    ["but", "However"],
    reason:      ["because"],
    coordinating:["and", "but", "so"],
    invitation:  ["Let's...", "How about + V-ing?"]
  },

  // ── CONFIRMED GRAMMAR TAUGHT ────────────────────────────────────
  // Source: Language Focus column from book map + unit grammar sections

  grammarTaught: [
    "present simple",
    "present continuous",
    "past simple",
    "future simple (will)",
    "comparatives and superlatives",
    "should / shouldn't for advice",
    "adverbs of frequency",
    "prepositions of time and place",
    "imperatives",
    "wh-questions",
    "compound sentences with and, but, so",
    "because for reason",
    "Let's + verb for suggestions",
    "How about + V-ing for suggestions"
  ],

  // ── CONFIRMED VOCABULARY TOPICS ─────────────────────────────────

  vocabularyTopics: [
    "hobbies and free time activities",
    "health and healthy habits",
    "community service and volunteer activities",
    "music, arts, and cultural events",
    "food, drink, and eating habits",
    "school life and outdoor activities",
    "traffic and road safety",
    "films and entertainment",
    "festivals and celebrations",
    "energy sources and conservation",
    "future transport and technology",
    "English-speaking countries and travel"
  ],

  // ── WHAT GRADE 7 DOES NOT EXPECT ────────────────────────────────
  // Critical for not over-correcting

  notExpected: [
    "formal academic register",
    "counterargument",
    "evidence with citations",
    "full claim-evidence-analysis structure",
    "topic sentence + 3 body sentences + conclusion structure",
    "complex sentence structures beyond first conditional",
    "academic linkers (Furthermore, Nevertheless, Consequently)"
  ],

  // ── KEY PEDAGOGICAL ADVANCES FROM GRADE 6 ───────────────────────
  // What is new at Grade 7 that was not present at Grade 6

  advancesFromGrade6: [
    "Word count increases from 40-60 to ~70 words",
    "Scaffolds shift from sentence frames to note tables and outlines",
    "First explicit paragraph outline introduced (Unit 7: Introduction, Problem 1, Problem 2, Conclusion)",
    "First use of 'because it has many advantages. First,...' opinion structure (Unit 11)",
    "New task types: informal letter of invitation, diary entry, problem-solution paragraph",
    "Writing tips introduce metacognitive strategies: mind map, genre conventions for letters"
  ],

  // ── FEEDBACK TONE CALIBRATION ───────────────────────────────────

  feedbackTone: {
    maxCorrections: 2,
    priority:
      "Acknowledge structural effort first — if student used the outline " +
      "or organised their notes before writing, name that explicitly. " +
      "Then address language errors.",
    approach:
      "More independent than Grade 6 — do not offer sentence frames. " +
      "If stuck, offer the outline structure or guiding questions instead. " +
      "Only flag grammar errors in structures from grammarTaught list."
  }
};

module.exports = { GRADE_7 };
