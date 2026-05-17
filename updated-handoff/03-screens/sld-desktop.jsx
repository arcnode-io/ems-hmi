// sld-desktop.jsx — Single Line Diagram, desktop breakpoint.
// Layout: layer toolbar · full-width SLD canvas · right inspector panel.
//
// IA: this screen is READ-ONLY topology. Commanding lives in module detail.
// Selecting a node updates the inspector — clicking the deep-link CTA
// navigates to the module's detail screen.

const { useState: useStateSLD, useMemo: useMemoSLD } = React;

// ─── Fleet topology — Brookside DC-1 ──────────────────────────────────────
// 4 BESS + 8 compute racks + 1 edge container = 13 modules on the 480V bus.
// Net flow today: +142 kW utility import, BESS-02 discharging −42 kW,
// compute pulling 184 kW. Mass-balance: 142 + 42 = 184 ✓.
const SLD_FLEET = {
  bess: [
    { id: 'bess-01', label: 'BESS-01', sub: 'SoC 81%',  kw: '0 kW',     status: 'ok',    flow: 'idle' },
    { id: 'bess-02', label: 'BESS-02', sub: 'SoC 67%',  kw: '−42 kW',   status: 'alarm', flow: 'up' },
    { id: 'bess-03', label: 'BESS-03', sub: 'SoC 78%',  kw: '0 kW',     status: 'ok',    flow: 'idle' },
    { id: 'bess-04', label: 'BESS-04', sub: 'LOTO',     kw: '— kW',     status: 'loto',  flow: 'idle' },
  ],
  compute: [
    { id: 'compute-s01', label: 'S01', sub: '8 svr · DLC', kw: '92.1 kW', status: 'ok',      flow: 'down' },
    { id: 'compute-s04', label: 'S04', sub: '8 svr · DLC', kw: '92.4 kW', status: 'warn',    flow: 'down' },
    { id: 'compute-s06', label: 'S06', sub: '8 svr · DLC', kw: '64.0 kW', status: 'warn',    flow: 'down' },
    { id: 'compute-s14', label: 'S14', sub: '8 svr · DLC', kw: '91.8 kW', status: 'ok',      flow: 'down' },
    { id: 'compute-s15', label: 'S15', sub: '8 svr · DLC', kw: '88.6 kW', status: 'ok',      flow: 'down' },
    { id: 'compute-s17', label: 'S17', sub: '8 svr · DLC', kw: '91.0 kW', status: 'ok',      flow: 'down' },
    { id: 'compute-s19', label: 'S19', sub: '8 svr · DLC', kw: '90.2 kW', status: 'ok',      flow: 'down' },
    { id: 'compute-edge', label: 'EDGE', sub: '4 svr · air', kw: 'OFFLINE', status: 'offline', flow: 'idle' },
  ],
};

