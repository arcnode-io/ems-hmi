// phone-shell.jsx — Themed Android-style phone frame.
// Renders bezel + status bar + the screen content area (we own everything below the status bar).
// Theme-aware: every chrome surface uses tokens.

function PhoneStatusBar({ t, time = '9:41' }) {
  const c = t.statusBarFg;
  return (
    <div style={{
      height: 36, padding: '0 18px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontFamily: 'system-ui, -apple-system, Roboto, sans-serif',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: c, letterSpacing: 0.2 }}>{time}</span>
      <div style={{
        position: 'absolute', left: '50%', top: 10, transform: 'translateX(-50%)',
        width: 22, height: 22, borderRadius: '50%',
        background: t.name === 'sovereign' ? '#000' : '#1a1a1a',
        border: `1.5px solid ${t.name === 'sovereign' ? '#1a1a1a' : '#2a2218'}`,
      }}/>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {/* signal */}
        <svg width="14" height="11" viewBox="0 0 14 11">
          <rect x="0"  y="7" width="2.4" height="4" rx="0.4" fill={c}/>
          <rect x="3.6" y="5" width="2.4" height="6" rx="0.4" fill={c}/>
          <rect x="7.2" y="2.5" width="2.4" height="8.5" rx="0.4" fill={c}/>
          <rect x="10.8" y="0" width="2.4" height="11" rx="0.4" fill={c}/>
        </svg>
        {/* wifi */}
        <svg width="14" height="11" viewBox="0 0 14 11">
          <path d="M7 3 C9.2 3 11.2 3.8 12.6 5.2 L13.5 4.3 C11.8 2.6 9.5 1.5 7 1.5 C4.5 1.5 2.2 2.6 0.5 4.3 L1.4 5.2 C2.8 3.8 4.8 3 7 3 Z" fill={c}/>
          <path d="M7 6.2 C8.2 6.2 9.3 6.7 10.1 7.5 L11 6.6 C9.9 5.5 8.5 4.8 7 4.8 C5.5 4.8 4.1 5.5 3 6.6 L3.9 7.5 C4.7 6.7 5.8 6.2 7 6.2 Z" fill={c}/>
          <circle cx="7" cy="9.5" r="1.2" fill={c}/>
        </svg>
        {/* battery */}
        <svg width="22" height="11" viewBox="0 0 22 11">
          <rect x="0.5" y="0.5" width="19" height="10" rx="2.5" stroke={c} strokeOpacity="0.45" fill="none"/>
          <rect x="2"   y="2"   width="16" height="7"  rx="1.5" fill={c}/>
          <path d="M21 4 V7 C21.5 6.8 21.8 6.4 21.8 6 C21.8 5.6 21.5 5.2 21 4 Z" fill={c} fillOpacity="0.55"/>
        </svg>
      </div>
    </div>
  );
}

function PhoneGestureBar({ t }) {
  return (
    <div style={{
      height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <div style={{
        width: 110, height: 4, borderRadius: 2,
        background: t.statusBarFg, opacity: 0.5,
      }}/>
    </div>
  );
}

function PhoneShell({ t, children, bottom = null, time = '9:41', width = 380, height = 820 }) {
  return (
    <div style={{
      width, height,
      borderRadius: 38,
      background: t.deviceFrame,
      padding: 8,
      boxShadow: t.name === 'sovereign'
        ? '0 30px 80px rgba(0,0,0,0.55), 0 4px 14px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.04)'
        : '0 30px 80px rgba(40,30,18,0.18), 0 4px 14px rgba(40,30,18,0.10), inset 0 0 0 1px rgba(255,255,255,0.6)',
      boxSizing: 'border-box', flexShrink: 0,
    }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: 30, overflow: 'hidden',
        background: t.bg, position: 'relative',
        display: 'flex', flexDirection: 'column',
      }}>
        <PhoneStatusBar t={t} time={time}/>
        <div style={{
          flex: '1 1 0', minHeight: 0, overflow: 'auto', position: 'relative',
          fontFamily: t.fontBody, color: t.text,
        }}>
          {children}
        </div>
        {bottom}
        <PhoneGestureBar t={t}/>
      </div>
    </div>
  );
}

window.PhoneShell = PhoneShell;
