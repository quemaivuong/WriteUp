export default function FeedbackCard({ errors }) {
  if (!errors || errors.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
      {errors.map((err, i) => (
        <div key={i} className="track-direct">
          <div className="track-label">Grammar — direct feedback</div>
          <div style={{ marginBottom: '6px' }}>
            <span style={{
              background: 'rgba(201,83,58,0.15)',
              padding: '1px 6px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '13px',
              color: 'var(--coral)'
            }}>
              "{err.surface}"
            </span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--ink2)', lineHeight: '1.65' }}>
            {err.message}
          </div>
          {err.textbook_reference && err.textbook_reference !== 'PENDING' && (
            <div style={{
              marginTop: '6px',
              fontSize: '11px',
              color: 'var(--coral)',
              fontWeight: 500
            }}>
              📖 {err.textbook_reference}
            </div>
          )}
          {err.agency_options && err.agency_options.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--ink3)', marginBottom: '4px', fontWeight: 600 }}>
                What would you like to do?
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {err.agency_options.map((opt, j) => (
                  <span key={j} style={{
                    fontSize: '12px',
                    padding: '3px 10px',
                    borderRadius: '99px',
                    background: 'var(--coral-light)',
                    color: 'var(--coral)',
                    border: '1px solid rgba(201,83,58,0.2)'
                  }}>
                    {opt}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
