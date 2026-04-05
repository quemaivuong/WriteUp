export default function WordCounter({ text, target }) {
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length
  const [min, max] = target ? target.split('–').map(s => parseInt(s)) : [0, 999]
  const isLow = words < min
  const isGood = words >= min && words <= max
  const isHigh = words > max

  const color = isGood ? 'var(--green)' : isHigh ? 'var(--coral)' : 'var(--ink3)'

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '12px',
      color
    }}>
      <span style={{ fontWeight: 500 }}>{words} words</span>
      {target && (
        <span style={{ color: 'var(--ink3)' }}>
          · target: {target}
        </span>
      )}
      {isGood && <span style={{ color: 'var(--green)', fontSize: '11px' }}>✓ Good length</span>}
      {isHigh && <span style={{ color: 'var(--coral)', fontSize: '11px' }}>⚠ Too long</span>}
    </div>
  )
}
