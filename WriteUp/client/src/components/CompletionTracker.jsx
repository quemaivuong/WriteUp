export default function CompletionTracker({ steps }) {
  return (
    <div style={{
      background: 'var(--color-background-primary)',
      border: '0.5px solid var(--color-border-tertiary)',
      borderRadius: 'var(--border-radius-lg)',
      padding: '12px 14px',
      marginBottom: '12px'
    }}>
      <div style={{
        fontSize: '11px', fontWeight: '500',
        textTransform: 'uppercase', letterSpacing: '0.06em',
        color: 'var(--color-text-secondary)',
        marginBottom: '10px'
      }}>
        Your progress
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {steps.map((step, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <div style={{
              width: '18px', height: '18px', borderRadius: '50%',
              background: step.done
                ? 'var(--color-background-success)'
                : 'var(--color-background-secondary)',
              border: `0.5px solid ${step.done
                ? 'var(--color-border-success)'
                : 'var(--color-border-tertiary)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, fontSize: '11px',
              color: step.done ? 'var(--color-text-success)' : 'var(--color-text-secondary)'
            }}>
              {step.done ? '✓' : i + 1}
            </div>
            <div style={{
              fontSize: '13px',
              color: step.done
                ? 'var(--color-text-success)'
                : step.active
                  ? 'var(--color-text-primary)'
                  : 'var(--color-text-secondary)',
              fontWeight: step.active ? '500' : '400'
            }}>
              {step.label}
            </div>
          </div>
        ))}
      </div>
      {steps.every(s => s.done) && (
        <div style={{
          marginTop: '10px',
          padding: '8px 12px',
          background: 'var(--color-background-success)',
          borderRadius: 'var(--border-radius-md)',
          fontSize: '12px',
          color: 'var(--color-text-success)',
          fontWeight: '500'
        }}>
          All done! Your work for this task is complete.
        </div>
      )}
    </div>
  )
}
