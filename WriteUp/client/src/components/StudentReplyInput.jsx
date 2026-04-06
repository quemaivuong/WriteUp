import { useState } from 'react'

export default function StudentReplyInput({
  onSend,
  onKeep,
  onPushback,
  disabled,
  placeholder,
  showKeepOption,
  showPushbackOption
}) {
  const [value, setValue] = useState('')

  function handleSend() {
    if (!value.trim()) return
    onSend(value.trim())
    setValue('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSend()
    }
  }

  return (
    <div style={{
      border: '1.5px solid var(--line)',
      borderRadius: '10px',
      background: 'white',
      overflow: 'hidden',
      transition: 'border-color 0.15s'
    }}
      onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--teal-mid)'}
      onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--line)'}
    >
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder || 'Type your response… (Cmd+Enter to send)'}
        rows={3}
        style={{
          width: '100%',
          border: 'none',
          padding: '12px 14px',
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          lineHeight: '1.6',
          color: 'var(--ink)',
          background: 'transparent',
          resize: 'none',
          outline: 'none'
        }}
      />
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderTop: '1px solid var(--paper2)',
        background: 'var(--paper)',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {showKeepOption && (
            <button
              onClick={onKeep}
              disabled={disabled}
              className="btn btn-ghost btn-sm"
              title="Keep your original writing and move on"
            >
              Keep as is
            </button>
          )}
          {showPushbackOption && (
            <button
              onClick={() => {
                if (value.trim()) {
                  onPushback(value.trim())
                  setValue('')
                }
              }}
              disabled={disabled || !value.trim()}
              className="btn btn-outline btn-sm"
              title="Disagree with this feedback"
            >
              I disagree
            </button>
          )}
        </div>
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="btn btn-primary btn-sm"
        >
          Send →
        </button>
      </div>
    </div>
  )
}