const SLD_INSPECTOR = {
  // Default selection on load — operator should land on the alarm.
  defaultId: 'bess-02',
  details: {
    'bess-02': {
      title: 'BESS-02', kind: 'BESS', state: 'ALARM',
      alarm: { code: 'BMS-2104', text: 'Cell spread > 80 mV (rack 4)', level: 'alarm', ackAge: '14m unack' },
      live: [
        { k: 'Power',   v: '−42 kW',  hint: 'discharging' },
        { k: 'SoC',     v: '67%',     hint: '536 kWh remaining' },
        { k: 'Pack V',  v: '798.4 V', hint: '' },
        { k: 'Pack I',  v: '53.1 A',  hint: '' },
        { k: 'Cell Δ',  v: '84 mV',   hint: 'rack 4 outliers' },
        { k: 'Avg cell T', v: '34 °C', hint: '' },
      ],
      recent: [
        { ago: '14m', who: 'AUTO',     what: 'Setpoint −42 kW · arbitrage' },
        { ago: '18m', who: 'AUTO',     what: 'BMS-2104 re-raised — cell Δ 84 mV (threshold 80)' },
        { ago: '52m', who: 'OPS-LIVE', what: 'Ack BMS-2104 cleared, returned' },
        { ago: '4h 18m', who: 'AUTO',  what: 'BESS-02 alarm raised — cell spread' },
      ],
      deepLink: { route: '/modules/bess-02', label: 'Open BESS-02 detail' },
    },
    'bess-01': {
      title: 'BESS-01', kind: 'BESS', state: 'OK',
      alarm: null,
      live: [
        { k: 'Power',   v: '0 kW',    hint: 'idle' },
        { k: 'SoC',     v: '81%',     hint: '648 kWh remaining' },
        { k: 'Pack V',  v: '798.2 V', hint: '' },
        { k: 'Cell Δ',  v: '12 mV',   hint: 'within tolerance' },
      ],
      recent: [
        { ago: '1h 4m', who: 'AUTO', what: 'Hold idle — peak window pending' },
      ],
      deepLink: { route: '/modules/bess-01', label: 'Open BESS-01 detail' },
    },
    'bess-03': {
      title: 'BESS-03', kind: 'BESS', state: 'OK',
      alarm: null,
      live: [
        { k: 'Power',  v: '0 kW',    hint: 'idle' },
        { k: 'SoC',    v: '78%',     hint: '624 kWh remaining' },
        { k: 'Pack V', v: '795.0 V', hint: '' },
      ],
      recent: [],
      deepLink: { route: '/modules/bess-03', label: 'Open BESS-03 detail' },
    },
    'bess-04': {
      title: 'BESS-04', kind: 'BESS', state: 'LOTO',
      alarm: { code: 'LOTO-OPS', text: 'Lockout asserted by ops · audit-logged', level: 'loto', ackAge: '2h 11m' },
      // LOTO permit — required for EAWP audit trail. Tap-target opens permit PDF.
      permit: {
        number: 'PMT-2026-0418',
        lockedBy: 'J. RUIZ · OPS-LEAD',
        lockedAt: '12:13 · today',
        reason: 'Scheduled DC-bus inspection · semi-annual',
        clearTarget: '17:00 · today',
      },
      live: [
        { k: 'Power',  v: '— kW',    hint: 'commands inhibited' },
        { k: 'SoC',    v: '74%',     hint: 'last reading 12:13' },
        { k: 'Branch CB', v: 'OPEN',  hint: 'isolated' },
      ],
      recent: [
        { ago: '2h 11m', who: 'OPS-LIVE', what: 'LOTO asserted · permit PMT-2026-0418' },
      ],
      deepLink: { route: '/modules/bess-04', label: 'Open BESS-04 detail' },
    },
    'compute-s04': {
      title: 'COMPUTE-S04', kind: 'Compute', state: 'WARN',
      alarm: { code: 'CDU-WARN-3221', text: 'CDU outlet 31.6 °C (limit 32 °C)', level: 'warn', ackAge: 'unack 8m' },
      live: [
        { k: 'Draw',          v: '92.4 kW', hint: '8 svr · DLC' },
        { k: 'GPU util',      v: '91%',     hint: 'avg' },
        { k: 'CDU outlet T',  v: '31.6 °C', hint: 'rising 0.4 °C/min' },
        { k: 'Coolant flow',  v: '52 L/min', hint: '' },
      ],
      recent: [
        { ago: '8m', who: 'AUTO', what: 'CDU-WARN-3221 raised' },
      ],
      deepLink: { route: '/modules/compute-s04', label: 'Open COMPUTE-S04 detail' },
    },
    'compute-s06': {
      title: 'COMPUTE-S06', kind: 'Compute', state: 'WARN',
      alarm: { code: 'GPU-OFFLINE-3331', text: '3 of 32 GPUs offline · job rerouted', level: 'warn', ackAge: 'unack 22m' },
      live: [
        { k: 'Draw',     v: '64.0 kW', hint: '8 svr · DLC' },
        { k: 'GPU util', v: '76%',     hint: '29/32 active' },
      ],
      recent: [
        { ago: '22m', who: 'AUTO', what: 'GPU-OFFLINE-3331 raised' },
      ],
      deepLink: { route: '/modules/compute-s06', label: 'Open COMPUTE-S06 detail' },
    },
    'compute-edge': {
      title: 'COMPUTE-EDGE', kind: 'Compute', state: 'OFFLINE',
      alarm: { code: 'STR-OFFLINE', text: 'Last heartbeat 12m ago — branch breaker open', level: 'offline', ackAge: '12m' },
      live: [
        { k: 'Draw', v: '— kW', hint: 'no telemetry' },
      ],
      recent: [
        { ago: '12m', who: 'AUTO', what: 'STR-OFFLINE raised' },
      ],
      deepLink: { route: '/modules/compute-edge', label: 'Open COMPUTE-EDGE detail' },
    },
    // Stub for unspecified modules — deep-link only.
    _generic: (id, label, kind, state) => ({
      title: label, kind, state,
      alarm: null,
      live: [{ k: 'Status', v: state, hint: 'see module detail for full telemetry' }],
      recent: [],
      deepLink: { route: `/modules/${id}`, label: `Open ${label} detail` },
    }),
  },
};

function inspectorFor(id) {
  if (SLD_INSPECTOR.details[id]) return SLD_INSPECTOR.details[id];
  // Fallback for unspecified compute racks
  const all = [...SLD_FLEET.bess, ...SLD_FLEET.compute];
  const node = all.find(n => n.id === id);
  if (!node) return null;
  const kind = id.startsWith('bess') ? 'BESS' : 'Compute';
  return SLD_INSPECTOR.details._generic(id, node.label, kind, node.status.toUpperCase());
}

