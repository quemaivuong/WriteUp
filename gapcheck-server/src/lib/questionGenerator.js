/**
 * questionGenerator.js
 *
 * Calls Claude to generate 1–2 natural follow-up questions for a reviewer
 * based on the gap analysis for their property.
 */

"use strict";

const Anthropic = require("@anthropic-ai/sdk");

let _client = null;
function client() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

/**
 * @param {object} property  - row from Description_PROC.csv
 * @param {object} gaps      - { nullRatings, unmentionedAmenities, staleTopics }
 * @param {string} reviewText - the review the guest just submitted
 * @returns {Promise<string[]>} array of 1–2 question strings
 */
async function generateQuestions(property, gaps, reviewText) {
  const gapBullets = _buildGapBullets(gaps);

  const systemPrompt = `You are GapCheck, a smart review assistant for hotel guests on Expedia.
Your job: after a guest submits a review, ask them 1–2 short, natural follow-up questions to fill specific information gaps about their property.
Guidelines:
- Sound like a helpful, curious friend — NOT a survey form
- Ask only about things this guest likely experienced based on their review
- Each question should be one sentence, plain English
- Never repeat what the guest already said in their review
- Target the most impactful gaps first`;

  const userPrompt = `Property: ${property.property_name} (${property.star_rating}-star ${property.property_type}, ${property.city}, ${property.country})
Description snippet: "${property.description.slice(0, 300)}..."

Guest's review:
"${reviewText}"

Information gaps we need to fill for this property:
${gapBullets}

Generate exactly 1 or 2 follow-up questions. Return ONLY valid JSON:
{"questions": ["<question 1>", "<question 2 (optional)>"]}`;

  const msg = await client().messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 256,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const raw = msg.content[0].text.trim();
  // Strip any accidental markdown fences
  const json = raw.replace(/^```(?:json)?|```$/gm, "").trim();
  const parsed = JSON.parse(json);
  return Array.isArray(parsed.questions) ? parsed.questions.slice(0, 2) : [];
}

function _buildGapBullets(gaps) {
  const lines = [];

  if (gaps.nullRatings?.length) {
    lines.push("Missing ratings (>50 % of reviewers skipped these):");
    gaps.nullRatings.slice(0, 3).forEach((g) =>
      lines.push(
        `  • ${g.label}: ${Math.round(g.nullRate * 100)} % null (${g.nullCount}/${g.total} reviews)`
      )
    );
  }

  if (gaps.unmentionedAmenities?.length) {
    lines.push("Property amenities rarely mentioned in reviews:");
    gaps.unmentionedAmenities.slice(0, 3).forEach((a) =>
      lines.push(
        `  • ${a.amenity}: only ${Math.round(a.mentionRate * 100)} % of reviews mention it`
      )
    );
  }

  if (gaps.staleTopics?.length) {
    lines.push("Topics not mentioned in recent reviews:");
    gaps.staleTopics.slice(0, 2).forEach((t) =>
      lines.push(`  • ${t.topic}: last mentioned ${t.daysSince} days ago`)
    );
  }

  return lines.length ? lines.join("\n") : "General coverage is thin — any detail helps.";
}

module.exports = { generateQuestions };
