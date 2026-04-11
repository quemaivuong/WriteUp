import { useState } from 'react'

function ErrorCard({ error, index, onAction, disabled }) {
  const [replyText, setReplyText] = useState('')
  const [activeAction, setActiveAction] = useState(null)

  function handleFixThis() {
    const prefill = `I want to fix "${error.surface}" — ${error.message?.split('.')[0]}.`
    setReplyText(prefill)
    setActiveAction('fix')
  }

  function handleCheckAll() {
    onAction(`Can you check all the verbs in my paragraph for the same pattern as "${error.surface}"?`, 'student_answer')
    setActiveAction(null)
  }

  function handleKeep() {
    onAction(`I'll keep "${error.surface}" as is.`, 'student_keeps')
    setActiveAction(null)
  }

  function handleDisagree() {
    const prefill = `I disagree — I think "${error.surface}" is correct because `
    setReplyText(prefill)
    setActiveAction('disagree')
  }

  function handleSend() {
    if (!replyText.trim()) return
    const turnType = activeAction === 'disagree' ? 'student_pushback' : 'student_revision'
    onAction(replyText.trim(), turnType)
    setReplyText('')
    setActiveAction(null)
  }

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
          background: 'var(--color-background-danger)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: '500',
          color: 'var(--color-text-danger)', flexShrink: 0
        }}>
          {index}
        </div>
        <div style={{
          fontSize: '11px', fontWeight: '500',
          textTransform: 'uppercase', letterSpacing: '0.06em',
          color: 'var(--color-text-danger)'
        }}>
          Grammar — direct feedback
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '12px 14px' }}>
        {/* Surface phrase */}
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '13px',
          color: 'var(--color-text-danger)',
          background: 'var(--color-background-secondary)',
          padding: '6px 10px', borderRadius: 'var(--border-radius-md)',
          marginBottom: '8px'
        }}>
          "{error.surface}"
        </div>

        {/* Message */}
        <div style={{
          fontSize: '13px', color: 'var(--color-text-primary)',
          lineHeight: '1.65', marginBottom: '6px'
        }}>
          {error.message}
        </div>

        {/* Textbook reference */}
        {error.textbook_reference && error.textbook_reference !== 'PENDING' && (
          <div style={{
            fontSize: '12px', color: 'var(--color-text-secondary)',
            marginBottom: '10px'
          }}>
            See {error.textbook_reference}
          </div>
        )}

        {/* Action buttons */}
        {!activeAction && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              onClick={handleFixThis}
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
              Fix this
            </button>
            <button
              onClick={handleCheckAll}
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
              Check all verbs
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

        {/* Pre-filled textarea */}
        {activeAction && (
          <div style={{ marginTop: '8px' }}>
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
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

export default function FeedbackCard({ errors, onAction, disabled }) {
  if (!errors || errors.length === 0) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
      {errors.map((err, i) => (
        <ErrorCard
          key={i}
          error={err}
          index={i + 1}
          onAction={onAction}
          disabled={disabled}
        />
      ))}
    </div>
  )
}