// ─── Layer toolbar ─────────────────────────────────────────────────────
function LayerToolbar({ t, layer, onLayer, density }) {
  const isSov = t.name === 'sovereign';
  const layers = [
    { id: 'power',   label: 'Power flow',     enabled: true  },
    { id: 'comms',   label: 'Comms / network', enabled: false },
    { id: 'cooling', label: 'Cooling loop',    enabled: false },
  ];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: SPACE[3],
      padding: density === 'dense'
        ? `${SPACE[2]}px ${SPACE[5]}px`
        : `${SPACE[3]}px ${SPACE[5]}px`,
      borderBottom: `1px solid ${t.border}`,
      background: t.bg,
      flexShrink: 0,
    }}>
      <span style={{
        fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700,
        letterSpacing: 0.2, color: t.textSoft, textTransform: 'uppercase',
      }}>Layers</span>
      <div style={{ display: 'flex', border: `1px solid ${t.border}`, borderRadius: RADIUS[2], overflow: 'hidden' }}>
        {layers.map((l, i) => {
          const active = l.id === layer;
          return (
            <button key={l.id}
              onClick={() => l.enabled && onLayer(l.id)}
              disabled={!l.enabled}
              title={l.enabled ? '' : 'Layer not implemented in prototype'}
              style={{
                background: active ? t.surface : 'transparent',
                color: !l.enabled ? t.textSoft : (active ? t.text : t.textMid),
                border: 'none',
                borderRight: i < layers.length - 1 ? `1px solid ${t.border}` : 'none',
                padding: '6px 12px',
                fontFamily: t.fontLabel, fontSize: 11, fontWeight: 600,
                letterSpacing: 0.1,
                cursor: l.enabled ? 'pointer' : 'not-allowed',
                opacity: l.enabled ? 1 : 0.5,
              }}>
              {l.label}
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1 }}/>
      {/* Legend */}
      <div style={{ display: 'flex', gap: SPACE[3], alignItems: 'center' }}>
        {[
          { k: 'BESS', c: t.colorBess },
          { k: 'Compute', c: t.colorCompute },
          { k: 'Grid', c: t.colorGrid },
        ].map(l => (
          <div key={l.k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: l.c }}/>
            <span style={{
              fontFamily: t.fontLabel, fontSize: 10, fontWeight: 600,
              color: t.textMid, letterSpacing: 0.1, textTransform: 'uppercase',
            }}>{l.k}</span>
          </div>
        ))}
      </div>
      <div style={{ width: 1, height: 18, background: t.border, margin: '0 4px' }}/>
      {/* Zoom group */}
      <div style={{ display: 'flex', border: `1px solid ${t.border}`, borderRadius: RADIUS[2], overflow: 'hidden' }}>
        <button style={{
          width: 28, height: 26, background: 'transparent', border: 'none',
          color: t.textMid, fontFamily: t.fontLabel, fontSize: 14, lineHeight: 1,
          cursor: 'pointer', borderRight: `1px solid ${t.border}`,
        }}>−</button>
        <button style={{
          padding: '0 10px', height: 26, background: 'transparent', border: 'none',
          color: t.textMid, fontFamily: t.fontLabel, fontSize: 10, fontWeight: 600,
          letterSpacing: 0.1, cursor: 'pointer', borderRight: `1px solid ${t.border}`,
        }}>FIT</button>
        <button style={{
          width: 28, height: 26, background: 'transparent', border: 'none',
          color: t.textMid, fontFamily: t.fontLabel, fontSize: 14, lineHeight: 1,
          cursor: 'pointer',
        }}>+</button>
      </div>
    </div>
  );
}

