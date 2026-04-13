import { useState } from 'react'

export default function StructureCard({ formatCheck, topicCheck, onAction, disabled, taskInfo }) {
  const [topicDisagreeOpen, setTopicDisagreeOpen] = useState(false)
  const [topicDisagreeText, setTopicDisagreeText] = useState('')
  const [formatDisagreeOpen, setFormatDisagreeOpen] = useState(false)
  const [formatDisagreeText, setFormatDisagreeText] = useState('')

  const hasFormatIssue = formatCheck && !formatCheck.correct_format_used
  const hasTopicIssue = topicCheck && !topicCheck.on_topic

  if (!hasFormatIssue && !hasTopicIssue) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
      {hasTopicIssue && (
        <div style={{
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-lg)',
          overflow: 'hidden'
        }}>
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
            }}>!</div>
            <div style={{
              fontSize: '11px', fontWeight: '500',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              color: 'var(--color-text-danger)'
            }}>
              Topic — check this first
            </div>
          </div>
          <div style={{ padding: '12px 14px' }}>
            <div style={{
              fontSize: '13px', color: 'var(--color-text-primary)',
              lineHeight: '1.65', marginBottom: '10px'
            }}>
              {topicCheck.topic_issue}
            </div>
            {!topicDisagreeOpen ? (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setTopicDisagreeOpen(true)}
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
            ) : (
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  Explain why you think your paragraph is on topic:
                </div>
                <textarea
                  value={topicDisagreeText}
                  onChange={e => setTopicDisagreeText(e.target.value)}
                  placeholder="I think my paragraph is on topic because..."
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
                    onClick={() => {
                      if (topicDisagreeText.trim()) {
                        onAction(
                          `I disagree that I am off topic — my paragraph is about the right subject because ${topicDisagreeText.trim()}`,
                          'student_pushback'
                        )
                        setTopicDisagreeOpen(false)
                        setTopicDisagreeText('')
                      }
                    }}
                    disabled={disabled || !topicDisagreeText.trim()}
                    style={{
                      fontSize: '12px', padding: '5px 14px',
                      borderRadius: 'var(--border-radius-md)',
                      border: '0.5px solid var(--color-border-secondary)',
                      background: 'var(--color-background-primary)',
                      color: 'var(--color-text-primary)',
                      cursor: 'pointer',
                      opacity: (!topicDisagreeText.trim() || disabled) ? 0.4 : 1
                    }}
                  >
                    Send
                  </button>
                  <button
                    onClick={() => { setTopicDisagreeOpen(false); setTopicDisagreeText('') }}
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
      )}

      {!hasTopicIssue && hasFormatIssue && (
        <div style={{
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-lg)',
          overflow: 'hidden'
        }}>
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
            }}>!</div>
            <div style={{
              fontSize: '11px', fontWeight: '500',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              color: 'var(--color-text-warning)'
            }}>
              Format — check this first
            </div>
          </div>
          <div style={{ padding: '12px 14px' }}>
            <div style={{
              fontSize: '13px', color: 'var(--color-text-primary)',
              lineHeight: '1.65', marginBottom: '10px'
            }}>
              {formatCheck.format_issue}
            </div>
            {!formatDisagreeOpen ? (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setFormatDisagreeOpen(true)}
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
            ) : (
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  Explain why you think your format is correct:
                </div>
                <textarea
                  value={formatDisagreeText}
                  onChange={e => setFormatDisagreeText(e.target.value)}
                  placeholder="I think my format is correct because..."
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
                    onClick={() => {
                      if (formatDisagreeText.trim()) {
                        onAction(
                          `I disagree about the format — I think my format is correct because ${formatDisagreeText.trim()}`,
                          'student_pushback'
                        )
                        setFormatDisagreeOpen(false)
                        setFormatDisagreeText('')
                      }
                    }}
                    disabled={disabled || !formatDisagreeText.trim()}
                    style={{
                      fontSize: '12px', padding: '5px 14px',
                      borderRadius: 'var(--border-radius-md)',
                      border: '0.5px solid var(--color-border-secondary)',
                      background: 'var(--color-background-primary)',
                      color: 'var(--color-text-primary)',
                      cursor: 'pointer',
                      opacity: (!formatDisagreeText.trim() || disabled) ? 0.4 : 1
                    }}
                  >
                    Send
                  </button>
                  <button
                    onClick={() => { setFormatDisagreeOpen(false); setFormatDisagreeText('') }}
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
      )}
    </div>
  )
}
