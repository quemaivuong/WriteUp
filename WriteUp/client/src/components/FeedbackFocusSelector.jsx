export default function FeedbackFocusSelector({ onSelect, disabled, errorSummary }) {
  const grammarCount = errorSummary?.directFeedback?.length || 0
  const vocabCount = errorSummary?.socraticQuestions?.filter(
    q => q.track === 'soft_socratic'
  ).length || 0
  const logicCount = errorSummary?.socraticQuestions?.filter(
    q => q.track === 'full_socratic'
  ).length || 0

  const hasGrammar = grammarCount > 0
  const hasVocab = vocabCount > 0
  const hasLogic = logicCount > 0
  const hasAny = hasGrammar || hasVocab || hasLogic

  const options = [
    {
      key: 'grammar',
      label: 'Grammar',
      description: hasGrammar
        ? `${grammarCount} issue${grammarCount > 1 ? 's' : ''} found`
        : 'No grammar issues found',
      icon: '✏️',
      disabled: !hasGrammar
    },
    {
      key: 'vocabulary',
      label: 'Vocabulary',
      description: hasVocab
        ? `${vocabCount} pattern${vocabCount > 1 ? 's' : ''} found`
        : 'No vocabulary issues found',
      icon: '📖',
      disabled: !hasVocab
    },
    {
      key: 'ideas',
      label: 'Ideas and flow',
      description: hasLogic
        ? `${logicCount} suggestion${logicCount > 1 ? 's' : ''} found`
        : 'No logic issues found',
      icon: '💡',
      disabled: !hasLogic
    },
    {
      key: 'all',
      label: 'Everything',
      description: hasAny
        ? 'Work through all areas'
        : 'No issues found',
      icon: '🔍',
      disabled: false
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
        What would you like to work on first?
      </div>
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {options.map(opt => (
          <button
            key={opt.key}
            onClick={() => !opt.disabled && onSelect(opt.key)}
            disabled={disabled || opt.disabled}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 14px',
              borderRadius: '8px',
              border: `1.5px solid ${opt.disabled ? 'var(--paper2)' : 'var(--line)'}`,
              background: opt.disabled ? 'var(--paper2)' : 'white',
              cursor: (disabled || opt.disabled) ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
              opacity: opt.disabled ? 0.5 : 1
            }}
            onMouseEnter={e => {
              if (!disabled && !opt.disabled) {
                e.currentTarget.style.borderColor = 'var(--teal-mid)'
                e.currentTarget.style.background = 'var(--teal-light)'
              }
            }}
            onMouseLeave={e => {
              if (!opt.disabled) {
                e.currentTarget.style.borderColor = 'var(--line)'
                e.currentTarget.style.background = 'white'
              }
            }}
          >
            <span style={{ fontSize: '20px', flexShrink: 0 }}>{opt.icon}</span>
            <div>
              <div style={{
                fontSize: '14px', fontWeight: '600',
                color: opt.disabled ? 'var(--ink3)' : 'var(--ink)'
              }}>
                {opt.label}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ink3)', marginTop: '2px' }}>
                {opt.description}
              </div>
            </div>
            {!opt.disabled && opt.key !== 'all' && (
              <div style={{
                marginLeft: 'auto',
                width: '8px', height: '8px',
                borderRadius: '50%',
                background: opt.key === 'grammar' ? 'var(--coral)' :
                             opt.key === 'vocabulary' ? 'var(--amber)' : 'var(--teal)',
                flexShrink: 0
              }} />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
