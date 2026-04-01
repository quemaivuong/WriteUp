// ================================================================
// WriteUp — src/lib/errorTaxonomy.js
// Ohlsson (1996) error correction cycle — full taxonomy
// Grade 6-7 confirmed from textbook. Grades 8-12 pending.
// ================================================================

const ERROR_TAXONOMY = {

  subject_verb_agreement: {
    id: "subject_verb_agreement",
    category: "grammar",
    label: "Subject-verb agreement",
    textbookReference: {
      "6-7": "Unit 1 — Present simple, subject-verb agreement",
      "8-9": "PENDING", "10-11": "PENDING", "12": "PENDING"
    },
    attribution: {
      "6-7": "In Vietnamese, verbs do not change form based on the subject. Your brain applied the Vietnamese pattern to English.",
      "8-9": "This often happens in longer sentences where the subject and verb are separated by other words.",
      "10-11": "This often appears after relative clauses that sit between the subject and verb.",
      "12": "This can appear with complex noun phrases where the head noun is not immediately obvious."
    },
    blameAssignment: {
      "6-7": "In English, when the subject is one person or thing (he, she, it, my school), the verb needs an -s ending: has, goes, likes. Ask yourself: is my subject one thing or more than one thing?",
      "8-9": "Find the subject of your sentence — ignore the words in between — and check whether it is singular or plural. Then check whether your verb matches.",
      "10-11": "When a relative clause comes between the subject and verb, go back to the original subject to check agreement.",
      "12": "Identify the head noun of the subject phrase. That is the noun the verb must agree with."
    },
    agencyOptions: {
      "6-7": ["Fix just this verb and resubmit", "Check all verbs in your paragraph for the same pattern"],
      "8-9": ["Fix just this verb and resubmit", "Underline every subject-verb pair and check each one", "Review the grammar reference then fix"],
      "10-11": ["Fix this sentence and resubmit", "Find every relative clause and check the verb after it", "Review subject-verb agreement then fix"],
      "12": ["Fix this instance and resubmit", "Identify all noun phrases with modifiers and check agreement", "Review nominalization and agreement then revise"]
    }
  },

  article_omission: {
    id: "article_omission",
    category: "grammar",
    label: "Missing or incorrect article (a / an / the)",
    textbookReference: {
      "6-7": "Unit 11 — Articles (a, an, the)",
      "8-9": "PENDING", "10-11": "PENDING", "12": "PENDING"
    },
    attribution: {
      "6-7": "Vietnamese does not use articles like a, an, or the. There is no equivalent word in Vietnamese, so the brain often leaves them out when writing in English.",
      "8-9": "Article errors at this level often happen with abstract nouns or when switching between specific and general meaning.",
      "10-11": "This often appears with uncountable nouns or when moving between general statements and specific references.",
      "12": "Article errors at this level often involve generic reference with plural or uncountable nouns in academic writing."
    },
    blameAssignment: {
      "6-7": "In English, most singular countable nouns need a or an the first time you mention them. Use the when you and the reader both know which specific thing you mean.",
      "8-9": "Ask yourself: am I talking about one specific thing the reader knows (use the), introducing something new (use a/an), or making a general statement (no article)?",
      "10-11": "For uncountable nouns in general statements, no article is needed. For specific reference, use the.",
      "12": "In academic writing, generic plural and uncountable nouns take no article. Use the only for specific identifiable reference."
    },
    agencyOptions: {
      "6-7": ["Fix the missing article and resubmit", "Check every noun in your paragraph — does it need a, an, or the?"],
      "8-9": ["Fix this article error and resubmit", "Go through your paragraph and check the article rule for every noun", "Review article rules then revise"],
      "10-11": ["Fix this instance and resubmit", "Find all uncountable and abstract nouns and check articles", "Review article use with uncountable nouns then revise"],
      "12": ["Fix this instance and resubmit", "Review all generic references for article accuracy", "Read your paragraph focusing only on articles — mark every uncertain one"]
    }
  },

  tense_mixing: {
    id: "tense_mixing",
    category: "grammar",
    label: "Inconsistent verb tense",
    textbookReference: {
      "6-7": "Unit 8 — Past simple; Unit 1 — Present simple",
      "8-9": "PENDING", "10-11": "PENDING", "12": "PENDING"
    },
    attribution: {
      "6-7": "When writing about the past, it is easy to slip back into present simple because that is the tense used most often. The brain switches automatically without noticing.",
      "8-9": "Tense mixing often happens at the boundary between background information and a specific event.",
      "10-11": "This can happen when mixing narrative and commentary — past for events, present for significance.",
      "12": "In academic writing this often occurs between reporting verbs (past: the study found) and general statements (present: research shows)."
    },
    blameAssignment: {
      "6-7": "Choose one tense for your paragraph and stay with it. If you are writing about the past, every action verb should be past simple: visited, played, ate — not visit, play, eat.",
      "8-9": "Decide on the main tense before you write. If you switch intentionally, make sure every switch is deliberate.",
      "10-11": "Keep narrative in past tense. Use present simple only for general statements that are still true now.",
      "12": "Use past simple for specific findings. Use present simple for general claims still true today. Be consistent within each sentence."
    },
    agencyOptions: {
      "6-7": ["Fix the verb in the wrong tense and resubmit", "Highlight every verb in your paragraph — check they are all the same tense"],
      "8-9": ["Fix this tense error and resubmit", "Go through every verb and decide: past or present?", "Rewrite the paragraph deciding on one main tense first"],
      "10-11": ["Fix this inconsistency and resubmit", "Label every verb N (narrative past) or G (general present) and check consistency", "Revise with deliberate tense choices throughout"],
      "12": ["Fix this instance and resubmit", "Check all reporting verbs and general claim verbs for consistent tense", "Revise applying academic tense conventions throughout"]
    }
  },

  direct_translation: {
    id: "direct_translation",
    category: "grammar",
    label: "Direct translation from Vietnamese word order",
    textbookReference: {
      "6-7": "Unit 1 — Basic sentence structure: Subject + Verb + Object",
      "8-9": "PENDING", "10-11": "PENDING", "12": "PENDING"
    },
    attribution: {
      "6-7": "This sentence follows Vietnamese word order rather than English. In Vietnamese, adjectives and modifiers often come after the noun, and sentence structure can differ significantly from English.",
      "8-9": "Direct translation errors at this level often involve placing adverbs or time expressions in Vietnamese positions.",
      "10-11": "This appears with complex clause structures where Vietnamese ordering differs from English academic conventions.",
      "12": "At this level it shows in information structure — what comes first in a sentence differs between Vietnamese and English academic writing."
    },
    blameAssignment: {
      "6-7": "In English the basic order is Subject + Verb + Object. Adjectives come BEFORE the noun (a big school — not a school big). Try to think in English patterns.",
      "8-9": "Time expressions in English go at the end or very beginning of a sentence — not in the middle. Check where you placed yours.",
      "10-11": "In English academic writing, the main clause usually comes before subordinate clauses.",
      "12": "English academic writing places the main point early in the sentence. Check whether your sentence buries the main idea at the end."
    },
    agencyOptions: {
      "6-7": ["Rewrite just this sentence in English word order and resubmit", "Read your paragraph aloud and find any other sentences that sound unusual"],
      "8-9": ["Fix this sentence structure and resubmit", "Find any other directly translated sentences and revise", "Rewrite starting from the subject first"],
      "10-11": ["Revise this sentence and resubmit", "Check all complex sentences for Vietnamese-influenced ordering", "Rewrite putting the main clause first"],
      "12": ["Revise this sentence and resubmit", "Check all sentences for front-loading of main information", "Rewrite applying English information structure throughout"]
    }
  },

  vocabulary_repetition: {
    id: "vocabulary_repetition",
    category: "vocabulary",
    label: "Repeated use of the same word",
    textbookReference: {
      "6-7": "Glossary — unit vocabulary lists for synonyms",
      "8-9": "PENDING", "10-11": "PENDING", "12": "PENDING"
    },
    attribution: {
      "6-7": "When focused on getting ideas right, we naturally reach for the first word that comes to mind and use it repeatedly. This means you were focused on your ideas — which is good.",
      "8-9": "Repetition at this level often means the student knows one word for a concept but not its synonyms.",
      "10-11": "Repetition in formal writing often comes from not knowing the academic vocabulary range around a topic.",
      "12": "Repetition signals over-reliance on a small set of high-frequency words rather than precise topic-specific vocabulary."
    },
    blameAssignment: {
      "6-7": "Using the same word many times makes writing feel repetitive. Try to find one other word that means something similar — your unit vocabulary list is a good place to look.",
      "8-9": "Think about what the word means and ask: is there another word that means almost the same thing? Or can you replace it with a phrase?",
      "10-11": "Look for a more specific word from the topic vocabulary in your unit, or use a pronoun or reference word to avoid repetition.",
      "12": "Replace repeated words with synonyms, pronouns, or reference expressions (this, such, the former). Make sure the replacement is precise."
    },
    agencyOptions: {
      "6-7": ["Replace one repeated word with a different word and resubmit", "Underline every repeated word and try to replace at least two"],
      "8-9": ["Replace this repeated word and resubmit", "Find all repeated words and replace with synonyms", "Look up synonyms in your unit vocabulary list and revise"],
      "10-11": ["Replace this word and resubmit", "Review your unit vocabulary list for precise alternatives", "Revise the full paragraph for lexical variety"],
      "12": ["Replace this instance and resubmit", "Review the paragraph for all repetition and apply synonym or reference substitution", "Revise with attention to both accuracy and lexical variety"]
    }
  },

  weak_connector: {
    id: "weak_connector",
    category: "coherence",
    label: "Missing or inappropriate connector",
    textbookReference: {
      "6-7": "Unit 4 — However; Unit 7 — and, but, so; Unit 11 — Firstly, Secondly",
      "8-9": "PENDING", "10-11": "PENDING", "12": "PENDING"
    },
    attribution: {
      "6-7": "In Vietnamese, the relationship between ideas is often implied rather than stated. English readers expect a signal word that tells them: is this a new idea, a contrast, a reason, or a result?",
      "8-9": "Connector errors often involve using a connector that does not match the logical relationship — for example using and when the relationship is actually contrast.",
      "10-11": "Errors at this level often involve overusing simple connectors in formal writing where academic linkers are expected.",
      "12": "Errors usually involve imprecise use of academic linkers — using however when nevertheless would be more precise."
    },
    blameAssignment: {
      "6-7": "Ask yourself: what is the relationship between these two ideas? Similar (and)? Opposite (but, However)? Reason (because)? New point (Firstly, Secondly)? Choose the connector that matches.",
      "8-9": "Check that the connector matches the logical relationship. But and However signal contrast. Because signals reason. So and Therefore signal result.",
      "10-11": "In formal writing replace and with Furthermore or In addition. Replace but with However or Despite this. Replace so with Therefore or Consequently.",
      "12": "Choose connectors that signal precise logical relationships: concession (Nevertheless), contrast (whereas), addition (Moreover), result (Consequently)."
    },
    replacementOptions: {
      "6-7": { contrast: ["but", "However"], addition: ["and", "Firstly", "Secondly"], reason: ["because"], result: ["so"] },
      "8-9": { contrast: ["but", "However", "Although"], addition: ["and", "Also", "Firstly", "Secondly"], reason: ["because", "since"], result: ["so", "Therefore", "As a result"] },
      "10-11": { contrast: ["However", "Despite this", "Although", "Even though"], addition: ["Furthermore", "In addition", "Moreover"], reason: ["because", "since", "due to"], result: ["Therefore", "Consequently", "As a result"] },
      "12": { contrast: ["Nevertheless", "Nonetheless", "whereas", "while"], addition: ["Moreover", "Furthermore", "In addition"], reason: ["because", "since", "given that"], result: ["Consequently", "As a result", "Hence"] }
    },
    agencyOptions: {
      "6-7": ["Choose a connector from the list above and add it to your sentence", "Read your paragraph aloud and find any place where two ideas feel disconnected"],
      "8-9": ["Replace this connector with a more accurate one and resubmit", "Check every connector — does each one match the logical relationship?", "Review connector types then revise"],
      "10-11": ["Replace this connector with a formal alternative and resubmit", "Find all informal connectors and replace with formal equivalents", "Revise using the formal connector list above"],
      "12": ["Replace this connector with a precise academic alternative and resubmit", "Check all connectors for logical precision", "Revise applying precise academic linking throughout"]
    }
  },

  disconnected_sentences: {
    id: "disconnected_sentences",
    category: "coherence",
    label: "Sentences feel disconnected or unrelated",
    textbookReference: {
      "6-7": "Unit 4 — Model paragraph with However; Unit 11 — Study Skill: giving explanations",
      "8-9": "PENDING", "10-11": "PENDING", "12": "PENDING"
    },
    attribution: {
      "6-7": "Each sentence is correct on its own but the paragraph reads like a list of separate facts. This often happens when the student is focused on answering each question one by one rather than building a flowing text.",
      "8-9": "Disconnection often happens because the student writes each sentence in isolation rather than thinking about how it connects to the one before and after.",
      "10-11": "At this level disconnection often appears between the topic sentence and evidence — the reader cannot see how the evidence relates to the claim.",
      "12": "Disconnection often appears between paragraphs — the reader cannot see how each paragraph advances the overall argument."
    },
    blameAssignment: {
      "6-7": "After you write each sentence ask yourself: how does this connect to the sentence before it? Is it adding information (and, also), contrasting it (but, However), or explaining it (because)?",
      "8-9": "Read your paragraph and ask: if I removed one sentence, would it still make sense? If yes, that sentence may not be connected well enough.",
      "10-11": "After your evidence sentence ask: have I told the reader how this evidence proves my topic sentence? If not, that is the missing link.",
      "12": "At the end of each paragraph ask: have I shown how this paragraph advances my thesis? If not, add a linking sentence."
    },
    agencyOptions: {
      "6-7": ["Add one connector between two disconnected sentences and resubmit", "Read aloud and mark every place where the ideas feel like a sudden jump"],
      "8-9": ["Add a linking sentence or connector between the disconnected ideas and resubmit", "Read each pair of sentences and add the missing link", "Rewrite thinking about connections first, facts second"],
      "10-11": ["Add an analytical link after your evidence sentence and resubmit", "Check every evidence sentence — does it explain how it proves your point?", "Revise ensuring every sentence connects to the topic sentence"],
      "12": ["Add a paragraph-linking sentence and resubmit", "Check that every paragraph has a clear connection to your thesis", "Revise the full essay ensuring each paragraph advances the argument"]
    }
  }

};

// ── HELPER FUNCTIONS ──────────────────────────────────────────────

function getGradeBandKey(grade) {
  const g = parseInt(grade);
  if (g <= 7) return "6-7";
  if (g <= 9) return "8-9";
  if (g <= 11) return "10-11";
  return "12";
}

function getErrorEntry(errorType, grade) {
  const entry = ERROR_TAXONOMY[errorType];
  if (!entry) return null;
  const bandKey = getGradeBandKey(grade);
  return {
    id: entry.id,
    category: entry.category,
    label: entry.label,
    textbookReference: entry.textbookReference[bandKey],
    attribution: entry.attribution[bandKey],
    blameAssignment: entry.blameAssignment[bandKey],
    agencyOptions: entry.agencyOptions[bandKey],
    replacementOptions: entry.replacementOptions
      ? entry.replacementOptions[bandKey]
      : null,
    thinkingQuestions: entry.thinkingQuestions
      ? entry.thinkingQuestions[bandKey]
      : null
  };
}

function getErrorsByCategory(category) {
  return Object.values(ERROR_TAXONOMY).filter(e => e.category === category);
}

module.exports = {
  ERROR_TAXONOMY,
  getErrorEntry,
  getErrorsByCategory,
  getGradeBandKey
};
