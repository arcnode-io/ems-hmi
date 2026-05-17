// modules-desktop.jsx — Desktop /modules screen.
// Spec: ems-hmi-ia-brief.md §6.2 Modules · §7.7 desktop adaptation.
//
// Density goals over mobile:
//   • All 13 device-0 modules visible at once (mobile shows ~6)
//   • Class-grouped sections w/ rollup KPIs (fleet SoC, total draw, etc)
//   • 24h sparkline of primary metric per card → trend at a glance
//   • Filter chips, view toggle, count, search all in one action bar
//
// Layout (desktop content area ≈ 1260px):
//   ┌─ Page actions bar ───────────────────────────────────────┐
//   ├─ SLD shortcut banner (compact) ──────────────────────────┤
//   ├─ Section: BESS  ──── 2 modules · 1 alarm · fleet 74% SoC ┤
//   │  [card] [card]                                            │
//   ├─ Section: Compute ── 6 modules · 1 alarm · 1 warn · 612 kW│
//   │  [card] [card] [card] [card]                              │
//   │  [card] [card]                                            │
//   ├─ Section: Grid ───── 5 modules · 142 kW import            │
//   │  [card] [card] [card] [card]                              │
//   │  [card]                                                   │
//   └───────────────────────────────────────────────────────────┘

const { useState: useStateMD, useMemo: useMemoMD } = React;

// ─── Module roster (13 device-0 instances) ────────────────────────
// Sparkline arrays are 24-hourly samples, normalized 0..1 of axis range.
// Each card shows its `primary` metric prominently; the rest as 3 micro-cells.

