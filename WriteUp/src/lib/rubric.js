// rubric.js
// Writing rubric for WriteUp ITS — Vietnamese ESL Grades 6–12
// Sources: MoET 2018 GEEC (VNFLPF Levels 1–3) + Cambridge CEFR Writing Descriptors

const RUBRIC = {
  "6-7": {
    cefr: "A1",
    vnflpf: "Level 1",
    criteria: {
      taskAchievement: {
        descriptor: "Student attempts to communicate simple, concrete ideas about a familiar topic. A recognisable topic sentence and at least one supporting idea are sufficient.",
        commonWeaknesses: [
          "Topic sentence is missing or does not match the paragraph body",
          "Only one sentence written — paragraph is not developed",
          "Student writes about a different topic than assigned"
        ],
        notExpected: [
          "Sophisticated argumentation or multi-point development",
          "Formal academic register",
          "Use of complex discourse markers"
        ],
        feedbackFocus: [
          "Does the paragraph have a topic sentence?",
          "Does the student stay on topic?",
          "Is there at least one supporting idea, however simple?"
        ]
      },
      coherenceAndCohesion: {
        descriptor: "Ideas are connected using basic high-frequency linking words such as 'and', 'but', 'because', 'so'. Sentences do not need to flow smoothly — simple sequential connection is enough.",
        commonWeaknesses: [
          "No linking words used — sentences are isolated",
          "Overuse of 'and' to connect every clause",
          "Abrupt ending with no concluding sentence"
        ],
        notExpected: [
          "Variety of cohesive devices",
          "Topic sentence + body + conclusion structure",
          "Paragraph-level organisation beyond basic sequencing"
        ],
        feedbackFocus: [
          "Are sentences connected with at least basic linking words?",
          "Can the reader follow the order of ideas?"
        ]
      },
      vocabularyRange: {
        descriptor: "Student uses basic, high-frequency words related to the topic. Words from the Grade 6–7 unit vocabulary list are appropriate and sufficient.",
        commonWeaknesses: [
          "Vocabulary is too vague (e.g. 'good', 'nice', 'thing') without elaboration",
          "Direct Vietnamese-to-English word-for-word translation producing unnatural phrases",
          "Repeating the same word or phrase in every sentence"
        ],
        notExpected: [
          "Less common or academic vocabulary",
          "Idiomatic expressions",
          "Precise topic-specific terminology"
        ],
        feedbackFocus: [
          "Does the student use topic-relevant vocabulary from the unit?",
          "Is meaning clear despite limited vocabulary range?"
        ]
      },
      grammaticalAccuracy: {
        descriptor: "Student uses simple present tense and basic sentence structures with some degree of control. Errors are expected and do not need to be exhaustively corrected — focus on errors that block meaning.",
        commonWeaknesses: [
          "Missing subject or verb in a sentence",
          "Confusion between present simple and present continuous",
          "No plural -s on countable nouns",
          "Missing 'a/an/the' articles"
        ],
        notExpected: [
          "Control of complex or compound sentences",
          "Accurate use of past or future tenses",
          "Error-free writing"
        ],
        feedbackFocus: [
          "Does every sentence have a subject and verb?",
          "Are meaning-blocking errors addressed first?",
          "Limit grammar feedback to 1–2 patterns per response"
        ]
      }
    }
  },

  "8-9": {
    cefr: "A2",
    vnflpf: "Level 2",
    criteria: {
      taskAchievement: {
        descriptor: "Student communicates straightforward ideas on a familiar topic with a clear topic sentence, two or more supporting points, and a simple concluding sentence.",
        commonWeaknesses: [
          "Topic sentence is too general or just restates the title",
          "Supporting ideas listed without explanation or example",
          "Conclusion simply repeats the topic sentence word-for-word"
        ],
        notExpected: [
          "Sophisticated analysis or evaluation",
          "Use of abstract or hypothetical reasoning",
          "More than 3–4 supporting points"
        ],
        feedbackFocus: [
          "Is the topic sentence specific and on-task?",
          "Does each supporting point include a brief explanation or example?",
          "Is there a concluding sentence that does not just repeat the opening?"
        ]
      },
      coherenceAndCohesion: {
        descriptor: "Text is connected using basic linking words and a small range of cohesive devices such as 'first', 'also', 'however', 'in conclusion'. The paragraph should read as connected text, not a list.",
        commonWeaknesses: [
          "All sentences start with 'I' or the same subject",
          "Linking words used incorrectly (e.g. 'although' used like 'because')",
          "Ideas presented as a numbered list rather than flowing prose"
        ],
        notExpected: [
          "Sophisticated cohesive devices (e.g. reference chains, ellipsis)",
          "Varied sentence openings throughout",
          "Academic discourse structure"
        ],
        feedbackFocus: [
          "Are discourse markers used to signal sequence or contrast?",
          "Does the paragraph read as connected prose?"
        ]
      },
      vocabularyRange: {
        descriptor: "Student uses everyday vocabulary appropriately and attempts some unit-specific topic words. Occasional misuse of less common words is expected.",
        commonWeaknesses: [
          "Overuse of very basic words when topic vocabulary has been taught (e.g. 'good' instead of 'beneficial')",
          "Incorrect collocation (e.g. 'do a mistake')",
          "Mixing Vietnamese sentence structure into English phrases"
        ],
        notExpected: [
          "Precise academic vocabulary",
          "Idiomatic native-speaker expressions",
          "Consistent use of topic-specific collocations"
        ],
        feedbackFocus: [
          "Does the student use topic vocabulary from the unit?",
          "Are there clear word choice errors that affect meaning?"
        ]
      },
      grammaticalAccuracy: {
        descriptor: "Student uses a range of simple grammatical forms with reasonable control. Some compound sentences expected. Errors should not prevent the reader from understanding meaning.",
        commonWeaknesses: [
          "Incorrect verb tense for the task (e.g. using present when the task needs past)",
          "Subject-verb agreement errors with third person singular",
          "Run-on sentences joined only with commas",
          "Incorrect use of comparative adjectives"
        ],
        notExpected: [
          "Control of complex sentences with relative clauses",
          "Accurate use of conditionals",
          "Error-free writing"
        ],
        feedbackFocus: [
          "Is the verb tense appropriate for the task?",
          "Are there repeated grammar patterns that block understanding?",
          "Limit grammar feedback to 2 patterns per response"
        ]
      }
    }
  },

  "10-11": {
    cefr: "B1",
    vnflpf: "Level 3",
    criteria: {
      taskAchievement: {
        descriptor: "Student produces a clearly structured paragraph with a focused topic sentence, developed supporting points with explanation and examples, and a meaningful conclusion. Ideas should be relevant and reasonably elaborated.",
        commonWeaknesses: [
          "Supporting points mentioned but not explained or exemplified",
          "Paragraph goes off-topic in the body",
          "Conclusion introduces a new idea instead of summarising"
        ],
        notExpected: [
          "University-level argument structure",
          "Counter-argument and rebuttal",
          "Sustained analytical reasoning"
        ],
        feedbackFocus: [
          "Is each supporting point developed with explanation or example?",
          "Does the paragraph stay focused on the topic sentence claim?",
          "Does the conclusion meaningfully close the paragraph?"
        ]
      },
      coherenceAndCohesion: {
        descriptor: "Text is well-connected using a variety of linking words and basic cohesive devices. The reader should be able to follow the argument without re-reading.",
        commonWeaknesses: [
          "Overuse of one linking word (e.g. 'moreover' repeated every sentence)",
          "Pronoun reference unclear (e.g. 'it' or 'they' without clear antecedent)",
          "Abrupt transitions between supporting points"
        ],
        notExpected: [
          "Sophisticated reference chains or ellipsis",
          "Varied paragraph-opening strategies",
          "Essay-level cohesion"
        ],
        feedbackFocus: [
          "Is there variety in the linking devices used?",
          "Are transitions between ideas smooth and logical?"
        ]
      },
      vocabularyRange: {
        descriptor: "Student uses a range of everyday vocabulary with some less common words appropriate to the topic. Word choice should be generally accurate, with only occasional inappropriate use.",
        commonWeaknesses: [
          "Relying on a small set of basic words when more precise vocabulary is appropriate",
          "Incorrect word form (e.g. using noun where adjective is needed)",
          "Vocabulary too informal for written academic tasks"
        ],
        notExpected: [
          "Consistent use of sophisticated or academic word lists",
          "Native-speaker collocational precision",
          "Metaphorical or figurative language"
        ],
        feedbackFocus: [
          "Are there opportunities to use more precise vocabulary from the unit?",
          "Are there word form errors that affect clarity?"
        ]
      },
      grammaticalAccuracy: {
        descriptor: "Student uses simple and some complex grammatical forms with good control. Errors are present but do not impede communication. Compound and some complex sentences expected.",
        commonWeaknesses: [
          "Incorrect conditional sentence construction",
          "Passive voice used incorrectly or unnecessarily",
          "Relative clause errors (e.g. missing relative pronoun)",
          "Tense inconsistency within the paragraph"
        ],
        notExpected: [
          "Mastery of all complex sentence types",
          "Error-free academic writing",
          "Consistent control of advanced grammar structures"
        ],
        feedbackFocus: [
          "Are complex sentences constructed accurately?",
          "Is tense consistent throughout?",
          "Prioritise patterns that recur or block meaning"
        ]
      }
    }
  },

  "12": {
    cefr: "B1+",
    vnflpf: "Level 3 (upper)",
    criteria: {
      taskAchievement: {
        descriptor: "Student produces a well-developed paragraph with a precise topic sentence, multiple elaborated supporting points, and a conclusion that synthesises or evaluates rather than just repeats. The paragraph should demonstrate awareness of audience and purpose.",
        commonWeaknesses: [
          "Topic sentence is a general statement rather than a focused claim",
          "Supporting points lack depth — stated but not argued",
          "Conclusion is formulaic or adds nothing to the paragraph"
        ],
        notExpected: [
          "IELTS-band-7 sophistication",
          "Academic essay conventions",
          "Original research or data citation"
        ],
        feedbackFocus: [
          "Is the topic sentence a focused, arguable claim?",
          "Are supporting points elaborated with reasoning or evidence?",
          "Does the conclusion add value beyond repetition?"
        ]
      },
      coherenceAndCohesion: {
        descriptor: "Text is well-organised and coherent with a variety of cohesive devices used effectively. Transitions should feel natural rather than mechanical.",
        commonWeaknesses: [
          "Mechanical overuse of discourse markers (e.g. every sentence starts with 'Firstly', 'Secondly', 'Thirdly')",
          "Inconsistent paragraph logic — ideas that contradict each other",
          "Weak topic sentence that does not control the paragraph"
        ],
        notExpected: [
          "Essay-level macro-structure",
          "Sophisticated hedging language",
          "Academic rhetorical strategies"
        ],
        feedbackFocus: [
          "Do cohesive devices feel natural or mechanical?",
          "Is the overall paragraph logic consistent and clear?"
        ]
      },
      vocabularyRange: {
        descriptor: "Student uses a range of vocabulary including some less common lexis appropriately. Word choice should be precise and appropriate for formal written English.",
        commonWeaknesses: [
          "Informal register in formal writing tasks",
          "Repeated miscollocations (e.g. 'make pollution', 'strong problem')",
          "Over-reliance on a small vocabulary set"
        ],
        notExpected: [
          "C1-level academic word list mastery",
          "Native-speaker collocational precision across all word types",
          "Idiomatic expression"
        ],
        feedbackFocus: [
          "Are there significant collocation or register errors?",
          "Can any basic vocabulary be upgraded to more precise choices?"
        ]
      },
      grammaticalAccuracy: {
        descriptor: "Student uses a range of simple and complex grammatical forms with control and flexibility. Occasional errors are expected but should not impede communication.",
        commonWeaknesses: [
          "Complex sentences with multiple errors in one clause",
          "Inconsistent voice (active/passive) within the same paragraph",
          "Errors in high-stakes structures (conditionals, reported speech)",
          "Punctuation errors in complex sentences"
        ],
        notExpected: [
          "Complete grammatical accuracy",
          "Mastery of all B2-level grammar structures",
          "Formal academic grammar conventions"
        ],
        feedbackFocus: [
          "Are complex sentences largely accurate?",
          "Are there patterns of recurring errors that should be addressed?",
          "Is grammar control sufficient for the communicative task?"
        ]
      }
    }
  }
}

module.exports = { RUBRIC }
