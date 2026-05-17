// icons.jsx — Custom EMS iconography.
// Alarm severity uses distinct shapes per design-system.md (caution triangle, warning octagon, flame).
// Other icons drawn in a Lucide-style stroke (1.75px, round caps).

const STROKE = 1.75;

// Generic stroke icon wrapper
function StrokeIcon({ size = 18, color = 'currentColor', children, sw = STROKE }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
         style={{ display: 'block', flexShrink: 0 }}>
      {children}
    </svg>
  );
}

// ─── Alarm severity ─────────────────────────────────────────────
// Caution triangle (Warning) — yellow, exclamation
function IconWarning({ size = 16, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0 }}>
      <path d="M12 3 L22 20 L2 20 Z" fill={color} />
      <rect x="11.1" y="9" width="1.8" height="6" rx="0.6" fill="#000" fillOpacity="0.65"/>
      <circle cx="12" cy="17.2" r="1.05" fill="#000" fillOpacity="0.65"/>
    </svg>
  );
}

// Warning octagon (Alarm) — red
function IconAlarm({ size = 16, color }) {
  const r = 11.2, cx = 12, cy = 12;
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i + Math.PI / 8;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0 }}>
      <polygon points={pts.join(' ')} fill={color}/>
      <rect x="11.2" y="7.5" width="1.6" height="6.2" rx="0.5" fill="#fff" fillOpacity="0.95"/>
      <circle cx="12" cy="16" r="0.95" fill="#fff" fillOpacity="0.95"/>
    </svg>
  );
}

// Flame (Fire) — saturated red, animated pulse handled by parent
function IconFire({ size = 16, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0 }}>
      <path d="M12 2.5 C 12 6.5 9 7.8 8 10.5 C 7 13 8.5 15 10 15 C 9.6 13.6 10.2 12.2 11 11.5
               C 11 13.5 13 14 13 16 C 13 17 12.4 17.6 12 17.6
               C 14.5 17.6 17 15.4 17 12.2 C 17 9 14.5 7.5 14 5 C 13.6 3 12.5 2.5 12 2.5 Z"
            fill={color}/>
    </svg>
  );
}

// ─── Module type ────────────────────────────────────────────────
function IconBess({ size, color }) {
  return (
    <StrokeIcon size={size} color={color}>
      <rect x="4" y="6" width="16" height="13" rx="1.5"/>
      <path d="M9 4 L9 6 M15 4 L15 6"/>
      <path d="M11 11 L11 14 L9 14 L13 18 L13 15 L15 15 L11 11" fill={color} stroke="none"/>
    </StrokeIcon>
  );
}
function IconCompute({ size, color }) {
  return (
    <StrokeIcon size={size} color={color}>
      <rect x="3" y="9" width="18" height="6" rx="1"/>
      <circle cx="6" cy="12" r="0.5" fill={color} stroke="none"/>
      <circle cx="9" cy="12" r="0.5" fill={color} stroke="none"/>
      <path d="M14 12 L18 12"/>
      <path d="M7 9 L7 6 M12 9 L12 5 M17 9 L17 6"/>
      <path d="M7 15 L7 18 M12 15 L12 19 M17 15 L17 18"/>
    </StrokeIcon>
  );
}
function IconThermal({ size, color }) {
  return (
    <StrokeIcon size={size} color={color}>
      <path d="M10 4 a2 2 0 0 1 4 0 V13.5 a4 4 0 1 1 -4 0 Z"/>
      <circle cx="12" cy="17" r="1.6" fill={color} stroke="none"/>
      <path d="M12 8 L12 14"/>
    </StrokeIcon>
  );
}
function IconGrid({ size, color }) {
  return (
    <StrokeIcon size={size} color={color}>
      <path d="M5 21 L8 9 L16 9 L19 21"/>
      <path d="M7 13 L17 13 M6.4 17 L17.6 17"/>
      <path d="M10 9 L11 4 L13 4 L14 9"/>
    </StrokeIcon>
  );
}

