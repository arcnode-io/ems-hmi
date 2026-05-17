// modules-screen.jsx — Modules list (`/modules`) at phone breakpoint.
// Spec: ems-hmi-ia-brief.md §6.2 "Modules" + §7.6 mobile adaptation.

// Per-class measurement specs — what 3 things matter at a glance for each module type.
// These are the operator's "is this thing healthy" peripheral-vision signals.
const MODULES = [
  {
    id: 'bess-02', name: 'BESS-02', cls: 'bess', icon: 'bess',
    sub: 'lithium · 2 MWh',
    status: 'alarm', alarms: 1,
    metrics: [
      { l: 'SoC',     v: '67',   u: '%',  color: 'bess' },
      { l: 'Power',   v: '−42',  u: 'kW', color: 'text' },
      { l: 'Spread',  v: '142',  u: 'mV', color: 'alarm' },
    ],
  },
  {
    id: 'compute-s04', name: 'COMPUTE-S04', cls: 'compute', icon: 'compute',
    sub: '8 servers · H100 · DLC',
    status: 'warn', alarms: 1,
    metrics: [
      { l: 'Util',     v: '88',   u: '%',  color: 'compute' },
      { l: 'CDU out',  v: '38.4', u: '°C', color: 'warn' },
      { l: 'Draw',     v: '184',  u: 'kW', color: 'text' },
    ],
  },
  {
    id: 'compute-s14', name: 'COMPUTE-S14', cls: 'compute', icon: 'compute',
    sub: '8 servers · H100 · DLC',
    status: 'ok', alarms: 0,
    metrics: [
      { l: 'Util',     v: '94',  u: '%',  color: 'compute' },
      { l: 'CDU out',  v: '34.1', u: '°C', color: 'text' },
      { l: 'Cap',      v: '942/1000', u: 'W', color: 'text' },
    ],
  },
  {
    id: 'bess-01', name: 'BESS-01', cls: 'bess', icon: 'bess',
    sub: 'lithium · 2 MWh',
    status: 'ok', alarms: 0,
    metrics: [
      { l: 'SoC',     v: '81',   u: '%',  color: 'bess' },
      { l: 'Power',   v: '0',    u: 'kW', color: 'text' },
      { l: 'Spread',  v: '24',   u: 'mV', color: 'text' },
    ],
  },
  {
    id: 'grid-01', name: 'GRID-01', cls: 'grid', icon: 'grid',
    sub: 'PCS · grid-following',
    status: 'ok', alarms: 0,
    metrics: [
      { l: 'Import',  v: '142',  u: 'kW', color: 'grid' },
      { l: 'Freq',    v: '60.01', u: 'Hz', color: 'text' },
      { l: 'Breaker', v: 'CLSD', u: '',   color: 'ok' },
    ],
  },
  {
    id: 'compute-edge', name: 'COMPUTE-EDGE', cls: 'compute', icon: 'compute',
    sub: '4 servers · L40S · air',
    status: 'offline', alarms: 0,
    metrics: [
      { l: 'Util',     v: '—',   u: '',   color: 'soft' },
      { l: 'Draw',     v: '—',   u: '',   color: 'soft' },
      { l: 'Headroom', v: '—',   u: '',   color: 'soft' },
    ],
  },
];

const FILTERS = [
  { id: 'all',      label: 'All',     count: 13 },
  { id: 'bess',     label: 'BESS',    count: 2 },
  { id: 'compute',  label: 'Compute', count: 3 },
  { id: 'grid',     label: 'Grid',    count: 1 },
];

