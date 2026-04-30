import { useState, useEffect } from 'react'

const GRADE_PROMPTS = {
  6: [
    "What do you like about this paragraph?",
    "Is there anything you did not understand?",
    "What would you like to know more about?"
  ],
  7: [
    "Did the writer answer the main question of the task?",
    "What detail helped you understand the topic better?",
    "Do you agree with what the writer said?"
  ],
  8: [
    "Is the writer's opinion clear?",
    "Did the writer give good reasons?",
    "What is one thing this paragraph did not explain?"
  ]
}

export default function GuidingQuestion({ draft, grade }) {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!draft) return
    generateQuestions()
  }, [draft?.id])

  async function generateQuestions() {
    setLoading(true)
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: `You are helping a Grade ${grade} ESL student think about a classmate's paragraph.

The paragraph is: "${draft.paragraph}"
The task was: "${draft.task}"

Write 2 or 3 short thinking prompts that help the reader think about this specific paragraph.
The prompts should be about the IDEAS, not grammar.
Each prompt should be a simple question that a Grade ${grade} student can understand.
${grade <= 6 ? 'Use only very simple A1 words. Short sentences.' : ''}
${grade === 7 ? 'Use simple words. Keep sentences short.' : ''}
${grade === 8 ? 'Use clear simple language.' : ''}

Do NOT use these words: genuine, curious, unanswered, elaborate, justify, evaluate, authentic, nuanced, compelling.
Do NOT give questions that are easy to answer with just yes or no.
Make the questions specific to THIS paragraph, not generic.

Return ONLY a JSON array of 2-3 question strings. No other text.
Example: ["What made the writer feel this way?", "How is this place different from where you live?"]`
          }]
        })
      })
      const data = await response.json()
      const raw = data.content?.[0]?.text?.trim()
        .replace(/^```json\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim()
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setQuestions(parsed.slice(0, 3))
          setLoading(false)
          return
        }
      }
    } catch {
      // fall through to defaults
    }
    const prompts = GRADE_PROMPTS[grade] || GRADE_PROMPTS[8]
    setQuestions(prompts)
    setLoading(false)
  }

  if (!questions.length && !loading) return null

  return (
    <div style={{
      marginTop: '16px',
      padding: '14px 16px',
      background: 'var(--paper2)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--radius)',
    }}>
      <div style={{
        fontSize: '11px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.6px',
        color: 'var(--ink3)',
        marginBottom: '10px'
      }}>
        Things to think about
      </div>

      {loading ? (
        <div style={{ fontSize: '13px', color: 'var(--ink3)' }}>
          Finding some questions for you…
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {questions.map((q, i) => (
            <div key={i} style={{
              display: 'flex', gap: '10px', alignItems: 'flex-start'
            }}>
              <div style={{
                width: '18px', height: '18px',
                borderRadius: '50%',
                background: 'var(--teal-light)',
                border: '1px solid var(--teal-mid)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: '600',
                color: 'var(--teal)', flexShrink: 0, marginTop: '1px'
              }}>
                {i + 1}
              </div>
              <div style={{
                fontSize: '13px',
                color: 'var(--ink2)',
                lineHeight: '1.6'
              }}>
                {q}
              </div>
            </div>
          ))}
          <div style={{
            marginTop: '6px',
            fontSize: '12px',
            color: 'var(--ink3)',
            fontStyle: 'italic'
          }}>
            Use these to help you write a comment or question below.
          </div>
        </div>
      )}
    </div>
  )
}