const MOD_DESK = [
  // ── BESS (2)
  {
    id: 'bess-01', name: 'BESS-01', cls: 'bess', sub: 'lithium · 2 MWh · pack-A',
    status: 'ok', alarms: 0,
    primary: { l: 'SoC',    v: '81',  u: '%',   tone: 'cls' },
    metrics: [
      { l: 'Power',  v: '0',     u: 'kW',  tone: 'text' },
      { l: 'Spread', v: '24',    u: 'mV',  tone: 'text' },
      { l: 'Temp',   v: '24.1',  u: '°C',  tone: 'text' },
    ],
    spark: [.62,.60,.58,.55,.52,.50,.55,.62,.70,.78,.82,.85,.86,.84,.81,.79,.80,.82,.81,.80,.79,.80,.81,.81],
    sparkLabel: '24h SoC',
  },
  {
    id: 'bess-02', name: 'BESS-02', cls: 'bess', sub: 'lithium · 2 MWh · pack-B',
    status: 'alarm', alarms: 1, alarmCode: 'BMS-2104',
    primary: { l: 'SoC',    v: '67',  u: '%',   tone: 'cls' },
    metrics: [
      { l: 'Power',  v: '−42',   u: 'kW',  tone: 'text' },
      { l: 'Spread', v: '142',   u: 'mV',  tone: 'alarm' },
      { l: 'Temp',   v: '27.8',  u: '°C',  tone: 'warn' },
    ],
    spark: [.78,.80,.82,.81,.79,.76,.74,.72,.71,.70,.69,.68,.68,.67,.67,.67,.67,.68,.68,.67,.67,.67,.67,.67],
    sparkLabel: '24h SoC',
  },
  // ── Compute (6)
  {
    id: 'compute-s04', name: 'COMPUTE-S04', cls: 'compute', sub: '8× H100 · DLC',
    status: 'warn', alarms: 1, alarmCode: 'CDU-WARN-3221',
    primary: { l: 'Util',    v: '88', u: '%',  tone: 'cls' },
    metrics: [
      { l: 'CDU out', v: '38.4', u: '°C', tone: 'warn' },
      { l: 'Draw',    v: '184',  u: 'kW', tone: 'text' },
      { l: 'GPUs',    v: '8/8',  u: '',   tone: 'text' },
    ],
    spark: [.55,.58,.62,.66,.70,.72,.75,.78,.80,.82,.84,.85,.86,.86,.87,.88,.88,.88,.87,.88,.88,.88,.88,.88],
    sparkLabel: '24h util',
  },
  {
    id: 'compute-s06', name: 'COMPUTE-S06', cls: 'compute', sub: '8× H100 · DLC',
    status: 'alarm', alarms: 1, alarmCode: 'GPU-OFFLINE-3331',
    primary: { l: 'Util',    v: '38', u: '%',  tone: 'cls' },
    metrics: [
      { l: 'CDU out', v: '32.1', u: '°C', tone: 'text' },
      { l: 'Draw',    v: '78',   u: 'kW', tone: 'text' },
      { l: 'GPUs',    v: '5/8',  u: '',   tone: 'alarm' },
    ],
    spark: [.78,.80,.82,.80,.78,.75,.72,.68,.62,.55,.50,.45,.42,.40,.38,.38,.38,.38,.38,.38,.38,.38,.38,.38],
    sparkLabel: '24h util · 3 GPU offline',
  },
  {
    id: 'compute-s14', name: 'COMPUTE-S14', cls: 'compute', sub: '8× H100 · DLC',
    status: 'ok', alarms: 0,
    primary: { l: 'Util',    v: '94', u: '%',  tone: 'cls' },
    metrics: [
      { l: 'CDU out', v: '34.1', u: '°C', tone: 'text' },
      { l: 'Draw',    v: '198',  u: 'kW', tone: 'text' },
      { l: 'GPUs',    v: '8/8',  u: '',   tone: 'text' },
    ],
    spark: [.62,.65,.70,.74,.80,.85,.88,.91,.92,.93,.93,.94,.94,.94,.94,.94,.94,.94,.94,.94,.94,.94,.94,.94],
    sparkLabel: '24h util',
  },
  {
    id: 'compute-s22', name: 'COMPUTE-S22', cls: 'compute', sub: '8× H100 · DLC',
    status: 'ok', alarms: 0,
    primary: { l: 'Util',    v: '91', u: '%',  tone: 'cls' },
    metrics: [
      { l: 'CDU out', v: '35.0', u: '°C', tone: 'text' },
      { l: 'Draw',    v: '192',  u: 'kW', tone: 'text' },
      { l: 'GPUs',    v: '8/8',  u: '',   tone: 'text' },
    ],
    spark: [.60,.64,.68,.74,.80,.84,.86,.88,.90,.91,.91,.91,.91,.91,.91,.91,.91,.91,.91,.91,.91,.91,.91,.91],
    sparkLabel: '24h util',
  },
  {
    id: 'compute-s30', name: 'COMPUTE-S30', cls: 'compute', sub: '8× H100 · DLC',
    status: 'ok', alarms: 0,
    primary: { l: 'Util',    v: '85', u: '%',  tone: 'cls' },
    metrics: [
      { l: 'CDU out', v: '36.2', u: '°C', tone: 'text' },
      { l: 'Draw',    v: '178',  u: 'kW', tone: 'text' },
      { l: 'GPUs',    v: '8/8',  u: '',   tone: 'text' },
    ],
    spark: [.55,.60,.65,.70,.74,.78,.80,.82,.84,.85,.85,.86,.86,.85,.85,.85,.85,.85,.85,.85,.85,.85,.85,.85],
    sparkLabel: '24h util',
  },
  {
    id: 'compute-edge', name: 'COMPUTE-EDGE', cls: 'compute', sub: '4× L40S · air',
    status: 'offline', alarms: 0, alarmCode: 'LINK-LOST',
    primary: { l: 'Util',    v: '—',  u: '',  tone: 'soft' },
    metrics: [
      { l: 'CDU out', v: '—',    u: '',   tone: 'soft' },
      { l: 'Draw',    v: '—',    u: '',   tone: 'soft' },
      { l: 'GPUs',    v: '0/4',  u: '',   tone: 'soft' },
    ],
    spark: [],
    sparkLabel: 'Offline · last seen 03:42',
  },
  // ── Grid (5)
  {
    id: 'grid-01', name: 'GRID-01', cls: 'grid', sub: 'PCS · grid-following',
    status: 'ok', alarms: 0,
    primary: { l: 'Import',   v: '142', u: 'kW',  tone: 'cls' },
    metrics: [
      { l: 'Freq',    v: '60.01', u: 'Hz',  tone: 'text' },
      { l: 'PF',      v: '0.99',  u: '',    tone: 'text' },
      { l: 'Brk',     v: 'CLSD',  u: '',    tone: 'ok' },
    ],
    spark: [.20,.18,.16,.16,.18,.22,.30,.40,.50,.55,.58,.55,.50,.48,.50,.55,.62,.70,.72,.70,.65,.55,.45,.40],
    sparkLabel: '24h net import',
  },
  {
    id: 'inv-pv-a', name: 'INV-PV-A', cls: 'grid', sub: 'PV inverter · 3.2 MW DC',
    status: 'ok', alarms: 0,
    primary: { l: 'Output',   v: '2.41', u: 'MW', tone: 'cls' },
    metrics: [
      { l: 'DC bus',  v: '1340', u: 'V',  tone: 'text' },
      { l: 'Eff',     v: '98.2', u: '%',  tone: 'text' },
      { l: 'Strings', v: '12/12',u: '',   tone: 'text' },
    ],
    spark: [0,0,0,0,0,.05,.20,.40,.65,.82,.92,.96,.95,.92,.85,.72,.55,.32,.10,0,0,0,0,0],
    sparkLabel: '24h MW output',
  },
  {
    id: 'inv-pv-b', name: 'INV-PV-B', cls: 'grid', sub: 'PV inverter · 3.2 MW DC',
    status: 'warn', alarms: 1, alarmCode: 'STR-OFFLINE',
    primary: { l: 'Output',   v: '2.18', u: 'MW', tone: 'cls' },
    metrics: [
      { l: 'DC bus',  v: '1308', u: 'V',  tone: 'text' },
      { l: 'Eff',     v: '97.6', u: '%',  tone: 'text' },
      { l: 'Strings', v: '11/12',u: '',   tone: 'warn' },
    ],
    spark: [0,0,0,0,0,.05,.20,.38,.60,.78,.85,.88,.86,.84,.78,.66,.50,.30,.10,0,0,0,0,0],
    sparkLabel: '24h MW output · 1 string offline',
  },
  {
    id: 'tfmr-mv', name: 'TFMR-MV', cls: 'grid', sub: 'transformer · 12.47 kV / 480 V',
    status: 'ok', alarms: 0,
    primary: { l: 'Loading',  v: '64',  u: '%',  tone: 'cls' },
    metrics: [
      { l: 'Oil',    v: '52',   u: '°C', tone: 'text' },
      { l: 'Wind',   v: '68',   u: '°C', tone: 'text' },
      { l: 'Tap',    v: '0',    u: '',   tone: 'text' },
    ],
    spark: [.40,.38,.36,.36,.38,.42,.48,.55,.60,.62,.64,.64,.65,.66,.66,.65,.64,.64,.64,.64,.64,.64,.64,.64],
    sparkLabel: '24h loading',
  },
  {
    id: 'meter-site', name: 'METER-SITE', cls: 'grid', sub: 'utility revenue meter',
    status: 'ok', alarms: 0,
    primary: { l: 'Net',      v: '−2.4', u: 'MW', tone: 'cls' },
    metrics: [
      { l: 'Energy', v: '186',  u: 'MWh', tone: 'text' },
      { l: 'Demand', v: '4.1',  u: 'MW',  tone: 'text' },
      { l: 'PF',     v: '0.99', u: '',    tone: 'text' },
    ],
    spark: [.45,.42,.40,.40,.42,.48,.55,.40,.20,.05,0,0,0,0,.05,.20,.42,.62,.70,.65,.55,.50,.48,.45],
    sparkLabel: '24h net (negative = export)',
  },
];