// ─── Modules top bar (replaces Overview's TopBar) ───
function ModulesTopBar({ t }) {
  const isSov = t.name === 'sovereign';
  return (
    <div style={{
      padding: `10px ${SPACE[4]}px 10px`,
      borderBottom: `1px solid ${t.border}`,
      background: t.bg,
      display: 'flex', alignItems: 'center', gap: SPACE[3],
      flexShrink: 0,
    }}>
      <button style={{
        background: 'transparent', border: 'none', padding: 0,
        width: 28, height: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0,
      }}>
        <IconChevron size={20} color={t.textMid} dir="left"/>
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: t.fontHeading, fontSize: 20, lineHeight: 1.15,
          letterSpacing: isSov ? 0.5 : 0,
          fontWeight: isSov ? 400 : 500,
          color: t.text,
          textTransform: isSov ? 'uppercase' : 'none',
          whiteSpace: 'nowrap',
        }}>Modules</div>
        <div style={{
          fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.15,
          color: t.textSoft, marginTop: 1, textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>13 devices · Brookside DC-1</div>
      </div>
      <div style={{ position: 'relative', width: 32, height: 32,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0 }}>
        <IconBell size={20} color={t.textMid}/>
        <div style={{
          position: 'absolute', top: 2, right: 2,
          minWidth: 16, height: 16, padding: '0 4px',
          borderRadius: 8, background: t.statusAlarm,
          color: '#fff', fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1.5px solid ${t.bg}`,
        }}>2</div>
      </div>
    </div>
  );
}

// ─── SLD CTA — the spec's "Link to SLD at the top" ───
function SldCta({ t }) {
  const isSov = t.name === 'sovereign';
  return (
    <button style={{
      width: `calc(100% - ${SPACE[4] * 2}px)`,
      margin: `${SPACE[3]}px ${SPACE[4]}px 0`,
      padding: `${SPACE[3]}px ${SPACE[4]}px`,
      background: isSov ? t.accentFaint : t.accentFaint,
      border: `1px solid ${t.accent}55`,
      borderRadius: RADIUS[3],
      display: 'flex', alignItems: 'center', gap: SPACE[3],
      cursor: 'pointer', textAlign: 'left',
      color: t.text,
    }}>
      {/* mini SLD glyph */}
      <svg width="38" height="32" viewBox="0 0 38 32" style={{ flexShrink: 0 }}>
        {/* horizontal bus */}
        <line x1="3"  y1="16" x2="35" y2="16" stroke={t.accent} strokeWidth="1.5"/>
        {/* upper drops */}
        <line x1="9"  y1="16" x2="9"  y2="6"  stroke={t.accent} strokeWidth="1.25"/>
        <line x1="19" y1="16" x2="19" y2="6"  stroke={t.accent} strokeWidth="1.25"/>
        <line x1="29" y1="16" x2="29" y2="6"  stroke={t.accent} strokeWidth="1.25"/>
        {/* upper devices (rects) */}
        <rect x="6.5" y="2" width="5" height="4" rx="0.5" fill={t.accent}/>
        <rect x="16.5" y="2" width="5" height="4" rx="0.5" fill={t.accent}/>
        <rect x="26.5" y="2" width="5" height="4" rx="0.5" fill={t.accent}/>
        {/* lower drops */}
        <line x1="14" y1="16" x2="14" y2="26" stroke={t.accent} strokeWidth="1.25"/>
        <line x1="24" y1="16" x2="24" y2="26" stroke={t.accent} strokeWidth="1.25"/>
        {/* lower devices (circles) */}
        <circle cx="14" cy="28" r="2" fill="none" stroke={t.accent} strokeWidth="1.25"/>
        <circle cx="24" cy="28" r="2" fill="none" stroke={t.accent} strokeWidth="1.25"/>
      </svg>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: t.fontHeading, fontSize: 16, lineHeight: 1.2,
          textTransform: isSov ? 'uppercase' : 'none',
          letterSpacing: isSov ? 0.4 : 0,
          fontWeight: isSov ? 400 : 500,
          color: t.text,
        }}>Single line diagram</div>
        <div style={{
          fontFamily: t.fontBody, fontSize: 11, color: t.textMid, marginTop: 1,
        }}>Spatial view · live MQTT bindings</div>
      </div>
      <IconChevron size={18} color={t.accent}/>
    </button>
  );
}

// ─── Filter chip row ───
function FilterRow({ t, active = 'all', onSelect }) {
  return (
    <div style={{
      marginTop: SPACE[3],
      paddingLeft: SPACE[4], paddingRight: SPACE[4],
      overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none',
      WebkitOverflowScrolling: 'touch',
    }}>
      <div style={{ display: 'flex', gap: 6, paddingRight: SPACE[2] }}>
        {FILTERS.map(f => {
          const isActive = active === f.id;
          return (
            <button key={f.id}
              onClick={() => onSelect && onSelect(f.id)}
              style={{
                padding: '6px 12px',
                background: isActive ? t.text : 'transparent',
                color: isActive ? t.bg : t.textMid,
                border: `1px solid ${isActive ? t.text : t.border}`,
                borderRadius: RADIUS.full,
                fontFamily: t.fontLabel, fontSize: 11, fontWeight: 600,
                letterSpacing: 0.15, textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                cursor: 'pointer', flexShrink: 0,
              }}>
              {f.label}
              <span style={{
                marginLeft: 6, fontWeight: 400,
                color: isActive ? t.bg : t.textSoft,
                opacity: 0.85,
              }}>{f.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Status badge — the Tier-1 atom from the design system ───
function StatusBadge({ t, status }) {
  const map = {
    ok:           { color: t.statusOk,          label: 'OK',     Icon: null },
    warn:         { color: t.statusWarn,        label: 'WARN',   Icon: IconWarning },
    alarm:        { color: t.statusAlarm,       label: 'ALARM',  Icon: IconAlarm },
    fire:         { color: t.statusFire,        label: 'FIRE',   Icon: IconFire },
    loto:         { color: t.statusLoto,        label: 'LOTO',   Icon: IconPadlock },
    offline:      { color: t.statusOffline,     label: 'OFFLN',  Icon: null },
    sim:          { color: t.statusSim,         label: 'SIM',    Icon: null },
  };
  const s = map[status] || map.ok;
  return (
    <div style={{
      height: 22, padding: '0 8px',
      borderRadius: RADIUS[2],
      background: s.color + '20',
      border: `1px solid ${s.color}66`,
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700, letterSpacing: 0.18,
      color: s.color, textTransform: 'uppercase',
      flexShrink: 0,
    }}>
      {s.Icon ? <s.Icon size={11} color={s.color}/>
              : <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color }}/>}
      {s.label}
    </div>
  );
}

// ─── ModuleCard — the Tier-1 molecule ───
function ModuleIcon({ t, type, color, size = 22 }) {
  if (type === 'bess')    return <IconBess    size={size} color={color}/>;
  if (type === 'compute') return <IconCompute size={size} color={color}/>;
  if (type === 'grid')    return <IconGrid    size={size} color={color}/>;
  return null;
}

function ModuleCard({ t, m }) {
  const isOffline = m.status === 'offline';
  const isLoto    = m.status === 'loto';
  const dimmed    = isOffline;
  const railColor = (() => {
    if (m.status === 'fire')        return t.statusFire;
    if (m.status === 'alarm')       return t.statusAlarm;
    if (m.status === 'warn')        return t.statusWarn;
    if (m.status === 'loto')        return t.statusLoto;
    if (m.status === 'offline')     return t.statusOffline;
    return null; // ok: no rail
  })();
  const iconColor = (() => {
    if (isOffline) return t.textFaint;
    if (m.cls === 'bess')    return t.colorBess;
    if (m.cls === 'compute') return t.colorCompute;
    if (m.cls === 'grid')    return t.colorGrid;
    return t.text;
  })();

  return (
    <button style={{
      width: '100%', textAlign: 'left',
      display: 'block',
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderLeft: railColor ? `3px solid ${railColor}` : `1px solid ${t.border}`,
      borderRadius: RADIUS[3],
      padding: 0, cursor: 'pointer',
      opacity: dimmed ? 0.55 : 1,
      color: t.text, fontFamily: t.fontBody,
    }}>
      {/* header row */}
      <div style={{
        padding: `${SPACE[3]}px ${SPACE[3]}px ${SPACE[2]}px`,
        display: 'flex', alignItems: 'center', gap: SPACE[3],
      }}>
        {/* icon with optional alarm-count badge */}
        <div style={{
          position: 'relative',
          width: 38, height: 38, borderRadius: RADIUS[2],
          background: iconColor + '18',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <ModuleIcon t={t} type={m.icon} color={iconColor}/>
          {m.alarms > 0 && (
            <div style={{
              position: 'absolute', top: -5, right: -5,
              minWidth: 16, height: 16, padding: '0 4px',
              borderRadius: 8, background: t.statusAlarm,
              color: '#fff', fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1.5px solid ${t.surface}`,
            }}>{m.alarms}</div>
          )}
        </div>
        {/* name + sub */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: t.fontLabel, fontSize: 13, fontWeight: 700,
            letterSpacing: 0.1, color: t.text,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{m.name}</div>
          <div style={{
            fontFamily: t.fontBody, fontSize: 11, color: t.textMid, marginTop: 1,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{m.sub}</div>
        </div>
        <StatusBadge t={t} status={m.status}/>
      </div>

      {/* metrics row */}
      <div style={{
        borderTop: `1px solid ${t.borderSoft}`,
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
      }}>
        {m.metrics.map((mt, i) => {
          const colorMap = {
            bess: t.colorBess, compute: t.colorCompute, thermal: t.colorThermal,
            grid: t.colorGrid, ok: t.statusOk, warn: t.statusWarn,
            alarm: t.statusAlarm, text: t.text, soft: t.textSoft,
          }; // colorThermal kept for the Cooling sub-metric color token
          const c = colorMap[mt.color] || t.text;
          return (
            <div key={i} style={{
              padding: `${SPACE[2]}px ${SPACE[3]}px`,
              borderRight: i < 2 ? `1px solid ${t.borderSoft}` : 'none',
              minWidth: 0,
            }}>
              <div style={{
                fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.18,
                color: t.textSoft, textTransform: 'uppercase', fontWeight: 600,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{mt.l}</div>
              <div style={{
                display: 'flex', alignItems: 'baseline', gap: 2, marginTop: 2,
              }}>
                <span style={{
                  fontFamily: t.fontLabel, fontSize: 16, fontWeight: 400,
                  color: c, letterSpacing: -0.3, lineHeight: 1.0,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{mt.v}</span>
                {mt.u && (
                  <span style={{
                    fontFamily: t.fontLabel, fontSize: 10, color: t.textMid,
                    whiteSpace: 'nowrap',
                  }}>{mt.u}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </button>
  );
}

// ─── Composed screen ───
function ModulesScreen({ t }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: '100%',
      background: t.bg,
    }}>
      <ModulesTopBar t={t}/>
      <StatusStrip t={t}/>
      <div style={{ flex: 1, paddingBottom: SPACE[3] }}>
        <SldCta t={t}/>
        <FilterRow t={t} active="all"/>
        <div style={{
          margin: `${SPACE[3]}px ${SPACE[4]}px 0`,
          display: 'flex', flexDirection: 'column', gap: SPACE[3],
        }}>
          {MODULES.map(m => <ModuleCard key={m.id} t={t} m={m}/>)}
        </div>
      </div>
    </div>
  );
}

window.ModulesScreen = ModulesScreen;
