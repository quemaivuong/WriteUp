// ================================================================
// WriteUp — responseValidator.js
// Validates Claude responses against expected JSON schemas
// Part of Path C: prompt engineering + structured output validation
// ================================================================

const VALID_ERROR_TYPES = new Set([
  'subject_verb_agreement',
  'article_omission',
  'tense_mixing',
  'direct_translation',
  'vocabulary_repetition',
  'weak_connector',
  'disconnected_sentences',
  'claim_no_explanation',
  'evidence_no_analysis',
  'punctuation_error'
])

const VALID_TRACKS = new Set(['direct', 'soft_socratic', 'full_socratic'])

function validateInitialFeedback(parsed) {
  const errors = []

  if (typeof parsed !== 'object' || parsed === null) {
    errors.push('Response is not an object')
    return { valid: false, errors, sanitized: null }
  }

  // Validate direct_feedback
  if (parsed.direct_feedback) {
    if (!Array.isArray(parsed.direct_feedback)) {
      errors.push('direct_feedback must be an array')
      parsed.direct_feedback = []
    } else {
      parsed.direct_feedback = parsed.direct_feedback.filter(fb => {
        if (!fb.error_type || !VALID_ERROR_TYPES.has(fb.error_type)) {
          errors.push(`Invalid error_type: ${fb.error_type} — removed`)
          return false
        }
        if (!fb.surface || typeof fb.surface !== 'string') {
          errors.push('Missing or invalid surface field — removed')
          return false
        }
        return true
      }).slice(0, 2) // enforce max 2
    }
  } else {
    parsed.direct_feedback = []
  }

  // Validate socratic_questions
  if (parsed.socratic_questions) {
    if (!Array.isArray(parsed.socratic_questions)) {
      errors.push('socratic_questions must be an array')
      parsed.socratic_questions = []
    } else {
      parsed.socratic_questions = parsed.socratic_questions.filter(q => {
        if (!q.error_type || !VALID_ERROR_TYPES.has(q.error_type)) {
          errors.push(`Invalid error_type in socratic: ${q.error_type} — removed`)
          return false
        }
        if (!q.track || !VALID_TRACKS.has(q.track)) {
          errors.push(`Invalid track: ${q.track} — defaulting to full_socratic`)
          q.track = 'full_socratic'
        }
        if (!q.question || typeof q.question !== 'string') {
          errors.push('Missing question field — removed')
          return false
        }
        return true
      }).slice(0, 1) // enforce max 1 socratic
    }
  } else {
    parsed.socratic_questions = []
  }

  // Validate format_check
  if (parsed.format_check) {
    if (typeof parsed.format_check.correct_format_used !== 'boolean') {
      parsed.format_check.correct_format_used = true
      errors.push('format_check.correct_format_used was not boolean — defaulted to true')
    }
  } else {
    parsed.format_check = { correct_format_used: true, format_issue: null }
  }

  // Validate topic_check
  if (parsed.topic_check) {
    if (typeof parsed.topic_check.on_topic !== 'boolean') {
      parsed.topic_check.on_topic = true
      errors.push('topic_check.on_topic was not boolean — defaulted to true')
    }
  } else {
    parsed.topic_check = { on_topic: true, topic_issue: null }
  }

  // Ensure stage_complete is boolean
  if (typeof parsed.stage_complete !== 'boolean') {
    parsed.stage_complete = false
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: parsed
  }
}

function validateStudentAnswer(parsed) {
  const errors = []

  if (typeof parsed !== 'object' || parsed === null) {
    return { valid: false, errors: ['Response is not an object'], sanitized: null }
  }

  const VALID_ASSESSMENTS = new Set(['correct', 'partially_correct', 'incorrect', 'confused', 'pushback'])
  if (!parsed.assessment || !VALID_ASSESSMENTS.has(parsed.assessment)) {
    errors.push(`Invalid assessment: ${parsed.assessment} — defaulted to partially_correct`)
    parsed.assessment = 'partially_correct'
  }

  if (!parsed.response || typeof parsed.response !== 'string') {
    errors.push('Missing response field')
    parsed.response = ''
  }

  if (typeof parsed.stage_complete !== 'boolean') {
    parsed.stage_complete = false
  }

  return { valid: errors.length === 0, errors, sanitized: parsed }
}

function validateRevision(parsed) {
  const errors = []

  if (typeof parsed !== 'object' || parsed === null) {
    return { valid: false, errors: ['Response is not an object'], sanitized: null }
  }

  const VALID_OUTCOMES = new Set(['resolved', 'improved', 'new_error', 'no_change'])
  if (!parsed.outcome || !VALID_OUTCOMES.has(parsed.outcome)) {
    errors.push(`Invalid outcome: ${parsed.outcome} — defaulted to improved`)
    parsed.outcome = 'improved'
  }

  if (typeof parsed.stage_complete !== 'boolean') {
    parsed.stage_complete = false
  }

  // Apply same error validation as initial feedback
  if (parsed.direct_feedback && Array.isArray(parsed.direct_feedback)) {
    parsed.direct_feedback = parsed.direct_feedback.filter(fb =>
      fb.error_type && VALID_ERROR_TYPES.has(fb.error_type)
    ).slice(0, 2)
  } else {
    parsed.direct_feedback = []
  }

  if (parsed.socratic_questions && Array.isArray(parsed.socratic_questions)) {
    parsed.socratic_questions = parsed.socratic_questions.filter(q =>
      q.error_type && VALID_ERROR_TYPES.has(q.error_type)
    ).slice(0, 1)
  } else {
    parsed.socratic_questions = []
  }

  return { valid: errors.length === 0, errors, sanitized: parsed }
}

module.exports = {
  validateInitialFeedback,
  validateStudentAnswer,
  validateRevision
}
