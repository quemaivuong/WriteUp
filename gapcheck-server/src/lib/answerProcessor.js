/**
 * answerProcessor.js
 *
 * Takes the guest's answer to a follow-up question, calls Claude to:
 *   1. Extract structured insights (topics, sentiment, key facts)
 *   2. Generate a warm "here's how your answer helps future guests" message
 */

"use strict";

const Anthropic = require("@anthropic-ai/sdk");

let _client = null;
function client() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

/**
 * @param {object} property       - row from Description_PROC.csv
 * @param {string} originalReview - the original review text
 * @param {string} question       - the follow-up question that was asked
 * @param {string} answer         - the guest's answer
 * @returns {Promise<{insights: object, impactMessage: string}>}
 */
async function processAnswer(property, originalReview, question, answer) {
  const systemPrompt = `You are GapCheck, processing a hotel guest's follow-up answer to improve Expedia listings.
Extract structured insight and write a brief, warm message showing the guest the value of their contribution.`;

  const userPrompt = `Property: ${property.property_name} (${property.city})
Original review: "${originalReview.slice(0, 400)}"
Follow-up question asked: "${question}"
Guest's answer: "${answer}"

Return ONLY valid JSON with this exact shape:
{
  "insights": {
    "topics_covered": ["<topic1>", "..."],
    "sentiment": "positive" | "neutral" | "negative" | "mixed",
    "key_facts": ["<concrete fact or observation>", "..."],
    "fills_gap": "<which gap this answer fills, one short phrase>"
  },
  "impactMessage": "<2–3 warm sentences telling the guest how their answer helps future travellers — be specific about WHAT will improve>"
}`;

  const msg = await client().messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 400,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const raw = msg.content[0].text.trim();
  const json = raw.replace(/^```(?:json)?|```$/gm, "").trim();
  return JSON.parse(json);
}

module.exports = { processAnswer };
