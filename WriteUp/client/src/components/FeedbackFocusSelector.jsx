export default function FeedbackFocusSelector({ onSelect, disabled }) {
  const options = [
    {
      key: 'grammar',
      label: 'Grammar',
      description: 'Check my verbs, articles, and sentence structure',
      icon: '✏️'
    },
    {
      key: 'vocabulary',
      label: 'Vocabulary',
      description: 'Help me use more varied and precise words',
      icon: '📖'
    },
    {
      key: 'ideas',
      label: 'Ideas and flow',
      description: 'Check if my ideas are clear and well connected',
      icon: '💡'
    },
    {
      key: 'all',
      label: 'Everything',
      description: 'Give me full feedback on all areas',
      icon: '🔍'
    }
  ]

  return (
    <div style={{
      background: 'white',
      border: '1.5px solid var(--line)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--line)',
        background: 'var(--paper2)',
        fontSize: '13px',
        fontWeight: '600',
        color: 'var(--ink2)'
      }}>
        What would you like feedback on?
      </div>
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {options.map(opt => (
          <button
            key={opt.key}
            onClick={() => onSelect(opt.key)}
            disabled={disabled}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1.5px solid var(--line)',
              background: 'white',
              cursor: disabled ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
              opacity: disabled ? 0.5 : 1
            }}
            onMouseEnter={e => {
              if (!disabled) {
                e.currentTarget.style.borderColor = 'var(--teal-mid)'
                e.currentTarget.style.background = 'var(--teal-light)'
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--line)'
              e.currentTarget.style.background = 'white'
            }}
          >
            <span style={{ fontSize: '20px', flexShrink: 0 }}>{opt.icon}</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--ink)' }}>
                {opt.label}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ink3)', marginTop: '2px' }}>
                {opt.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
