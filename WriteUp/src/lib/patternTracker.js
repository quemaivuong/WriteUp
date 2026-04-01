// ================================================================
// WriteUp — src/lib/patternTracker.js
// Tracks error patterns within a session and across sessions.
// Session patterns: in-memory, passed with each response.
// Long-term patterns: stored in Supabase (to be wired up later).
// ================================================================

const { getErrorEntry } = require("./errorTaxonomy");

// ── SESSION PATTERN TRACKER ───────────────────────────────────────
// A session log is an array of error type strings recorded
// each time the feedback routes detect an error.
// Passed from frontend → backend with each request.
// Updated and returned with each response.

// Record a new error into the session log
function recordError(sessionLog, errorType) {
  if (!Array.isArray(sessionLog)) return [errorType];
  return [...sessionLog, errorType];
}

// Count occurrences of each error type in the session log
function countErrors(sessionLog) {
  if (!Array.isArray(sessionLog)) return {};
  return sessionLog.reduce((acc, errorType) => {
    acc[errorType] = (acc[errorType] || 0) + 1;
    return acc;
  }, {});
}

// Detect which error types have appeared more than once
// These are session patterns worth surfacing to the student
function detectSessionPatterns(sessionLog) {
  const counts = countErrors(sessionLog);
  return Object.entries(counts)
    .filter(([, count]) => count >= 2)
    .map(([errorType, count]) => ({ errorType, count }));
}

// Build a pattern alert message for the student
// Called when an error type has appeared 2+ times in a session
function buildPatternAlert(errorType, count, grade) {
  const entry = getErrorEntry(errorType, grade);
  if (!entry) return null;
  return {
    errorType,
    count,
    label: entry.label,
    message:
      `I notice this is the ${count === 2 ? "second" : "third or more"} time ` +
      `${entry.label.toLowerCase()} has come up in your writing today. ` +
      `This might be a pattern worth paying attention to.`,
    textbookReference: entry.textbookReference,
    attribution: entry.attribution
  };
}

// Main function called by feedback routes
// Takes the current session log and the new errors from this response
// Returns updated log, any pattern alerts, and pattern summary
function processSessionPatterns(sessionLog, newErrorTypes, grade) {
  // Add new errors to the log
  let updatedLog = sessionLog || [];
  newErrorTypes.forEach(errorType => {
    updatedLog = recordError(updatedLog, errorType);
  });

  // Detect patterns
  const patterns = detectSessionPatterns(updatedLog);

  // Build alerts only for errors that just hit the threshold
  const alerts = patterns
    .filter(p => newErrorTypes.includes(p.errorType) && p.count >= 2)
    .map(p => buildPatternAlert(p.errorType, p.count, grade))
    .filter(Boolean);

  return {
    updatedLog,
    sessionPatterns: patterns,
    patternAlerts: alerts
  };
}

// ── LONG-TERM PATTERN SUMMARY ─────────────────────────────────────
// Called at end of session to prepare data for Supabase storage.
// The actual database write happens in the route, not here.
// This function just formats the data cleanly.

function buildLongTermPatternUpdate(studentId, sessionLog, grade) {
  const counts = countErrors(sessionLog);
  const timestamp = new Date().toISOString();

  return Object.entries(counts).map(([errorType, sessionCount]) => ({
    student_id: studentId,
    error_type: errorType,
    session_count: sessionCount,
    grade,
    last_seen: timestamp
  }));
}

// ── FORMAT PATTERNS FOR FEEDBACK RESPONSE ─────────────────────────
// Formats session patterns into a clean summary for the frontend
// to display to the student at the end of a session.

function formatPatternsForStudent(sessionLog, grade) {
  const counts = countErrors(sessionLog);
  const significant = Object.entries(counts)
    .filter(([, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a);

  if (significant.length === 0) return null;

  return significant.map(([errorType, count]) => {
    const entry = getErrorEntry(errorType, grade);
    if (!entry) return null;
    return {
      errorType,
      count,
      label: entry.label,
      category: entry.category,
      textbookReference: entry.textbookReference,
      suggestion:
        count >= 3
          ? `This appeared ${count} times today — it is worth reviewing ` +
            `${entry.textbookReference} before your next writing task.`
          : `This appeared twice today — something to watch in your next draft.`
    };
  }).filter(Boolean);
}

module.exports = {
  recordError,
  countErrors,
  detectSessionPatterns,
  buildPatternAlert,
  processSessionPatterns,
  buildLongTermPatternUpdate,
  formatPatternsForStudent
};
