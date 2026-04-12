export default function DialogueBubble({ role, content, isLoading }) {
  const isSystem = role === 'system'

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
        <div className="bubble-label bubble-label-system">WriteUp</div>
        <div className="bubble-system">
          <div className="loading-dots">
            <span /><span /><span />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      alignItems: isSystem ? 'flex-start' : 'flex-end'
    }}>
      <div className={`bubble-label ${isSystem ? 'bubble-label-system' : 'bubble-label-student'}`}>
        {isSystem ? 'WriteUp' : 'You'}
      </div>
      <div className={isSystem ? 'bubble-system' : 'bubble-student'}>
        {content && content.split('\n\n').map((para, i) => (
          <p key={i} style={{ margin: i === 0 ? 0 : '8px 0 0' }}>
            {para.split('\n').map((line, j) => (
              <span key={j}>
                {line}
                {j < para.split('\n').length - 1 && <br />}
              </span>
            ))}
          </p>
        ))}
      </div>
    </div>
  )
}
