/**
 * gapAnalyzer.js
 *
 * Joins Description_PROC.csv + Reviews_PROC.csv on eg_property_id and
 * returns three gap buckets for a given property:
 *   1. nullRatings   — rating dimensions with > 50 % null values
 *   2. unmentionedAmenities — property amenities with < 10 % review mention rate
 *   3. staleTopics   — amenity topics last mentioned > 90 days ago
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const DATA_DIR = path.join(__dirname, "../../data");

// ── CSV cache (loaded once per process) ──────────────────────────────────────
let _descriptions = null;
let _reviews = null;

function loadDescriptions() {
  if (_descriptions) return _descriptions;
  const raw = fs.readFileSync(
    path.join(DATA_DIR, "Description_PROC.csv"),
    "utf8"
  );
  _descriptions = parse(raw, { columns: true, skip_empty_lines: true });
  return _descriptions;
}

function loadReviews() {
  if (_reviews) return _reviews;
  const raw = fs.readFileSync(
    path.join(DATA_DIR, "Reviews_PROC.csv"),
    "utf8"
  );
  _reviews = parse(raw, { columns: true, skip_empty_lines: true });
  return _reviews;
}

// ── Rating dimensions and human labels ───────────────────────────────────────
const RATING_DIMS = [
  { key: "rating_cleanliness",   label: "Cleanliness",       alwaysRelevant: true },
  { key: "rating_service",       label: "Staff & Service",   alwaysRelevant: true },
  { key: "rating_room_comfort",  label: "Room Comfort",      alwaysRelevant: true },
  { key: "rating_location",      label: "Location",          alwaysRelevant: true },
  { key: "rating_value",         label: "Value for Money",   alwaysRelevant: true },
  { key: "rating_amenities",     label: "Amenities Overall", alwaysRelevant: true },
  { key: "rating_wifi",          label: "WiFi Quality",      amenityFlag: "has_wifi" },
  { key: "rating_dining",        label: "Dining",            amenityFlag: "has_restaurant" },
  { key: "rating_pool",          label: "Pool",              amenityFlag: "has_pool" },
  { key: "rating_fitness",       label: "Fitness Center",    amenityFlag: "has_gym" },
];

// ── Amenity → review keyword mapping ─────────────────────────────────────────
const AMENITY_KEYWORDS = {
  pool:       ["pool", "swimming", "swim", "poolside"],
  spa:        ["spa", "massage", "sauna", "steam room", "facial", "treatment"],
  gym:        ["gym", "fitness", "workout", "exercise", "treadmill", "weight"],
  restaurant: ["restaurant", "dining", "breakfast", "dinner", "lunch", "buffet", "menu", "ate"],
  bar:        ["bar", "lounge", "cocktail", "drink", "happy hour", "mocktail"],
  parking:    ["parking", "valet", "garage", "car park", "self-park"],
  wifi:       ["wifi", "wi-fi", "internet", "connection", "bandwidth"],
  beach:      ["beach", "ocean", "sea", "sand", "waves", "shoreline"],
  concierge:  ["concierge", "front desk", "bellhop", "luggage", "recommendation"],
  pet:        ["pet", "dog", "cat", "animal", "furry"],
};

// ── Public: list all properties (for dropdown) ───────────────────────────────
function getProperties() {
  return loadDescriptions().map((d) => ({
    id: d.eg_property_id,
    name: d.property_name,
    city: d.city,
    country: d.country,
    stars: parseFloat(d.star_rating),
    type: d.property_type,
  }));
}

// ── Public: full gap analysis for one property ───────────────────────────────
function analyzeGaps(propertyId) {
  const pid = String(propertyId);
  const property = loadDescriptions().find((d) => d.eg_property_id === pid);
  if (!property) return null;

  const reviews = loadReviews().filter((r) => r.eg_property_id === pid);
  const total = reviews.length;

  return {
    property,
    reviewCount: total,
    gaps: {
      nullRatings:           _nullRatingGaps(property, reviews, total),
      unmentionedAmenities:  _unmentionedAmenities(property, reviews, total),
      staleTopics:           _staleTopics(property, reviews),
    },
  };
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function _nullRatingGaps(property, reviews, total) {
  if (total === 0) return [];

  return RATING_DIMS
    .filter((dim) => {
      if (dim.alwaysRelevant) return true;
      return property[dim.amenityFlag] === "true";
    })
    .map((dim) => {
      const nullCount = reviews.filter(
        (r) => !r[dim.key] || r[dim.key].trim() === ""
      ).length;
      const nullRate = nullCount / total;
      return { dimension: dim.key, label: dim.label, nullRate, nullCount, total };
    })
    .filter((g) => g.nullRate > 0.5)
    .sort((a, b) => b.nullRate - a.nullRate);
}

function _unmentionedAmenities(property, reviews, total) {
  if (total === 0) return [];
  const results = [];

  for (const [amenity, keywords] of Object.entries(AMENITY_KEYWORDS)) {
    if (!_propertyHasAmenity(property, amenity)) continue;

    const mentionCount = reviews.filter((r) =>
      _textMentions((r.review_text || "").toLowerCase(), keywords)
    ).length;

    const mentionRate = mentionCount / total;
    if (mentionRate < 0.15) {
      results.push({ amenity, mentionRate, mentionCount, total });
    }
  }

  return results.sort((a, b) => a.mentionRate - b.mentionRate).slice(0, 4);
}

function _staleTopics(property, reviews) {
  const now = new Date();
  const STALE_DAYS = 90;
  const results = [];

  for (const [topic, keywords] of Object.entries(AMENITY_KEYWORDS)) {
    if (!_propertyHasAmenity(property, topic)) continue;

    const relevant = reviews
      .filter((r) => _textMentions((r.review_text || "").toLowerCase(), keywords))
      .sort((a, b) => new Date(b.review_date) - new Date(a.review_date));

    if (relevant.length === 0) continue;

    const daysSince = Math.round(
      (now - new Date(relevant[0].review_date)) / 86_400_000
    );

    if (daysSince > STALE_DAYS) {
      results.push({
        topic,
        daysSince,
        lastMentioned: relevant[0].review_date,
        mentionCount: relevant.length,
      });
    }
  }

  return results.sort((a, b) => b.daysSince - a.daysSince).slice(0, 3);
}

function _propertyHasAmenity(property, amenity) {
  const map = {
    pool:       property.has_pool        === "true",
    spa:        property.has_spa         === "true",
    gym:        property.has_gym         === "true",
    restaurant: property.has_restaurant  === "true",
    bar:        property.has_bar         === "true",
    parking:    property.has_parking     === "true",
    wifi:       property.has_wifi        === "true",
    beach:      property.has_beach_access === "true",
    concierge:  property.has_concierge   === "true",
    pet:        property.has_pet_friendly === "true",
  };
  return !!map[amenity];
}

function _textMentions(text, keywords) {
  return keywords.some((kw) => text.includes(kw));
}

module.exports = { getProperties, analyzeGaps };
