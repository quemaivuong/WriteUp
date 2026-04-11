import { useState } from 'react'

function QuestionCard({ question, index, onAction, disabled }) {
  const [replyText, setReplyText] = useState('')
  const [activeAction, setActiveAction] = useState(null)

  function handleReply() {
    setActiveAction('reply')
    setReplyText('')
  }

  function handleKeep() {
    onAction(`I'll keep "${question.surface}" as is.`, 'student_keeps', question.surface)
    setActiveAction(null)
  }

  function handleDisagree() {
    const prefill = `I disagree — I think this is fine because `
    setReplyText(prefill)
    setActiveAction('disagree')
  }

  function handleSend() {
    if (!replyText.trim()) return
    const turnType = activeAction === 'disagree' ? 'student_pushback' : 'student_answer'
    onAction(replyText.trim(), turnType, question.surface)
    setReplyText('')
    setActiveAction(null)
  }

  const trackLabel = question.track === 'soft_socratic'
    ? 'Vocabulary — think about this'
    : 'Logic / coherence — think about this'

  return (
    <div style={{
      background: 'var(--color-background-primary)',
      border: '0.5px solid var(--color-border-tertiary)',
      borderRadius: 'var(--border-radius-lg)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '10px 14px',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
        background: 'var(--color-background-secondary)'
      }}>
        <div style={{
          width: '20px', height: '20px', borderRadius: '50%',
          background: 'var(--color-background-warning)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: '500',
          color: 'var(--color-text-warning)', flexShrink: 0
        }}>
          {index}
        </div>
        <div style={{
          fontSize: '11px', fontWeight: '500',
          textTransform: 'uppercase', letterSpacing: '0.06em',
          color: 'var(--color-text-warning)'
        }}>
          {trackLabel}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '12px 14px' }}>
        {/* Surface phrase */}
        {question.surface && (
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '13px',
            color: 'var(--color-text-warning)',
            background: 'var(--color-background-secondary)',
            padding: '6px 10px', borderRadius: 'var(--border-radius-md)',
            marginBottom: '8px'
          }}>
            "{question.surface}"
          </div>
        )}

        {/* Question */}
        <div style={{
          fontSize: '14px', color: 'var(--color-text-primary)',
          lineHeight: '1.7', fontWeight: '500', marginBottom: '10px'
        }}>
          {question.question}
        </div>

        {/* Options (vocabulary suggestions) */}
        {question.options && question.options.length > 0 && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '6px',
            marginBottom: '12px'
          }}>
            {question.options.map((opt, j) => (
              <button
                key={j}
                onClick={() => {
                  setReplyText(opt)
                  setActiveAction('reply')
                }}
                disabled={disabled}
                style={{
                  fontSize: '12px', padding: '4px 12px',
                  borderRadius: '99px',
                  border: '0.5px solid var(--color-border-warning)',
                  background: 'var(--color-background-warning)',
                  color: 'var(--color-text-warning)',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.5 : 1
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Attribution */}
        {question.attribution && (
          <div style={{
            fontSize: '12px', color: 'var(--color-text-secondary)',
            lineHeight: '1.6',
            borderLeft: '2px solid var(--color-border-tertiary)',
            paddingLeft: '10px', marginBottom: '12px'
          }}>
            {question.attribution}
          </div>
        )}

        {/* Action buttons */}
        {!activeAction && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              onClick={handleReply}
              disabled={disabled}
              style={{
                fontSize: '12px', padding: '5px 11px',
                borderRadius: 'var(--border-radius-md)',
                border: '0.5px solid var(--color-border-secondary)',
                background: 'var(--color-background-primary)',
                color: 'var(--color-text-primary)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1
              }}
            >
              Reply
            </button>
            <button
              onClick={handleKeep}
              disabled={disabled}
              style={{
                fontSize: '12px', padding: '5px 11px',
                borderRadius: 'var(--border-radius-md)',
                border: '0.5px solid var(--color-border-secondary)',
                background: 'var(--color-background-primary)',
                color: 'var(--color-text-secondary)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1
              }}
            >
              Keep as is
            </button>
            <button
              onClick={handleDisagree}
              disabled={disabled}
              style={{
                fontSize: '12px', padding: '5px 11px',
                borderRadius: 'var(--border-radius-md)',
                border: '0.5px solid var(--color-border-secondary)',
                background: 'var(--color-background-primary)',
                color: 'var(--color-text-secondary)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1
              }}
            >
              I disagree
            </button>
          </div>
        )}

        {/* Reply textarea */}
        {activeAction && (
          <div style={{ marginTop: '8px' }}>
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder={activeAction === 'disagree'
                ? 'Explain why you think this is correct…'
                : 'Type your answer here…'}
              rows={3}
              style={{
                width: '100%', fontSize: '13px',
                padding: '8px 10px',
                borderRadius: 'var(--border-radius-md)',
                border: '0.5px solid var(--color-border-secondary)',
                background: 'var(--color-background-secondary)',
                color: 'var(--color-text-primary)',
                resize: 'none', boxSizing: 'border-box',
                fontFamily: 'var(--font-sans)'
              }}
            />
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
              <button
                onClick={handleSend}
                disabled={disabled || !replyText.trim()}
                style={{
                  fontSize: '12px', padding: '5px 14px',
                  borderRadius: 'var(--border-radius-md)',
                  border: '0.5px solid var(--color-border-secondary)',
                  background: 'var(--color-background-primary)',
                  color: 'var(--color-text-primary)',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.5 : 1
                }}
              >
                Send
              </button>
              <button
                onClick={() => { setActiveAction(null); setReplyText('') }}
                style={{
                  fontSize: '12px', padding: '5px 14px',
                  borderRadius: 'var(--border-radius-md)',
                  border: '0.5px solid var(--color-border-secondary)',
                  background: 'transparent',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SocraticCard({ questions, onAction, disabled }) {
  if (!questions || questions.length === 0) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
      {questions.map((q, i) => (
        <QuestionCard
          key={i}
          question={q}
          index={i + 1}
          onAction={onAction}
          disabled={disabled}
        />
      ))}
    </div>
  )
}