// ─── SLD primitives (desktop-tuned sizes) ─────────────────────────────────
function NodeBoxD({ x, y, w, h, color, label, sub, kw, t, status, isLoad = false, dashed = false, selected = false, onClick }) {
  const dim = status === 'offline';
  const isLoto = status === 'loto';
  const isAlarm = status === 'alarm';
  const isWarn = status === 'warn';
  const strokeColor = isLoto ? t.statusLoto : (isAlarm ? t.statusAlarm : (isWarn ? t.statusWarn : color));
  const strokeWidth = isAlarm || selected ? 2 : 1.25;
  const hatchId = `hatch-d-${x}-${y}`;
  return (
    <g style={{ opacity: dim ? 0.55 : 1, cursor: 'pointer' }} onClick={onClick}>
      {isLoto && (
        <defs>
          <pattern id={hatchId} patternUnits="userSpaceOnUse" width="6" height="6"
                   patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke={t.statusLoto} strokeWidth="1" strokeOpacity="0.18"/>
          </pattern>
        </defs>
      )}
      {/* Selection halo */}
      {selected && (
        <rect x={x - 4} y={y - 4} width={w + 8} height={h + 8} rx={6}
              fill="none" stroke={t.accent} strokeWidth={1.5} strokeOpacity={0.7}
              strokeDasharray="3 2"/>
      )}
      {/* Warn halo — yellow dashed (alarm gets a red pulsing version below). */}
      {isWarn && (
        <rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} rx={5}
              fill="none" stroke={t.statusWarn} strokeWidth={1}
              strokeOpacity={0.55} strokeDasharray="4 3"/>
      )}
      <rect
        x={x} y={y} width={w} height={h} rx={3}
        fill={isLoto ? `url(#${hatchId})` : (isLoad ? color + '14' : t.surface)}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={dashed ? '4 3' : 'none'}
      />
      {isAlarm && (
        <rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} rx={5}
              fill="none" stroke={t.statusAlarm} strokeWidth={1}
              strokeOpacity={0.4}>
          <animate attributeName="stroke-opacity" values="0.4;0.05;0.4" dur="2s" repeatCount="indefinite"/>
        </rect>
      )}
      {isLoto && (
        <g transform={`translate(${x + w - 16}, ${y + 4})`}>
          <rect x="-1" y="-1" width="13" height="13" rx="2"
                fill={t.bg} stroke={t.statusLoto} strokeWidth="0.8"/>
          <path d={`M 3 5.5 V 4 a 2 2 0 0 1 4 0 V 5.5`}
                fill="none" stroke={t.statusLoto} strokeWidth="1"/>
          <rect x="2" y="5.5" width="6" height="4.5" rx="0.7"
                fill={t.statusLoto} stroke="none"/>
        </g>
      )}
      <text x={x + w/2} y={y + 16}
            fontFamily={t.fontLabel} fontSize="10" fontWeight="700"
            fill={t.text} textAnchor="middle" letterSpacing="0.4">
        {label}
      </text>
      <text x={x + w/2} y={y + 30}
            fontFamily={t.fontLabel} fontSize="9" fontWeight="400"
            fill={t.textMid} textAnchor="middle" letterSpacing="0.2">
        {sub}
      </text>
      {kw && (
        <text x={x + w/2} y={y + h - 7}
              fontFamily={t.fontLabel} fontSize="9.5" fontWeight="600"
              fill={isAlarm ? t.statusAlarm : (isLoto ? t.statusLoto : color)}
              textAnchor="middle" letterSpacing="0.2">
          {kw}
        </text>
      )}
    </g>
  );
}

function DirChevronD({ x, y, color, dir = 'down', size = 5 }) {
  const flip = dir === 'up' ? -1 : 1;
  return (
    <path d={`M ${x - size} ${y - 2*flip} L ${x} ${y + 2*flip} L ${x + size} ${y - 2*flip}`}
          fill="none" stroke={color} strokeWidth={1.5}
          strokeLinecap="round" strokeLinejoin="round"/>
  );
}

function FlowDotD({ x1, y1, x2, y2, color, dur = 2.5 }) {
  return (
    <circle r={2.5} fill={color}>
      <animateMotion dur={`${dur}s`} repeatCount="indefinite"
        path={`M ${x1} ${y1} L ${x2} ${y2}`}/>
      <animate attributeName="opacity" values="0;1;1;0" dur={`${dur}s`} repeatCount="indefinite"/>
    </circle>
  );
}

function XfmrSymbolD({ cx, cy, color }) {
  return (
    <g>
      <circle cx={cx} cy={cy - 7} r={8} fill="none" stroke={color} strokeWidth={1.5}/>
      <circle cx={cx} cy={cy + 7} r={8} fill="none" stroke={color} strokeWidth={1.5}/>
    </g>
  );
}

function BreakerSymbolD({ cx, cy, color, closed = true }) {
  if (closed) {
    return (
      <g>
        <rect x={cx - 6} y={cy - 5} width={12} height={10} fill="none" stroke={color} strokeWidth={1.5}/>
        <line x1={cx - 6} y1={cy} x2={cx + 6} y2={cy} stroke={color} strokeWidth={1.5}/>
      </g>
    );
  }
  return (
    <g>
      <rect x={cx - 6} y={cy - 5} width={12} height={10} fill="none" stroke={color} strokeWidth={1.5}/>
      <line x1={cx - 6} y1={cy + 5} x2={cx + 6} y2={cy - 5} stroke={color} strokeWidth={1.5}/>
    </g>
  );
}

function PcsSymbolD({ cx, cy, color, status, t }) {
  const dim = status === 'offline';
  const r = 11;
  return (
    <g style={{ opacity: dim ? 0.55 : 1 }}>
      <path d={`M ${cx} ${cy - r} L ${cx + r} ${cy} L ${cx} ${cy + r} L ${cx - r} ${cy} Z`}
            fill={t.surface} stroke={color} strokeWidth={status === 'alarm' ? 2 : 1.25}/>
      <path d={`M ${cx - 5.5} ${cy} q 1.8 -3.5 3.6 0 q 1.8 3.5 3.6 0`}
            fill="none" stroke={color} strokeWidth={1}/>
    </g>
  );
}

function BatterySymbolD({ cx, cy, color, dim }) {
  return (
    <g style={{ opacity: dim ? 0.55 : 1 }}>
      <line x1={cx - 12} y1={cy - 9} x2={cx + 12} y2={cy - 9} stroke={color} strokeWidth={2.5}/>
      <line x1={cx - 7}  y1={cy - 4} x2={cx + 7}  y2={cy - 4} stroke={color} strokeWidth={1.5}/>
      <line x1={cx - 12} y1={cy + 1} x2={cx + 12} y2={cy + 1} stroke={color} strokeWidth={2.5}/>
      <line x1={cx - 7}  y1={cy + 6} x2={cx + 7}  y2={cy + 6} stroke={color} strokeWidth={1.5}/>
    </g>
  );
}

