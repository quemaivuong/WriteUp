import { useState } from 'react'

export default function CommentThread({ comments, onPost }) {
  const [value, setValue] = useState('')

  function handlePost() {
    if (!value.trim()) return
    onPost(value.trim())
    setValue('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Comments list */}
      {comments.length === 0 ? (
        <div style={{ fontSize: '13px', color: 'var(--ink3)', padding: '8px 0' }}>
          No comments yet — be the first to respond.
        </div>
      ) : (
        comments.map(c => (
          <div key={c.id} style={{ display: 'flex', gap: '10px' }}>
            <div style={{
              width: '28px', height: '28px',
              borderRadius: '50%',
              background: c.color || '#5b6fa0',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px', fontWeight: 600,
              color: 'white', flexShrink: 0, marginTop: '2px'
            }}>
              {c.initials}
            </div>
            <div style={{
              flex: 1,
              background: 'var(--paper)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              padding: '10px 13px'
            }}>
              <div style={{
                fontSize: '11px', color: 'var(--ink3)',
                marginBottom: '4px',
                display: 'flex', gap: '8px'
              }}>
                <strong style={{ color: 'var(--ink2)' }}>{c.author}</strong>
                <span>{c.created_at}</span>
              </div>
              <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--ink)' }}>
                {c.text}
              </div>
            </div>
          </div>
        ))
      )}

      {/* Comment input */}
      <div style={{ display: 'flex', gap: '8px', paddingTop: '8px',
        borderTop: '1px solid var(--line)', marginTop: '4px' }}>
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Leave a comment on this draft…"
          rows={2}
          className="textarea"
          style={{ flex: 1, fontSize: '13px' }}
        />
        <button
          onClick={handlePost}
          disabled={!value.trim()}
          className="btn btn-primary btn-sm"
          style={{ alignSelf: 'flex-end' }}
        >
          Post
        </button>
      </div>
    </div>
  )
}