// Class metadata: section heading, color token, rollup formula.
const CLASS_META = [
  {
    id: 'bess', label: 'BESS', Icon: IconBess, colorTok: 'colorBess',
    rollup: (mods) => {
      const soc = (mods.reduce((a, m) => a + Number(m.primary.v) || 0, 0) / mods.length).toFixed(0);
      const totalP = mods.reduce((a, m) => a + (Number(m.metrics[0].v.replace('−', '-')) || 0), 0);
      return [
        { l: 'Fleet SoC', v: `${soc}`, u: '%' },
        { l: 'Net power', v: `${totalP >= 0 ? '+' : ''}${totalP}`, u: 'kW' },
      ];
    },
  },
  {
    id: 'compute', label: 'Compute', Icon: IconCompute, colorTok: 'colorCompute',
    rollup: (mods) => {
      const online = mods.filter(m => m.status !== 'offline');
      const totalDraw = online.reduce((a, m) => a + (Number(m.metrics[1].v) || 0), 0);
      const avgUtil = online.length
        ? Math.round(online.reduce((a, m) => a + (Number(m.primary.v) || 0), 0) / online.length)
        : 0;
      return [
        { l: 'Avg util',   v: `${avgUtil}`,   u: '%' },
        { l: 'Total draw', v: `${totalDraw}`, u: 'kW' },
      ];
    },
  },
  {
    id: 'grid', label: 'Grid', Icon: IconGrid, colorTok: 'colorGrid',
    rollup: () => {
      // Use site-meter net + grid-01 PCS values for the rollup.
      // Fixed values (synthesized) since rollup math across heterogeneous units is awkward.
      return [
        { l: 'Net site',  v: '−2.4', u: 'MW' },
        { l: 'Freq',      v: '60.01', u: 'Hz' },
      ];
    },
  },
];