// ─── Main diagram ─────────────────────────────────────────────────────
function SldDiagramD({ t, selectedId, onSelect }) {
  const W = 880, H = 600;
  const lineColor = t.textMid;
  const busColor = t.colorGrid;

  // Vertical structure
  const yUtil = 26;
  const yXfmr = 80;
  const yBkr  = 130;
  const yBus  = 180;

  // Bus drops & node geometry
  const nodes = useMemoSLD(() => {
    const all = [
      ...SLD_FLEET.bess.map(n => ({ ...n, kind: 'bess' })),
      ...SLD_FLEET.compute.map(n => ({ ...n, kind: 'compute' })),
    ];
    // Distribute across the bus width
    const padL = 40, padR = 40;
    const usable = W - padL - padR;
    const slotW = usable / all.length;
    return all.map((n, i) => ({
      ...n,
      cx: Math.round(padL + slotW * (i + 0.5)),
      slotW: Math.round(slotW),
    }));
  }, []);

  // Node card geometry
  const cardW = 70, cardH = 56;
  const yPcs = yBus + 36;
  const yCard = yBus + 60;
  const yBattery = yCard + cardH + 18;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%"
         preserveAspectRatio="xMidYMid meet"
         style={{ display: 'block' }}>
      {/* ─── Utility tie ─── */}
      <text x={W/2} y={yUtil - 2} fontFamily={t.fontLabel} fontSize="9" fontWeight="700"
            letterSpacing="0.4" fill={t.textSoft} textAnchor="middle">
        UTILITY · 13.2 kV · CAISO
      </text>
      <circle cx={W/2} cy={yUtil + 18} r={11} fill="none" stroke={busColor} strokeWidth={1.5}/>
      <text x={W/2} y={yUtil + 22} fontFamily={t.fontLabel} fontSize="10" fontWeight="700"
            fill={busColor} textAnchor="middle">G</text>
      <line x1={W/2} y1={yUtil + 29} x2={W/2} y2={yXfmr - 12} stroke={lineColor} strokeWidth={1.25}/>
      <XfmrSymbolD cx={W/2} cy={yXfmr} color={lineColor}/>
      <text x={W/2 + 22} y={yXfmr + 4} fontFamily={t.fontLabel} fontSize="9"
            fill={t.textMid}>500 kVA · 13.2/0.48 kV</text>
      <line x1={W/2} y1={yXfmr + 16} x2={W/2} y2={yBkr - 8} stroke={lineColor} strokeWidth={1.25}/>
      <BreakerSymbolD cx={W/2} cy={yBkr} color={t.statusOk} closed={true}/>
      <text x={W/2 + 22} y={yBkr + 4} fontFamily={t.fontLabel} fontSize="9"
            fill={t.statusOk} fontWeight="600">MAIN · CLOSED</text>
      <line x1={W/2} y1={yBkr + 7} x2={W/2} y2={yBus} stroke={lineColor} strokeWidth={1.25}/>
      <DirChevronD x={W/2} y={yBkr + 30} color={busColor} dir="down" size={6}/>
      <FlowDotD x1={W/2} y1={yUtil + 30} x2={W/2} y2={yBus} color={busColor} dur={3}/>
      <FlowDotD x1={W/2} y1={yUtil + 30} x2={W/2} y2={yBus} color={busColor} dur={3}/>

      {/* Import label */}
      <text x={W/2 - 60} y={yUtil + 22} fontFamily={t.fontLabel} fontSize="11" fontWeight="700"
            fill={busColor} textAnchor="end">+142 kW</text>
      <text x={W/2 - 60} y={yUtil + 33} fontFamily={t.fontLabel} fontSize="8"
            fill={t.textSoft} textAnchor="end" letterSpacing="0.2">IMPORT</text>

      {/* ─── 480 V Bus (horizontal) ─── */}
      <line x1={30} y1={yBus} x2={W - 30} y2={yBus} stroke={busColor} strokeWidth={3.5}/>
      <text x={30} y={yBus - 10} fontFamily={t.fontLabel} fontSize="10" fontWeight="700"
            letterSpacing="0.4" fill={busColor}>
        480 V BUS · A-B-C · 60.01 Hz · 480.2 V
      </text>
      <text x={W - 30} y={yBus - 10} fontFamily={t.fontLabel} fontSize="9" fontWeight="600"
            letterSpacing="0.2" fill={t.statusOk} textAnchor="end">PHASE BAL · OK</text>

      {/* ─── Branches ─── */}
      {nodes.map((n) => {
        const isBess = n.kind === 'bess';
        const color = isBess ? t.colorBess : t.colorCompute;
        const selected = n.id === selectedId;
        // Branch CB is OPEN on LOTO and OFFLINE drops — the rest are implicit closed.
        const cbOpen = n.status === 'loto' || n.status === 'offline';
        const yCb = yBus + 12;
        // Drop from bus
        return (
          <g key={n.id}>
            {/* drop line — break around the CB symbol */}
            <line
              x1={n.cx} y1={yBus}
              x2={n.cx} y2={yCb - 5}
              stroke={lineColor}
              strokeWidth={1.25}
              opacity={n.status === 'offline' ? 0.55 : 1}
            />
            {/* Branch CB indicator on every drop — closed = small dot, open = visible badge */}
            {cbOpen ? (
              <g>
                <rect x={n.cx - 9} y={yCb - 5} width={18} height={10} rx={1.5}
                      fill={t.bg} stroke={t.statusAlarm} strokeWidth={1.25}/>
                <line x1={n.cx - 6} y1={yCb + 4} x2={n.cx + 6} y2={yCb - 4}
                      stroke={t.statusAlarm} strokeWidth={1.25}/>
                <text x={n.cx} y={yCb + 18} fontFamily={t.fontLabel} fontSize="7.5"
                      fontWeight="700" letterSpacing="0.3"
                      fill={t.statusAlarm} textAnchor="middle">CB OPEN</text>
              </g>
            ) : (
              <g>
                <circle cx={n.cx} cy={yCb} r={2.5} fill={t.statusOk} stroke="none"/>
              </g>
            )}
            <line
              x1={n.cx} y1={yCb + (cbOpen ? 22 : 4)}
              x2={n.cx} y2={isBess ? yPcs - 11 : yCard}
              stroke={lineColor}
              strokeWidth={1.25}
              strokeDasharray={n.status === 'offline' ? '4 3' : 'none'}
              opacity={n.status === 'offline' ? 0.55 : 1}
            />

            {/* Direction chevron */}
            {n.flow === 'down' && n.status !== 'offline' && (
              <DirChevronD x={n.cx} y={yBus + 22} color={color} dir="down" size={5}/>
            )}
            {n.flow === 'up' && (
              <DirChevronD x={n.cx} y={yBus + 22} color={color} dir="up" size={5}/>
            )}

            {/* Animated flow particle */}
            {n.flow === 'down' && n.status !== 'offline' && (
              <FlowDotD x1={n.cx} y1={yBus + 4} x2={n.cx} y2={yCard - 2} color={color} dur={2.3}/>
            )}
            {n.flow === 'up' && (
              <FlowDotD x1={n.cx} y1={yPcs - 11} x2={n.cx} y2={yBus + 2} color={color} dur={2.3}/>
            )}

            {/* BESS gets PCS symbol above the card */}
            {isBess && (
              <g>
                <line x1={n.cx} y1={yPcs + 11} x2={n.cx} y2={yCard} stroke={lineColor} strokeWidth={1}/>
                <PcsSymbolD cx={n.cx} cy={yPcs} color={color} status={n.status} t={t}/>
              </g>
            )}

            {/* Card */}
            <NodeBoxD
              x={n.cx - cardW/2} y={yCard} w={cardW} h={cardH}
              color={color} label={n.label} sub={n.sub} kw={n.kw}
              t={t} status={n.status}
              isLoad={!isBess} dashed={n.status === 'offline'}
              selected={selected}
              onClick={() => onSelect(n.id)}
            />

            {/* BESS: battery symbol below card */}
            {isBess && n.status !== 'loto' && (
              <BatterySymbolD cx={n.cx} cy={yBattery} color={color} dim={n.status === 'offline'}/>
            )}
            {/* BESS-04 LOTO permit badge on the node */}
            {n.id === 'bess-04' && (
              <text x={n.cx} y={yCard - 4} fontFamily={t.fontLabel} fontSize="8"
                    fontWeight="700" fill={t.statusLoto} textAnchor="middle"
                    letterSpacing="0.3">
                PMT-2026-0418 · J.R.
              </text>
            )}
          </g>
        );
      })}

      {/* ─── Net flow legend (bottom) ─── */}
      <g transform={`translate(40, ${H - 36})`}>
        <text x={0} y={0} fontFamily={t.fontLabel} fontSize="10" fontWeight="700"
              letterSpacing="0.3" fill={t.textSoft}>
          NET FLOW · 14:24:18
        </text>
        <text x={0} y={18} fontFamily={t.fontLabel} fontSize="11">
          <tspan fill={busColor} fontWeight="700">+142 kW</tspan>
          <tspan fill={t.textMid}> import</tspan>
          <tspan fill={t.textSoft}>  ·  </tspan>
          <tspan fill={t.colorBess} fontWeight="700">−42 kW</tspan>
          <tspan fill={t.textMid}> bess net (1 of 3 available · 1 LOTO)</tspan>
          <tspan fill={t.textSoft}>  ·  </tspan>
          <tspan fill={t.colorCompute} fontWeight="700">184 kW</tspan>
          <tspan fill={t.textMid}> compute load (7 of 8 racks)</tspan>
        </text>
      </g>
    </svg>
  );
}

