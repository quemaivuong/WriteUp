export default function SocraticCard({ questions }) {
  if (!questions || questions.length === 0) return null

  const trackLabels = {
    soft_socratic: { label: 'Vocabulary — think about this', color: 'var(--amber)' },
    full_socratic: { label: 'Logic / coherence — think about this', color: 'var(--amber)' }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
      {questions.map((q, i) => {
        const track = trackLabels[q.track] || trackLabels.full_socratic
        return (
          <div key={i} className="track-socratic">
            <div className="track-label">{track.label}</div>
            {q.surface && (
              <div style={{ marginBottom: '6px' }}>
                <span style={{
                  background: 'rgba(184,125,42,0.15)',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  color: 'var(--amber)'
                }}>
                  "{q.surface}"
                </span>
              </div>
            )}
            <div style={{
              fontSize: '14px',
              color: 'var(--ink)',
              lineHeight: '1.7',
              fontWeight: 500
            }}>
              {q.question}
            </div>
            {q.attribution && (
              <div style={{
                marginTop: '8px',
                fontSize: '12px',
                color: 'var(--ink3)',
                lineHeight: '1.6',
                borderTop: '1px solid rgba(184,125,42,0.2)',
                paddingTop: '8px'
              }}>
                💡 {q.attribution}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