// ─── Navigation ─────────────────────────────────────────────────
function IconOverview({ size, color }) {
  return (
    <StrokeIcon size={size} color={color}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1"/>
      <rect x="13.5" y="3.5" width="7" height="7" rx="1"/>
      <rect x="3.5" y="13.5" width="7" height="7" rx="1"/>
      <rect x="13.5" y="13.5" width="7" height="7" rx="1"/>
    </StrokeIcon>
  );
}
function IconModules({ size, color }) {
  return (
    <StrokeIcon size={size} color={color}>
      <path d="M12 3 L20 7 L12 11 L4 7 Z"/>
      <path d="M4 12 L12 16 L20 12"/>
      <path d="M4 17 L12 21 L20 17"/>
    </StrokeIcon>
  );
}
function IconEnergy({ size, color }) {
  return (
    <StrokeIcon size={size} color={color}>
      <path d="M13 2 L4 13 L11 13 L10 22 L20 10 L13 10 Z"/>
    </StrokeIcon>
  );
}
function IconAnalyst({ size, color }) {
  return (
    <StrokeIcon size={size} color={color}>
      <path d="M3 20 L9 14 L13 17 L21 8"/>
      <path d="M15 8 L21 8 L21 14"/>
    </StrokeIcon>
  );
}
function IconBell({ size, color }) {
  return (
    <StrokeIcon size={size} color={color}>
      <path d="M6 16 V11 a6 6 0 0 1 12 0 V16 L20 18 H4 Z"/>
      <path d="M10 21 a2 2 0 0 0 4 0"/>
    </StrokeIcon>
  );
}
function IconChevron({ size, color, dir = 'right' }) {
  const rot = { right: 0, down: 90, left: 180, up: 270 }[dir] || 0;
  return (
    <StrokeIcon size={size} color={color}>
      <g transform={`rotate(${rot} 12 12)`}>
        <path d="M9 6 L15 12 L9 18"/>
      </g>
    </StrokeIcon>
  );
}
function IconArrow({ size, color, dir = 'up' }) {
  const rot = { up: 0, right: 90, down: 180, left: 270 }[dir] || 0;
  return (
    <StrokeIcon size={size} color={color}>
      <g transform={`rotate(${rot} 12 12)`}>
        <path d="M12 19 L12 5 M6 11 L12 5 L18 11"/>
      </g>
    </StrokeIcon>
  );
}
function IconWrench({ size, color }) {
  return (
    <StrokeIcon size={size} color={color}>
      <path d="M14 4 a4 4 0 0 1 5 5 L9 19 a3 3 0 0 1 -4 -4 Z"/>
      <path d="M11 8 L16 13"/>
    </StrokeIcon>
  );
}
function IconPadlock({ size, color }) {
  return (
    <StrokeIcon size={size} color={color}>
      {/* shackle */}
      <path d="M8 11 V8 a4 4 0 0 1 8 0 V11"/>
      {/* body */}
      <rect x="5" y="11" width="14" height="9" rx="1.5"/>
      {/* keyhole */}
      <circle cx="12" cy="15" r="1.2"/>
      <path d="M12 16 V18"/>
    </StrokeIcon>
  );
}
function IconCheck({ size, color }) {
  return (
    <StrokeIcon size={size} color={color}>
      <path d="M5 12 L10 17 L19 7"/>
    </StrokeIcon>
  );
}
function IconBolt({ size, color }) {
  return (
    <StrokeIcon size={size} color={color}>
      <path d="M13 2 L5 13 H11 L9 22 L19 10 H13 Z"/>
    </StrokeIcon>
  );
}

Object.assign(window, {
  IconWarning, IconAlarm, IconFire,
  IconBess, IconCompute, IconThermal, IconGrid,
  IconOverview, IconModules, IconEnergy, IconAnalyst,
  IconBell, IconChevron, IconArrow, IconWrench, IconPadlock, IconCheck, IconBolt,
});
