export default function DraftCard({ draft, isSelected, hasInteracted, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'white',
        border: `1.5px solid ${isSelected ? 'var(--teal)' : 'var(--line)'}`,
        borderRadius: 'var(--radius)',
        padding: '12px 14px',
        cursor: 'pointer',
        transition: 'all 0.18s',
        boxShadow: isSelected ? '0 0 0 3px var(--teal-light)' : 'none'
      }}
      onMouseEnter={e => {
        if (!isSelected) e.currentTarget.style.borderColor = 'var(--teal-mid)'
      }}
      onMouseLeave={e => {
        if (!isSelected) e.currentTarget.style.borderColor = 'var(--line)'
      }}
    >
      {/* Author row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <div style={{
          width: '28px', height: '28px',
          borderRadius: '50%',
          background: draft.color || '#5b6fa0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: 600, color: 'white',
          flexShrink: 0
        }}>
          {draft.initials}
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>
            {draft.student_name}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--ink3)' }}>
            Grade {draft.grade}
          </div>
        </div>
        {hasInteracted && (
          <div style={{
            marginLeft: 'auto',
            fontSize: '11px',
            color: 'var(--color-text-success)',
            fontWeight: '500'
          }}>
            ✓ Responded
          </div>
        )}
      </div>

      {/* Topic */}
      <div style={{
        fontSize: '12px', color: 'var(--ink2)',
        fontWeight: 500, marginBottom: '4px'
      }}>
        {draft.topic}
      </div>
      <div style={{
        fontSize: '11px', color: 'var(--ink3)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
      }}>
        {draft.task}
      </div>

      {/* Meta chips */}
      <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
        <span className="chip chip-gray">
          {draft.comments.length} comment{draft.comments.length !== 1 ? 's' : ''}
        </span>
        {draft.questions.length > 0 && (
          <span className="chip chip-amber">
            {draft.questions.length} question{draft.questions.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  )
}