// ─── Inspector panel ─────────────────────────────────────────────────────
function StateBadge({ t, state }) {
  const colorMap = {
    OK: t.statusOk, WARN: t.statusWarn, ALARM: t.statusAlarm,
    LOTO: t.statusLoto, OFFLINE: t.statusOffline,
  };
  const c = colorMap[state] || t.statusOk;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 8px',
      background: c + '18',
      border: `1px solid ${c}40`,
      borderRadius: RADIUS[2],
      fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700,
      letterSpacing: 0.2, color: c, textTransform: 'uppercase',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c }}/>
      {state}
    </span>
  );
}

function InspectorPanel({ t, selectedId }) {
  const data = inspectorFor(selectedId);
  if (!data) return null;
  const isSov = t.name === 'sovereign';

  return (
    <div style={{
      width: 320,
      borderLeft: `1px solid ${t.border}`,
      background: t.bg,
      display: 'flex', flexDirection: 'column',
      flexShrink: 0, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: `${SPACE[4]}px ${SPACE[5]}px`,
        borderBottom: `1px solid ${t.border}`,
        background: t.surface,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: SPACE[2],
          marginBottom: 6,
        }}>
          <span style={{
            fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700,
            letterSpacing: 0.2, color: t.textSoft, textTransform: 'uppercase',
          }}>{data.kind}</span>
          <span style={{ flex: 1 }}/>
          <StateBadge t={t} state={data.state}/>
        </div>
        <div style={{
          fontFamily: t.fontHeading, fontSize: 22, lineHeight: 1.1,
          fontWeight: isSov ? 400 : 600,
          letterSpacing: isSov ? 0.5 : 0,
          color: t.text,
          textTransform: isSov ? 'uppercase' : 'none',
        }}>{data.title}</div>
      </div>

      {/* Body — scrollable */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Alarm banner */}
        {data.alarm && (
          <div style={{
            padding: `${SPACE[3]}px ${SPACE[5]}px`,
            borderBottom: `1px solid ${t.border}`,
            borderLeft: `3px solid ${
              data.alarm.level === 'alarm' ? t.statusAlarm :
              data.alarm.level === 'warn' ? t.statusWarn :
              data.alarm.level === 'loto' ? t.statusLoto : t.statusOffline
            }`,
            background: t.bg,
          }}>
            <div style={{
              display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4,
            }}>
              <span style={{
                fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700,
                letterSpacing: 0.15,
                color: data.alarm.level === 'alarm' ? t.statusAlarm :
                       data.alarm.level === 'warn' ? t.statusWarn :
                       data.alarm.level === 'loto' ? t.statusLoto : t.statusOffline,
              }}>{data.alarm.code}</span>
              <span style={{ flex: 1 }}/>
              <span style={{
                fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft,
                letterSpacing: 0.15, textTransform: 'uppercase',
              }}>{data.alarm.ackAge}</span>
            </div>
            <div style={{
              fontFamily: t.fontBody, fontSize: 12, color: t.text, lineHeight: 1.4,
            }}>{data.alarm.text}</div>
          </div>
        )}

        {/* LOTO permit (BESS-04) — required for safety audit trail */}
        {data.permit && (
          <div style={{
            padding: `${SPACE[3]}px ${SPACE[5]}px`,
            borderBottom: `1px solid ${t.border}`,
            background: t.statusLoto + '0a',
          }}>
            <div style={{
              display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: SPACE[2],
            }}>
              <span style={{
                fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700,
                letterSpacing: 0.2, color: t.statusLoto, textTransform: 'uppercase',
              }}>LOTO permit</span>
              <span style={{ flex: 1 }}/>
              <a href="#" style={{
                fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700,
                letterSpacing: 0.15, color: t.accent, textTransform: 'uppercase',
                textDecoration: 'underline', textDecorationStyle: 'dotted',
                textUnderlineOffset: 2, cursor: 'pointer',
              }}>View permit ›</a>
            </div>
            <div style={{
              fontFamily: t.fontLabel, fontSize: 13, fontWeight: 700, color: t.text,
              letterSpacing: 0.2, marginBottom: 4,
            }}>{data.permit.number}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '3px 8px' }}>
              {[
                { k: 'Locked by', v: data.permit.lockedBy },
                { k: 'Locked at', v: data.permit.lockedAt },
                { k: 'Reason',    v: data.permit.reason },
                { k: 'Clear by',  v: data.permit.clearTarget },
              ].map((row, i) => (
                <React.Fragment key={i}>
                  <div style={{
                    fontFamily: t.fontLabel, fontSize: 9, fontWeight: 600,
                    letterSpacing: 0.15, color: t.textSoft, textTransform: 'uppercase',
                    paddingTop: 1,
                  }}>{row.k}</div>
                  <div style={{
                    fontFamily: t.fontBody, fontSize: 11.5, color: t.text, lineHeight: 1.35,
                  }}>{row.v}</div>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Live state */}
        <div style={{ padding: `${SPACE[4]}px ${SPACE[5]}px` }}>
          <div style={{
            fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700,
            letterSpacing: 0.2, color: t.textSoft, textTransform: 'uppercase',
            marginBottom: SPACE[3],
          }}>Live state</div>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: `${SPACE[3]}px ${SPACE[4]}px`,
          }}>
            {data.live.map((kv, i) => (
              <div key={i}>
                <div style={{
                  fontFamily: t.fontLabel, fontSize: 9, fontWeight: 600,
                  letterSpacing: 0.15, color: t.textSoft, textTransform: 'uppercase',
                  marginBottom: 2,
                }}>{kv.k}</div>
                <div style={{
                  fontFamily: t.fontLabel, fontSize: 14, fontWeight: 600,
                  color: t.text, lineHeight: 1.1,
                }}>{kv.v}</div>
                {kv.hint && (
                  <div style={{
                    fontFamily: t.fontBody, fontSize: 10, color: t.textSoft,
                    marginTop: 2, lineHeight: 1.3,
                  }}>{kv.hint}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent events */}
        {data.recent && data.recent.length > 0 && (
          <div style={{
            padding: `${SPACE[4]}px ${SPACE[5]}px`,
            borderTop: `1px solid ${t.border}`,
          }}>
            <div style={{
              fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700,
              letterSpacing: 0.2, color: t.textSoft, textTransform: 'uppercase',
              marginBottom: SPACE[3],
            }}>Recent events</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[2] }}>
              {data.recent.map((r, i) => (
                <div key={i} style={{
                  display: 'flex', gap: SPACE[2], alignItems: 'flex-start',
                }}>
                  <div style={{
                    fontFamily: t.fontLabel, fontSize: 9, fontWeight: 600,
                    letterSpacing: 0.1, color: t.textSoft, textTransform: 'uppercase',
                    width: 56, flexShrink: 0, paddingTop: 1,
                  }}>{r.ago}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700,
                      letterSpacing: 0.1, color: r.who === 'AUTO' ? t.textMid : t.accent,
                    }}>{r.who}</div>
                    <div style={{
                      fontFamily: t.fontBody, fontSize: 11.5, color: t.text,
                      lineHeight: 1.35, marginTop: 1,
                    }}>{r.what}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div style={{
        padding: `${SPACE[3]}px ${SPACE[5]}px`,
        borderTop: `1px solid ${t.border}`,
        background: t.surface,
        flexShrink: 0,
      }}>
        <a href="#" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 12px',
          background: t.bg,
          border: `1px solid ${t.border}`,
          borderRadius: RADIUS[2],
          fontFamily: t.fontLabel, fontSize: 11, fontWeight: 700,
          letterSpacing: 0.2, color: t.text, textTransform: 'uppercase',
          textDecoration: 'none', cursor: 'pointer',
        }}>
          <span>{data.deepLink.label}</span>
          <span style={{ color: t.accent, fontSize: 14 }}>›</span>
        </a>
      </div>
    </div>
  );
}

// ─── Composed body ─────────────────────────────────────────────────────
function SldDesktopBody({ t, density = 'dense' }) {
  const [layer, setLayer] = useStateSLD('power');
  const [selectedId, setSelectedId] = useStateSLD(SLD_INSPECTOR.defaultId);

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      minHeight: 0, background: t.bg,
    }}>
      <LayerToolbar t={t} layer={layer} onLayer={setLayer} density={density}/>

      {/* Read-only banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: SPACE[2],
        padding: density === 'dense'
          ? `${SPACE[2]}px ${SPACE[5]}px`
          : `${SPACE[3]}px ${SPACE[5]}px`,
        borderBottom: `1px solid ${t.border}`,
        background: t.bg,
        flexShrink: 0,
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
          <path d="M7 11 V8 a5 5 0 0 1 10 0 V11 M5 11 H19 V20 H5 Z"
                fill="none" stroke={t.textSoft} strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{
          fontFamily: t.fontLabel, fontSize: 10, fontWeight: 600,
          letterSpacing: 0.18, color: t.textSoft, textTransform: 'uppercase',
        }}>Read-only · open module to control</span>
        <span style={{ flex: 1 }}/>
        <span style={{
          fontFamily: t.fontLabel, fontSize: 10, fontWeight: 600,
          letterSpacing: 0.18, color: t.textSoft, textTransform: 'uppercase',
        }}>+ charge / − discharge · ↓ load draw / ↑ source feed</span>
      </div>

      {/* Canvas + Inspector */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div style={{
          flex: 1, padding: SPACE[4], minWidth: 0, overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <SldDiagramD t={t} selectedId={selectedId} onSelect={setSelectedId}/>
        </div>
        <InspectorPanel t={t} selectedId={selectedId}/>
      </div>
    </div>
  );
}

window.SldDesktopBody = SldDesktopBody;
