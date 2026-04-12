export default function StructureCard({ formatCheck, topicCheck, onAction, disabled, taskInfo }) {
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
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => onAction('I disagree that I am off topic — my paragraph is about the right subject because ', 'student_pushback')}
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
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => onAction('I disagree about the format — I think my format is correct because ', 'student_pushback')}
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
          </div>
        </div>
      )}
    </div>
  )
}
