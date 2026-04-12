import { useState, useEffect } from 'react'

const GRADE_PROMPTS = {
  6: [
    "What do you like about this paragraph?",
    "What did you learn from reading this?",
    "Is there anything that is not clear to you?",
    "Do you have a question for the writer?"
  ],
  7: [
    "Did the writer answer the main question of the task?",
    "What detail helped you understand the topic?",
    "What would you like to know more about?",
    "Do you agree with the writer? Why or why not?"
  ],
  8: [
    "Is the writer's opinion clear?",
    "Did the writer give good reasons for their opinion?",
    "Do you agree or disagree with the writer?",
    "What is one thing this paragraph did not explain?"
  ]
}

export default function GuidingQuestion({ draft, grade, onUseQuestion }) {
  const [question, setQuestion] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!draft) return
    generateQuestion()
  }, [draft?.id])

  async function generateQuestion() {
    setLoading(true)
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 200,
          messages: [{
            role: 'user',
            content: `You are helping a Grade ${grade} ESL student read and respond to a classmate's paragraph.

The paragraph is: "${draft.paragraph}"
The task was: "${draft.task}"
The grade is: ${grade}

Write ONE short question that helps the reader think about the IDEAS in this paragraph.
The question must use only simple words that a Grade ${grade} student knows.
${grade <= 6 ? 'Use A1 vocabulary only. Very simple words.' : ''}
${grade === 7 ? 'Use simple A1 words. Short sentences.' : ''}
${grade === 8 ? 'Use A2 vocabulary. Keep it simple and clear.' : ''}

Do not ask about grammar.
Do not use these words: genuine, curious, unanswered, elaborate, justify, evaluate, authentic.
Write only the question. No explanation. No introduction.`
          }],
          system: 'You write short, simple questions for ESL students. One question only. Plain text, no punctuation except the question mark at the end.'
        })
      })
      const data = await response.json()
      const generated = data.content?.[0]?.text?.trim()
      if (generated) {
        setQuestion(generated)
      } else {
        const prompts = GRADE_PROMPTS[grade] || GRADE_PROMPTS[8]
        setQuestion(prompts[Math.floor(Math.random() * prompts.length)])
      }
    } catch {
      const prompts = GRADE_PROMPTS[grade] || GRADE_PROMPTS[8]
      setQuestion(prompts[Math.floor(Math.random() * prompts.length)])
    } finally {
      setLoading(false)
    }
  }

  if (!question && !loading) return null

  return (
    <div style={{
      background: 'var(--color-background-primary)',
      border: '0.5px solid var(--color-border-tertiary)',
      borderRadius: 'var(--border-radius-lg)',
      padding: '12px 14px',
      marginTop: '12px'
    }}>
      <div style={{
        fontSize: '11px', fontWeight: '500',
        textTransform: 'uppercase', letterSpacing: '0.06em',
        color: 'var(--color-text-secondary)',
        marginBottom: '8px'
      }}>
        A question to help you start
      </div>

      {loading ? (
        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          Finding a good question for you…
        </div>
      ) : (
        <>
          <div style={{
            fontSize: '14px',
            color: 'var(--color-text-primary)',
            lineHeight: '1.6',
            fontWeight: '500',
            marginBottom: '10px'
          }}>
            {question}
          </div>
          <button
            onClick={() => onUseQuestion(question)}
            style={{
              fontSize: '12px', padding: '5px 12px',
              borderRadius: 'var(--border-radius-md)',
              border: '0.5px solid var(--color-border-secondary)',
              background: 'var(--color-background-primary)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer'
            }}
          >
            Use this question →
          </button>
        </>
      )}
    </div>
  )
}
