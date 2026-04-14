import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Load and split data on startup
const raw = fs.readFileSync('./data/dat_combined.csv', 'utf8');
const allRows = parse(raw, { columns: true, skip_empty_lines: true });
const descriptions = allRows.filter(r => r.city && r.city !== 'NA');
const reviews = allRows.filter(r => !r.city || r.city === 'NA');

// GET /properties - list all 13 properties
app.get('/properties', (req, res) => {
  const props = descriptions.map(d => ({
    id: d.eg_property_id,
    city: d.city,
    country: d.country,
    star_rating: d.star_rating,
    guestrating_avg: d.guestrating_avg_expedia,
    property_description: d.property_description,
    popular_amenities: d.popular_amenities_list,
    pet_policy: d.pet_policy,
    check_in_start: d.check_in_start_time,
    check_out: d.check_out_time,
  }));
  res.json(props);
});

// POST /analyze - gap analysis + question generation
app.post('/analyze', async (req, res) => {
  const { propertyId, reviewText } = req.body;

  const desc = descriptions.find(d => d.eg_property_id === propertyId);
  const propReviews = reviews.filter(r => r.eg_property_id === propertyId);

  if (!desc) return res.status(404).json({ error: 'Property not found' });

  // --- Gap Analysis ---
  const RATING_DIMS = [
    'roomcomfort', 'ecofriendliness', 'roomamenitiesscore',
    'valueformoney', 'checkin', 'communication',
    'location', 'neighborhoodsatisfaction', 'convenienceoflocation'
  ];

  const nullRates = {};
  for (const dim of RATING_DIMS) {
    const nullCount = propReviews.filter(r => {
      try { return JSON.parse(r.rating)[dim] === 0; }
      catch { return true; }
    }).length;
    nullRates[dim] = nullCount / propReviews.length;
  }

  // Top gaps = dimensions with >80% null
  const topGaps = Object.entries(nullRates)
    .filter(([, rate]) => rate > 0.8)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([dim]) => dim);

  // Staleness: most recent review date
  const dates = propReviews
    .map(r => new Date(r.acquisition_date))
    .filter(d => !isNaN(d))
    .sort((a, b) => b - a);
  const mostRecent = dates[0];
  const monthsAgo = mostRecent
    ? Math.floor((Date.now() - mostRecent) / (1000 * 60 * 60 * 24 * 30))
    : null;

  // Amenity gaps: mentioned in description but not in reviews
  const amenityText = [
    desc.property_amenity_spa,
    desc.property_amenity_outdoor,
    desc.property_amenity_food_and_drink,
    desc.property_amenity_family_friendly,
  ].join(' ').toLowerCase();

  const reviewCorpus = propReviews.map(r => r.review_text).join(' ').toLowerCase();
  const amenityGaps = [];
  if (amenityText.includes('spa') && !reviewCorpus.includes('spa')) amenityGaps.push('spa');
  if (amenityText.includes('pool') && !reviewCorpus.includes('pool')) amenityGaps.push('pool');
  if (amenityText.includes('breakfast') && !reviewCorpus.includes('breakfast')) amenityGaps.push('breakfast');
  if (amenityText.includes('eco') && !reviewCorpus.includes('eco')) amenityGaps.push('eco-friendliness');
  if (desc.pet_policy && !desc.pet_policy.includes('not allowed') && !reviewCorpus.includes('pet')) amenityGaps.push('pet policy');

  // --- AI Question Generation ---
  const prompt = `You are TrustMap, an AI that helps hotel guests contribute meaningful reviews.

A guest just stayed at a hotel in ${desc.city}, ${desc.country} (${desc.star_rating || 'unrated'} stars) and wrote this review:
"${reviewText}"

Based on data analysis, this property has critical information gaps:
- Rating dimensions with almost no coverage: ${topGaps.join(', ')}
- Amenities mentioned by the hotel but rarely discussed in reviews: ${amenityGaps.join(', ') || 'none identified'}
- Most recent review was ${monthsAgo !== null ? monthsAgo + ' months ago' : 'unknown time ago'}

Generate exactly 1-2 short, conversational follow-up questions that:
1. Target the most important gaps above
2. Feel natural, not like a survey
3. Are specific to what the guest mentioned in their review
4. Each question is one sentence max

Respond in JSON format only:
{
  "questions": ["question 1", "question 2"],
  "gaps_targeted": ["gap 1", "gap 2"],
  "why_it_matters": "one sentence explaining why this helps future guests"
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.content[0].text;
  const clean = text.replace(/```json|```/g, '').trim();
  const result = JSON.parse(clean);

  res.json({
    questions: result.questions,
    gaps_targeted: result.gaps_targeted,
    why_it_matters: result.why_it_matters,
    property: { city: desc.city, country: desc.country },
    gap_stats: { top_null_dims: topGaps, amenity_gaps: amenityGaps, months_since_recent: monthsAgo }
  });
});

// POST /process-answer - extract insight from reviewer's answer
app.post('/process-answer', async (req, res) => {
  const { propertyId, question, answer } = req.body;
  const desc = descriptions.find(d => d.eg_property_id === propertyId);

  const prompt = `A hotel guest at ${desc?.city || 'a hotel'} answered this follow-up review question:

Question: "${question}"
Answer: "${answer}"

Extract the key insight and write a short message (2 sentences max) telling the guest how their answer helps future travelers. Be warm and specific.

Respond in JSON only:
{
  "impact_message": "...",
  "insight_extracted": "one phrase summarizing what was learned"
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.content[0].text;
  const clean = text.replace(/```json|```/g, '').trim();
  const result = JSON.parse(clean);
  res.json(result);
});

app.listen(3001, () => console.log('TrustMap server running on port 3001'));