// ─── Sparkline ────────────────────────────────────────────────────
function Sparkline({ t, values, color, height = 28, width = 'auto' }) {
  if (!values || values.length === 0) {
    return (
      <div style={{
        height, width: '100%',
        background: t.borderSoft,
        borderRadius: RADIUS[1],
        opacity: 0.4,
      }}/>
    );
  }
  const w = 220, h = height;
  const min = 0, max = 1; // already normalized 0..1
  const stepX = w / (values.length - 1);
  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = h - ((v - min) / (max - min)) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const path = `M ${points.join(' L ')}`;
  const fillPath = `${path} L ${w},${h} L 0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none"
         style={{ width: '100%', height, display: 'block' }}>
      <path d={fillPath} fill={color} fillOpacity={0.10}/>
      <path d={path} fill="none" stroke={color} strokeWidth={1.4}
            strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
      {/* end-dot */}
      {(() => {
        const last = values[values.length - 1];
        const x = w;
        const y = h - ((last - min) / (max - min)) * (h - 4) - 2;
        return <circle cx={x - 1.5} cy={y} r={2} fill={color}/>;
      })()}
    </svg>
  );
}

// ─── Status badge (compact desktop variant) ───────────────────────
function StatusBadgeDesk({ t, status }) {
  const map = {
    ok:        { color: t.statusOk,        label: 'OK',     Icon: null },
    warn:      { color: t.statusWarn,      label: 'WARN',   Icon: IconWarning },
    alarm:     { color: t.statusAlarm,     label: 'ALARM',  Icon: IconAlarm },
    fire:      { color: t.statusFire,      label: 'FIRE',   Icon: IconFire },
    loto:      { color: t.statusLoto,      label: 'LOTO',   Icon: IconPadlock },
    offline:   { color: t.statusOffline,   label: 'OFFLN',  Icon: null },
    sim:       { color: t.statusSim,       label: 'SIM',    Icon: null },
  };
  const s = map[status] || map.ok;
  return (
    <div style={{
      height: 20, padding: '0 7px',
      borderRadius: RADIUS[2],
      background: s.color + '20',
      border: `1px solid ${s.color}66`,
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontFamily: t.fontLabel, fontSize: 9.5, fontWeight: 700, letterSpacing: 0.18,
      color: s.color, textTransform: 'uppercase', flexShrink: 0,
    }}>
      {s.Icon
        ? <s.Icon size={10} color={s.color}/>
        : <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color }}/>}
      {s.label}
    </div>
  );
}

// ─── Page actions bar ─────────────────────────────────────────────
function ModulesActionsBar({ t, density, filter, setFilter, view, setView, query, setQuery }) {
  const isSov = t.name === 'sovereign';
  const dense = density === 'dense';
  const counts = {
    all:     MOD_DESK.length,
    bess:    MOD_DESK.filter(m => m.cls === 'bess').length,
    compute: MOD_DESK.filter(m => m.cls === 'compute').length,
    grid:    MOD_DESK.filter(m => m.cls === 'grid').length,
  };
  const filters = [
    { id: 'all',     label: 'All' },
    { id: 'bess',    label: 'BESS' },
    { id: 'compute', label: 'Compute' },
    { id: 'grid',    label: 'Grid' },
  ];
  return (
    <div style={{
      padding: `${dense ? 12 : 16}px ${SPACE[5]}px`,
      borderBottom: `1px solid ${t.border}`,
      background: t.bg,
      display: 'flex', alignItems: 'center', gap: SPACE[3], flexShrink: 0,
    }}>
      {/* Title + count */}
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: t.fontHeading, fontSize: 22, lineHeight: 1.1,
          letterSpacing: isSov ? 0.5 : 0, fontWeight: isSov ? 400 : 500,
          color: t.text, textTransform: isSov ? 'uppercase' : 'none', whiteSpace: 'nowrap',
        }}>Modules</div>
        <div style={{
          fontFamily: t.fontLabel, fontSize: 10, letterSpacing: 0.18,
          color: t.textSoft, marginTop: 2, textTransform: 'uppercase',
        }}>{MOD_DESK.length} modules · Brookside DC-1</div>
      </div>

      <div style={{ flex: 1 }}/>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 4 }}>
        {filters.map(f => {
          const isActive = filter === f.id;
          return (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              padding: '6px 12px',
              background: isActive ? t.text : 'transparent',
              color: isActive ? t.bg : t.textMid,
              border: `1px solid ${isActive ? t.text : t.border}`,
              borderRadius: RADIUS.full,
              fontFamily: t.fontLabel, fontSize: 11, fontWeight: 600,
              letterSpacing: 0.15, textTransform: 'uppercase',
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              {f.label}
              <span style={{
                marginLeft: 6, fontWeight: 400,
                color: isActive ? t.bg : t.textSoft, opacity: 0.85,
              }}>{counts[f.id]}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div style={{
        width: 200, padding: '5px 10px',
        background: t.surface, border: `1px solid ${t.border}`, borderRadius: RADIUS[2],
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.textSoft} strokeWidth="2">
          <circle cx="11" cy="11" r="7"/><path d="M21 21 L16 16"/>
        </svg>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter modules…"
          style={{
            flex: 1, minWidth: 0, background: 'transparent', border: 'none',
            outline: 'none', fontFamily: t.fontBody, fontSize: 11, color: t.text,
          }}/>
      </div>

      {/* View toggle */}
      <div style={{
        display: 'flex', border: `1px solid ${t.border}`, borderRadius: RADIUS[2],
        overflow: 'hidden', background: t.surface,
      }}>
        {[
          { id: 'cards', label: 'Cards', icon: 'cards' },
          { id: 'table', label: 'Table', icon: 'table' },
        ].map(v => {
          const a = view === v.id;
          return (
            <button key={v.id} onClick={() => setView(v.id)} style={{
              padding: '5px 12px', background: a ? t.accentFaint : 'transparent',
              color: a ? t.accent : t.textMid, border: 'none', cursor: 'pointer',
              fontFamily: t.fontLabel, fontSize: 10.5, fontWeight: 600,
              letterSpacing: 0.18, textTransform: 'uppercase',
              borderRight: v.id === 'cards' ? `1px solid ${t.border}` : 'none',
            }}>{v.label}</button>
          );
        })}
      </div>
    </div>
  );
}

// ─── SLD shortcut banner ──────────────────────────────────────────
function SldBanner({ t }) {
  const isSov = t.name === 'sovereign';
  return (
    <div style={{
      margin: `${SPACE[4]}px ${SPACE[5]}px 0`,
      padding: `${SPACE[3]}px ${SPACE[4]}px`,
      background: t.accentFaint,
      border: `1px solid ${t.accent}55`,
      borderRadius: RADIUS[3],
      display: 'flex', alignItems: 'center', gap: SPACE[4],
    }}>
      {/* mini SLD glyph */}
      <svg width="64" height="36" viewBox="0 0 64 36" style={{ flexShrink: 0 }}>
        {/* horizontal MV bus */}
        <line x1="4" y1="18" x2="60" y2="18" stroke={t.accent} strokeWidth="1.6"/>
        {/* upper drops (sources) */}
        <line x1="14" y1="18" x2="14" y2="6" stroke={t.accent} strokeWidth="1.2"/>
        <line x1="32" y1="18" x2="32" y2="6" stroke={t.accent} strokeWidth="1.2"/>
        <line x1="50" y1="18" x2="50" y2="6" stroke={t.accent} strokeWidth="1.2"/>
        <rect x="11"  y="2" width="6" height="4" rx="0.5" fill={t.accent}/>
        <rect x="29"  y="2" width="6" height="4" rx="0.5" fill={t.accent}/>
        <rect x="47"  y="2" width="6" height="4" rx="0.5" fill={t.accent}/>
        {/* lower drops (loads) */}
        <line x1="22" y1="18" x2="22" y2="30" stroke={t.accent} strokeWidth="1.2"/>
        <line x1="42" y1="18" x2="42" y2="30" stroke={t.accent} strokeWidth="1.2"/>
        <circle cx="22" cy="32" r="2.5" fill="none" stroke={t.accent} strokeWidth="1.2"/>
        <circle cx="42" cy="32" r="2.5" fill="none" stroke={t.accent} strokeWidth="1.2"/>
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
          fontFamily: t.fontBody, fontSize: 12, color: t.textMid, marginTop: 2,
        }}>Spatial topology of all 13 modules · live MQTT bindings · click any node for detail</div>
      </div>

      <button style={{
        padding: '8px 14px',
        background: t.accent, color: '#fff',
        border: 'none', borderRadius: RADIUS[2],
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontFamily: t.fontLabel, fontSize: 11, fontWeight: 700, letterSpacing: 0.18,
        textTransform: 'uppercase', cursor: 'pointer',
      }}>
        Open SLD
        <IconChevron size={14} color="#fff"/>
      </button>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────
function SectionHeader({ t, meta, mods }) {
  const isSov = t.name === 'sovereign';
  const color = t[meta.colorTok];
  const alarms = mods.filter(m => m.status === 'alarm').length;
  const warns  = mods.filter(m => m.status === 'warn').length;
  const offline = mods.filter(m => m.status === 'offline').length;
  const rollup = meta.rollup(mods);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: SPACE[3],
      padding: `${SPACE[2]}px 0 ${SPACE[2]}px ${SPACE[3]}px`,
      borderLeft: `3px solid ${color}`,
      marginBottom: SPACE[2],
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: RADIUS[2],
        background: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <meta.Icon size={18} color={color}/>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: t.fontHeading, fontSize: 18, fontWeight: isSov ? 400 : 600,
          letterSpacing: isSov ? 0.4 : 0, color: t.text,
          textTransform: isSov ? 'uppercase' : 'none', lineHeight: 1.1,
        }}>{meta.label}</div>
        <div style={{
          fontFamily: t.fontLabel, fontSize: 10, letterSpacing: 0.15,
          color: t.textSoft, textTransform: 'uppercase', marginTop: 2,
        }}>
          <span>{mods.length} {mods.length === 1 ? 'module' : 'modules'}</span>
          {alarms > 0 && (
            <>
              <span style={{ color: t.textFaint, padding: '0 5px' }}>·</span>
              <span style={{ color: t.statusAlarm, fontWeight: 700 }}>{alarms} alarm</span>
            </>
          )}
          {warns > 0 && (
            <>
              <span style={{ color: t.textFaint, padding: '0 5px' }}>·</span>
              <span style={{ color: t.statusWarn, fontWeight: 700 }}>{warns} warn</span>
            </>
          )}
          {offline > 0 && (
            <>
              <span style={{ color: t.textFaint, padding: '0 5px' }}>·</span>
              <span style={{ color: t.textSoft }}>{offline} offline</span>
            </>
          )}
        </div>
      </div>

      <div style={{ flex: 1 }}/>

      {/* Right: rollup KPIs */}
      <div style={{ display: 'flex', gap: SPACE[5] }}>
        {rollup.map(r => (
          <div key={r.l} style={{ textAlign: 'right' }}>
            <div style={{
              fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.18,
              color: t.textSoft, textTransform: 'uppercase', fontWeight: 600,
            }}>{r.l}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, justifyContent: 'flex-end', marginTop: 1 }}>
              <span style={{
                fontFamily: t.fontLabel, fontSize: 18, fontWeight: 600,
                color: color, letterSpacing: -0.3, lineHeight: 1.0,
              }}>{r.v}</span>
              {r.u && (
                <span style={{ fontFamily: t.fontLabel, fontSize: 11, color: t.textMid }}>{r.u}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Module card (desktop) ────────────────────────────────────────
function ModuleCardDesk({ t, m, density }) {
  const dense = density === 'dense';
  const isOffline = m.status === 'offline';
  const isLoto    = m.status === 'loto';
  const railColor = (() => {
    if (m.status === 'fire')    return t.statusFire;
    if (m.status === 'alarm')   return t.statusAlarm;
    if (m.status === 'warn')    return t.statusWarn;
    if (m.status === 'loto')    return t.statusLoto;
    if (m.status === 'offline') return t.statusOffline;
    return null;
  })();
  const clsColor = (() => {
    if (isOffline) return t.textFaint;
    if (m.cls === 'bess')    return t.colorBess;
    if (m.cls === 'compute') return t.colorCompute;
    if (m.cls === 'grid')    return t.colorGrid;
    return t.text;
  })();
  const toneColor = (tone) => ({
    text: t.text, soft: t.textSoft, ok: t.statusOk,
    warn: t.statusWarn, alarm: t.statusAlarm, fire: t.statusFire,
    cls: clsColor,
  }[tone] || t.text);

  return (
    <button style={{
      width: '100%', textAlign: 'left', padding: 0,
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderLeft: railColor ? `3px solid ${railColor}` : `1px solid ${t.border}`,
      borderRadius: RADIUS[3],
      cursor: 'pointer', color: t.text, fontFamily: t.fontBody,
      opacity: isOffline ? 0.7 : 1,
      display: 'block',
    }}>
      {/* Header row */}
      <div style={{
        padding: `${dense ? 10 : 12}px ${SPACE[3]}px ${dense ? 8 : 10}px`,
        display: 'flex', alignItems: 'flex-start', gap: SPACE[2],
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{
              fontFamily: t.fontLabel, fontSize: 13, fontWeight: 700,
              letterSpacing: 0.1, color: t.text,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{m.name}</span>
            {m.alarms > 0 && (
              <span style={{
                minWidth: 16, height: 16, padding: '0 4px',
                borderRadius: 8, background: t.statusAlarm, color: '#fff',
                fontFamily: t.fontLabel, fontSize: 9.5, fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>{m.alarms}</span>
            )}
          </div>
          <div style={{
            fontFamily: t.fontBody, fontSize: 11, color: t.textMid, marginTop: 2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{m.sub}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
          <StatusBadgeDesk t={t} status={m.status}/>
          {m.alarmCode && (
            <div style={{
              fontFamily: t.fontLabel, fontSize: 8.5, letterSpacing: 0.18,
              color: railColor || t.textSoft, textTransform: 'uppercase', fontWeight: 700,
              whiteSpace: 'nowrap',
            }}>{m.alarmCode}</div>
          )}
        </div>
      </div>

      {/* Primary metric */}
      <div style={{
        padding: `0 ${SPACE[3]}px ${dense ? 6 : 8}px`,
        display: 'flex', alignItems: 'baseline', gap: 6,
      }}>
        <span style={{
          fontFamily: t.fontLabel, fontSize: 28, fontWeight: 400,
          color: toneColor(m.primary.tone),
          letterSpacing: -0.5, lineHeight: 1.0,
        }}>{m.primary.v}</span>
        {m.primary.u && (
          <span style={{ fontFamily: t.fontLabel, fontSize: 12, color: t.textMid }}>{m.primary.u}</span>
        )}
        <span style={{
          fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.18,
          color: t.textSoft, textTransform: 'uppercase', fontWeight: 600,
          marginLeft: 'auto',
        }}>{m.primary.l}</span>
      </div>

      {/* Secondary metrics row */}
      <div style={{
        borderTop: `1px solid ${t.borderSoft}`,
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
      }}>
        {m.metrics.map((mt, i) => (
          <div key={i} style={{
            padding: `${dense ? 6 : 7}px ${SPACE[2] + 2}px`,
            borderRight: i < 2 ? `1px solid ${t.borderSoft}` : 'none',
            minWidth: 0,
          }}>
            <div style={{
              fontFamily: t.fontLabel, fontSize: 8.5, letterSpacing: 0.18,
              color: t.textSoft, textTransform: 'uppercase', fontWeight: 600,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{mt.l}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginTop: 1 }}>
              <span style={{
                fontFamily: t.fontLabel, fontSize: 13, fontWeight: 500,
                color: toneColor(mt.tone), letterSpacing: -0.2,
                whiteSpace: 'nowrap',
              }}>{mt.v}</span>
              {mt.u && (
                <span style={{ fontFamily: t.fontLabel, fontSize: 9.5, color: t.textMid }}>{mt.u}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Sparkline footer */}
      <div style={{
        borderTop: `1px solid ${t.borderSoft}`,
        padding: `${dense ? 6 : 8}px ${SPACE[3]}px ${dense ? 8 : 10}px`,
      }}>
        <Sparkline t={t} values={m.spark} color={clsColor} height={22}/>
        <div style={{
          fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.15,
          color: t.textSoft, textTransform: 'uppercase', fontWeight: 600,
          marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{m.sparkLabel}</div>
      </div>
    </button>
  );
}

// ─── Module row (desktop table view) ──────────────────────────────
function ModuleRow({ t, m }) {
  const isOffline = m.status === 'offline';
  const railColor = (() => {
    if (m.status === 'alarm')   return t.statusAlarm;
    if (m.status === 'warn')    return t.statusWarn;
    if (m.status === 'offline') return t.statusOffline;
    return null;
  })();
  const clsColor = (() => {
    if (isOffline) return t.textFaint;
    if (m.cls === 'bess')    return t.colorBess;
    if (m.cls === 'compute') return t.colorCompute;
    if (m.cls === 'grid')    return t.colorGrid;
    return t.text;
  })();
  const toneColor = (tone) => ({
    text: t.text, soft: t.textSoft, ok: t.statusOk,
    warn: t.statusWarn, alarm: t.statusAlarm, fire: t.statusFire,
    cls: clsColor,
  }[tone] || t.text);
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '180px 80px 1fr 110px 110px 110px 110px 200px',
      alignItems: 'center', gap: SPACE[3],
      padding: `${SPACE[2]}px ${SPACE[3]}px`,
      borderBottom: `1px solid ${t.borderSoft}`,
      borderLeft: railColor ? `3px solid ${railColor}` : `3px solid transparent`,
      background: t.surface,
      opacity: isOffline ? 0.7 : 1,
      cursor: 'pointer',
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: t.fontLabel, fontSize: 12, fontWeight: 700, letterSpacing: 0.08,
          color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{m.name}</div>
        <div style={{
          fontFamily: t.fontBody, fontSize: 10.5, color: t.textMid, marginTop: 1,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{m.sub}</div>
      </div>
      <StatusBadgeDesk t={t} status={m.status}/>
      <div style={{ minWidth: 0 }}>
        <Sparkline t={t} values={m.spark} color={clsColor} height={20}/>
      </div>
      {[m.primary, ...m.metrics].map((mt, i) => (
        <div key={i}>
          <div style={{
            fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.18,
            color: t.textSoft, textTransform: 'uppercase', fontWeight: 600,
          }}>{mt.l}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginTop: 1 }}>
            <span style={{
              fontFamily: t.fontLabel, fontSize: 14, fontWeight: 500,
              color: toneColor(mt.tone), letterSpacing: -0.2, whiteSpace: 'nowrap',
            }}>{mt.v}</span>
            {mt.u && (
              <span style={{ fontFamily: t.fontLabel, fontSize: 10, color: t.textMid }}>{mt.u}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Section (header + cards/rows) ────────────────────────────────
function ModulesSection({ t, meta, mods, view, density }) {
  if (mods.length === 0) return null;
  return (
    <div style={{ marginTop: SPACE[5] }}>
      <SectionHeader t={t} meta={meta} mods={mods}/>
      {view === 'cards' ? (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: SPACE[3],
        }}>
          {mods.map(m => <ModuleCardDesk key={m.id} t={t} m={m} density={density}/>)}
        </div>
      ) : (
        <div style={{
          background: t.surface, border: `1px solid ${t.border}`, borderRadius: RADIUS[3],
          overflow: 'hidden',
        }}>
          {/* table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '180px 80px 1fr 110px 110px 110px 110px 200px',
            gap: SPACE[3],
            padding: `${SPACE[2]}px ${SPACE[3]}px`,
            background: t.panel,
            borderBottom: `1px solid ${t.border}`,
            fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700,
            letterSpacing: 0.18, color: t.textSoft, textTransform: 'uppercase',
          }}>
            <span>Module</span>
            <span>Status</span>
            <span>24h trend</span>
            <span>{meta.id === 'bess' ? 'SoC' : meta.id === 'compute' ? 'Util' : 'Primary'}</span>
            <span>—</span>
            <span>—</span>
            <span>—</span>
            <span>Trend label</span>
          </div>
          {mods.map(m => <ModuleRow key={m.id} t={t} m={m}/>)}
        </div>
      )}
    </div>
  );
}

// ─── Top-level body ───────────────────────────────────────────────
function ModulesDesktopBody({ t, density }) {
  const [filter, setFilter] = useStateMD('all');
  const [view,   setView]   = useStateMD('cards');
  const [query,  setQuery]  = useStateMD('');

  const filtered = useMemoMD(() => {
    let m = MOD_DESK;
    if (filter !== 'all') m = m.filter(x => x.cls === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      m = m.filter(x =>
        x.name.toLowerCase().includes(q) ||
        x.sub.toLowerCase().includes(q) ||
        x.id.toLowerCase().includes(q));
    }
    return m;
  }, [filter, query]);

  const byCls = useMemoMD(() => {
    const out = {};
    for (const meta of CLASS_META) out[meta.id] = filtered.filter(m => m.cls === meta.id);
    return out;
  }, [filtered]);

  return (
    <div style={{
      flex: 1, minWidth: 0, minHeight: 0, overflowY: 'auto',
      background: t.bg, color: t.text,
      display: 'flex', flexDirection: 'column',
    }}>
      <ModulesActionsBar
        t={t} density={density}
        filter={filter} setFilter={setFilter}
        view={view} setView={setView}
        query={query} setQuery={setQuery}
      />

      <div style={{
        flex: 1, padding: `0 ${SPACE[5]}px ${SPACE[5]}px`,
      }}>
        <SldBanner t={t}/>

        {CLASS_META.map(meta => (
          <ModulesSection key={meta.id} t={t} meta={meta}
            mods={byCls[meta.id]} view={view} density={density}/>
        ))}

        {filtered.length === 0 && (
          <div style={{
            margin: `${SPACE[5]}px 0`, padding: SPACE[5],
            textAlign: 'center',
            fontFamily: t.fontBody, fontSize: 13, color: t.textSoft,
            border: `1px dashed ${t.border}`, borderRadius: RADIUS[3],
          }}>
            No modules match the current filter.
          </div>
        )}
      </div>
    </div>
  );
}

window.ModulesDesktopBody = ModulesDesktopBody;
