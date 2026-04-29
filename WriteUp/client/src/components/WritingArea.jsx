import WordCounter from './WordCounter'

export default function WritingArea({
  value,
  onChange,
  placeholder,
  wordTarget,
  disabled
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || 'Start writing here…'}
        disabled={disabled}
        rows={10}
        style={{
          width: '100%',
          border: '1.5px solid var(--line)',
          borderLeft: '3px solid var(--line)',
          borderRadius: '8px',
          padding: '16px',
          fontFamily: 'Lora, Georgia, serif',
          fontSize: '15px',
          lineHeight: '1.9',
          color: 'var(--ink)',
          background: disabled ? 'var(--paper2)' : '#fdfcf9',
          resize: 'vertical',
          transition: 'border-color 0.15s',
          outline: 'none'
        }}
        onFocus={e => {
          e.target.style.borderColor = 'var(--teal-mid)'
          e.target.style.borderLeftColor = '#2a7c6f'
          e.target.style.borderLeftWidth = '3px'
        }}
        onBlur={e => {
          e.target.style.borderColor = 'var(--line)'
          e.target.style.borderLeftColor = 'var(--line)'
        }}
      />
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <WordCounter text={value} target={wordTarget} />
        {disabled && (
          <span style={{ fontSize: '12px', color: 'var(--ink3)' }}>
            Responding to feedback…
          </span>
        )}
      </div>
    </div>
  )
}
