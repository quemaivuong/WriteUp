import { Link, useLocation } from 'react-router-dom'

export default function Navbar({ studentName, grade, draftSubmitted }) {
  const location = useLocation()
  const onWrite = location.pathname === '/write'
  const onPeer = location.pathname === '/peer'

  return (
    <header style={{
      background: '#1a1814',
      color: '#faf8f4',
      padding: '13px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 0 rgba(255,255,255,0.06)',
      borderBottom: '1px solid rgba(255,255,255,0.08)'
    }}>
      {/* Logo */}
      <div style={{
        fontFamily: 'Lora, serif',
        fontSize: '20px',
        fontWeight: 600,
        letterSpacing: '-0.3px'
      }}>
        Write<span style={{ color: '#4ca898' }}>Up</span>
      </div>

      {/* Nav tabs */}
      <nav style={{
        display: 'flex',
        gap: '4px',
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '8px',
        padding: '4px'
      }}>
        <Link
          to="/write"
          style={{
            padding: '7px 18px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            color: onWrite ? '#faf8f4' : 'rgba(250,248,244,0.55)',
            background: onWrite ? '#2a7c6f' : 'transparent',
            transition: 'all 0.2s',
            textDecoration: 'none'
          }}
        >
          ✏️ Write
        </Link>

        {draftSubmitted ? (
          <Link
            to="/peer"
            style={{
              padding: '7px 18px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              color: onPeer ? '#faf8f4' : 'rgba(250,248,244,0.55)',
              background: onPeer ? '#2a7c6f' : 'transparent',
              transition: 'all 0.2s',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            👥 Peer Workshop
            {!onPeer && (
              <span style={{
                width: '7px', height: '7px',
                borderRadius: '50%',
                background: '#b87d2a',
                display: 'inline-block',
                flexShrink: 0
              }} />
            )}
          </Link>
        ) : (
          <span
            title="Submit a draft first to unlock peer review"
            style={{
              padding: '7px 18px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'rgba(250,248,244,0.25)',
              cursor: 'not-allowed',
              userSelect: 'none'
            }}
          >
            👥 Peer Workshop
          </span>
        )}
      </nav>

      {/* Student badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '13px',
        color: 'rgba(250,248,244,0.7)'
      }}>
        <span style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '4px 12px',
          borderRadius: '99px',
          fontSize: '12px',
          fontWeight: 600,
          color: '#4ca898'
        }}>
          Grade {grade}
        </span>
        <div style={{
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          background: '#2a7c6f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 600,
          color: 'white'
        }}>
          {studentName.slice(0, 2).toUpperCase()}
        </div>
        <span>{studentName}</span>
      </div>
    </header>
  )
}
