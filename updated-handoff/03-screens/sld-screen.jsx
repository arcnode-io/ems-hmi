// sld-screen.jsx — Single Line Diagram (`/modules/sld`) at phone breakpoint.
// Spec: ems-hmi-ia-brief.md §6.2 SLD entry.
//
// This is an ELECTRICAL drawing. Not a logical-module map.
// Grid + BESS get full electrical detail (PCS, breakers, transformer).
// Compute modules show as labelled LOAD BLOCKS with kW draw (DLC cooling is
// internal to each Compute module so it folds into compute load). Tapping any
// node navigates to that module's detail.

const SLD_NODES = {
  utility:  { name: 'Utility',     sub: '13.2 kV',     status: 'ok',    kw: '+142 kW' },
  xfmr:     { name: 'Main Xfmr',   sub: '500 kVA',     status: 'ok',    kw: null },
  mainBkr:  { name: 'Main Bkr',    sub: 'CLOSED',      status: 'ok',    kw: null },
  bus:      { name: '480 V Bus',   sub: 'A-B-C · 60Hz', status: 'ok',   kw: null },
  bessPcs1: { name: 'PCS-01',      sub: 'BESS-01',     status: 'ok',    kw: '0 kW' },
  bess1:    { name: 'BESS-01',     sub: 'SoC 81%',     status: 'ok',    kw: null },
  bessPcs2: { name: 'PCS-02',      sub: 'BESS-02',     status: 'alarm', kw: '−42 kW' },
  bess2:    { name: 'BESS-02',     sub: 'SoC 67%',     status: 'alarm', kw: null },
  computeS04: { name: 'COMPUTE-S04', sub: '8 svr · DLC', status: 'warn', kw: '92.4 kW' },
  computeS14: { name: 'COMPUTE-S14', sub: '8 svr · DLC', status: 'ok',   kw: '91.8 kW' },
  edge:       { name: 'COMPUTE-EDGE', sub: '4 svr · air', status: 'offline', kw: '— kW' },
};

// ─── Top bar ───
function SldTopBar({ t }) {
  const isSov = t.name === 'sovereign';
  return (
    <div style={{
      padding: `10px ${SPACE[4]}px`,
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
        }}>Single Line Diagram</div>
        <div style={{
          fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.15,
          color: t.textSoft, marginTop: 1, textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>Brookside DC-1 · 480 V bus</div>
      </div>
      {/* Data freshness — when did the bound MQTT values last update */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontFamily: t.fontLabel, fontSize: 9, fontWeight: 600,
          letterSpacing: 0.18, color: t.statusOk, textTransform: 'uppercase',
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%', background: t.statusOk,
            boxShadow: `0 0 0 3px ${t.statusOk}25`,
          }}/>
          Live
        </div>
        <div style={{
          fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft,
          letterSpacing: 0.1, marginTop: 2,
        }}>1s ago</div>
      </div>
      {/* Zoom controls — visual stub, the real screen has pinch */}
      <div style={{
        display: 'flex', border: `1px solid ${t.border}`,
        borderRadius: RADIUS[2], overflow: 'hidden', marginLeft: 4,
      }}>
        <button style={{
          width: 28, height: 28, background: 'transparent', border: 'none',
          color: t.textMid, fontFamily: t.fontLabel, fontSize: 16, lineHeight: 1,
          cursor: 'pointer', borderRight: `1px solid ${t.border}`,
        }}>−</button>
        <button style={{
          width: 28, height: 28, background: 'transparent', border: 'none',
          color: t.textMid, fontFamily: t.fontLabel, fontSize: 14, lineHeight: 1,
          cursor: 'pointer',
        }}>+</button>
      </div>
    </div>
  );
}

// ─── Quick-tap badge strip (per brief: "fast-tap alternative to tapping nodes") ───
function BadgeStrip({ t }) {
  const items = [
    { id: 'bess-01', label: 'BESS-01', cls: 'bess', status: 'ok' },
    { id: 'bess-02', label: 'BESS-02', cls: 'bess', status: 'alarm' },
    { id: 'compute-s04', label: 'COMPUTE-S04', cls: 'compute', status: 'warn' },
    { id: 'compute-s14', label: 'COMPUTE-S14', cls: 'compute', status: 'ok' },
    { id: 'edge',        label: 'EDGE',        cls: 'compute', status: 'offline' },
    { id: 'grid-01',     label: 'GRID',        cls: 'grid',    status: 'ok' },
  ];
  const sColor = (s) => ({
    ok: t.statusOk, warn: t.statusWarn, alarm: t.statusAlarm,
    fire: t.statusFire, loto: t.statusLoto, offline: t.statusOffline,
  })[s] || t.statusOk;
  const cColor = (c) => ({
    bess: t.colorBess, compute: t.colorCompute, grid: t.colorGrid,
  })[c] || t.text;

  return (
    <div style={{
      borderBottom: `1px solid ${t.border}`,
      background: t.panel,
      padding: `${SPACE[2]}px ${SPACE[4]}px`,
      overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none',
      WebkitOverflowScrolling: 'touch',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {items.map(it => (
          <button key={it.id} style={{
            padding: '5px 9px',
            background: 'transparent',
            border: `1px solid ${t.border}`,
            borderLeft: `3px solid ${sColor(it.status)}`,
            borderRadius: RADIUS[2],
            display: 'inline-flex', alignItems: 'center', gap: 5,
            cursor: 'pointer', flexShrink: 0,
            color: t.text, fontFamily: t.fontLabel, fontSize: 10, fontWeight: 600,
            letterSpacing: 0.1,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: cColor(it.cls), flexShrink: 0,
            }}/>
            {it.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── SLD primitives ───
function NodeBox({ x, y, w, h, color, label, sub, kw, t, status, isLoad = false, dashed = false }) {
  const dim = status === 'offline';
  const isLoto = status === 'loto';
  // OFFLINE: dimmed + dashed (system says gone). LOTO: solid + hatched fill + padlock overlay
  // (operator-asserted lockout — commands inhibited, audit-logged).
  const strokeColor = isLoto ? t.statusLoto : color;
  return (
    <g style={{ opacity: dim ? 0.5 : 1 }}>
      {isLoto && (
        <defs>
          <pattern id={`hatch-${x}-${y}`} patternUnits="userSpaceOnUse" width="5" height="5"
                   patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="5" stroke={t.statusLoto} strokeWidth="1" strokeOpacity="0.18"/>
          </pattern>
        </defs>
      )}
      <rect
        x={x} y={y} width={w} height={h} rx={3}
        fill={isLoto ? `url(#hatch-${x}-${y})` : (isLoad ? color + '14' : t.surface)}
        stroke={strokeColor}
        strokeWidth={status === 'alarm' ? 2 : 1.25}
        strokeDasharray={dashed ? '3 2' : 'none'}
      />
      {status === 'alarm' && (
        <rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} rx={5}
              fill="none" stroke={t.statusAlarm} strokeWidth={1}
              strokeOpacity={0.4}>
          <animate attributeName="stroke-opacity" values="0.4;0.05;0.4" dur="2s" repeatCount="indefinite"/>
        </rect>
      )}
      {isLoto && (
        // Padlock overlay top-right: universal LOTO symbol per IA brief §6.2.
        <g transform={`translate(${x + w - 13}, ${y + 3})`}>
          <rect x="-1" y="-1" width="11" height="11" rx="1.5"
                fill={t.bg} stroke={t.statusLoto} strokeWidth="0.75"/>
          <path d={`M 2.5 4.5 V 3.2 a 1.5 1.5 0 0 1 3 0 V 4.5`}
                fill="none" stroke={t.statusLoto} strokeWidth="0.9"/>
          <rect x="1.5" y="4.5" width="5" height="3.8" rx="0.6"
                fill={t.statusLoto} stroke="none"/>
        </g>
      )}
      <text x={x + w/2} y={y + 14}
            fontFamily={t.fontLabel} fontSize="9" fontWeight="700"
            fill={t.text} textAnchor="middle" letterSpacing="0.4">
        {label}
      </text>
      <text x={x + w/2} y={y + 25}
            fontFamily={t.fontLabel} fontSize="7.5" fontWeight="400"
            fill={t.textMid} textAnchor="middle" letterSpacing="0.2">
        {sub}
      </text>
      {kw && (
        <text x={x + w/2} y={y + h - 5}
              fontFamily={t.fontLabel} fontSize="8" fontWeight="600"
              fill={status === 'alarm' ? t.statusAlarm : (isLoto ? t.statusLoto : color)}
              textAnchor="middle" letterSpacing="0.2">
          {kw}
        </text>
      )}
    </g>
  );
}

// Static directional arrow (chevron) — pairs with animated FlowArrow particles for clarity.
// Arrow points toward `to`. dir: 'down' | 'up'.
function DirChevron({ x, y, color, dir = 'down', size = 5 }) {
  const flip = dir === 'up' ? -1 : 1;
  return (
    <path d={`M ${x - size} ${y - 2*flip} L ${x} ${y + 2*flip} L ${x + size} ${y - 2*flip}`}
          fill="none" stroke={color} strokeWidth={1.5}
          strokeLinecap="round" strokeLinejoin="round"/>
  );
}

// Battery-cell symbol (drawn ABOVE the BESS PCS) — the IEEE convention for batteries
function BatterySymbol({ cx, cy, color, t, dim }) {
  return (
    <g style={{ opacity: dim ? 0.55 : 1 }}>
      <line x1={cx - 10} y1={cy - 8} x2={cx + 10} y2={cy - 8} stroke={color} strokeWidth={2.5}/>
      <line x1={cx - 6}  y1={cy - 4} x2={cx + 6}  y2={cy - 4} stroke={color} strokeWidth={1.5}/>
      <line x1={cx - 10} y1={cy}     x2={cx + 10} y2={cy}     stroke={color} strokeWidth={2.5}/>
      <line x1={cx - 6}  y1={cy + 4} x2={cx + 6}  y2={cy + 4} stroke={color} strokeWidth={1.5}/>
    </g>
  );
}

// Transformer symbol (two interlocked circles, IEEE convention)
function XfmrSymbol({ cx, cy, color, t }) {
  return (
    <g>
      <circle cx={cx} cy={cy - 6} r={6.5} fill="none" stroke={color} strokeWidth={1.5}/>
      <circle cx={cx} cy={cy + 6} r={6.5} fill="none" stroke={color} strokeWidth={1.5}/>
    </g>
  );
}

// Closed breaker (square notch on the line), used at main breaker
function BreakerSymbol({ cx, cy, color, closed = true }) {
  if (closed) {
    return (
      <g>
        <rect x={cx - 5} y={cy - 4} width={10} height={8} fill="none" stroke={color} strokeWidth={1.5}/>
        <line x1={cx - 5} y1={cy} x2={cx + 5} y2={cy} stroke={color} strokeWidth={1.5}/>
      </g>
    );
  }
  return (
    <g>
      <rect x={cx - 5} y={cy - 4} width={10} height={8} fill="none" stroke={color} strokeWidth={1.5}/>
      <line x1={cx - 5} y1={cy + 4} x2={cx + 5} y2={cy - 4} stroke={color} strokeWidth={1.5}/>
    </g>
  );
}

// PCS / inverter — diamond with sine wave inside (DC↔AC convention)
function PcsSymbol({ cx, cy, color, status, t }) {
  const dim = status === 'offline';
  const r = 9;
  return (
    <g style={{ opacity: dim ? 0.55 : 1 }}>
      <path d={`M ${cx} ${cy - r} L ${cx + r} ${cy} L ${cx} ${cy + r} L ${cx - r} ${cy} Z`}
            fill={t.surface} stroke={color} strokeWidth={status === 'alarm' ? 2 : 1.25}/>
      <path d={`M ${cx - 4.5} ${cy} q 1.5 -3 3 0 q 1.5 3 3 0`}
            fill="none" stroke={color} strokeWidth={1}/>
    </g>
  );
}

// Power-flow arrow on a bus segment, animated
function FlowArrow({ x1, y1, x2, y2, color, reverse = false, key: k }) {
  // Simple animated triangular arrow that walks along the line
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx*dx + dy*dy);
  return (
    <g>
      <circle r={2} fill={color}>
        <animateMotion dur="2.5s" repeatCount="indefinite"
          path={reverse ? `M ${x2} ${y2} L ${x1} ${y1}` : `M ${x1} ${y1} L ${x2} ${y2}`}/>
        <animate attributeName="opacity" values="0;1;1;0" dur="2.5s" repeatCount="indefinite"/>
      </circle>
    </g>
  );
}

// ─── The diagram itself ───
function SldDiagram({ t }) {
  // Canvas: 360 wide, ~640 tall. Designed to fit in the phone scroll area at 1:1.
  const W = 360, H = 680;
  const lineColor = t.textMid;
  const busColor = t.colorGrid;

  // Layout columns — 4-column phone layout: 2 BESS + 2 Compute
  const colBess1    = 44;
  const colBess2    = 120;
  const colComputeA = 215;
  const colComputeB = 305;
  // Bus level
  const busY = 230;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      {/* ─── Utility & main feed (top) ─── */}
      <text x={W/2} y={28} fontFamily={t.fontLabel} fontSize="8" fontWeight="600"
            letterSpacing="0.4" fill={t.textSoft} textAnchor="middle">
        UTILITY · 13.2 kV
      </text>
      {/* Utility "lollipop" symbol */}
      <circle cx={W/2} cy={48} r={9} fill="none" stroke={busColor} strokeWidth={1.5}/>
      <text x={W/2} y={51} fontFamily={t.fontLabel} fontSize="8" fontWeight="700"
            fill={busColor} textAnchor="middle">G</text>
      {/* Drop to transformer */}
      <line x1={W/2} y1={57} x2={W/2} y2={88} stroke={lineColor} strokeWidth={1.25}/>
      {/* Transformer */}
      <XfmrSymbol cx={W/2} cy={100} color={lineColor} t={t}/>
      <text x={W/2 + 20} y={104} fontFamily={t.fontLabel} fontSize="8"
            fill={t.textMid}>500 kVA</text>
      {/* Drop to main breaker */}
      <line x1={W/2} y1={114} x2={W/2} y2={140} stroke={lineColor} strokeWidth={1.25}/>
      <BreakerSymbol cx={W/2} cy={148} color={t.statusOk} closed={true}/>
      <text x={W/2 + 20} y={152} fontFamily={t.fontLabel} fontSize="8"
            fill={t.statusOk} fontWeight="600">CLOSED</text>
      {/* Drop to bus */}
      <line x1={W/2} y1={156} x2={W/2} y2={busY} stroke={lineColor} strokeWidth={1.25}/>

      {/* Static direction chevron — utility imports DOWN to bus */}
      <DirChevron x={W/2} y={194} color={busColor} dir="down"/>

      {/* Power flow on import line — utility is importing 142 kW down */}
      <FlowArrow x1={W/2} y1={60} x2={W/2} y2={busY} color={busColor}/>
      <FlowArrow x1={W/2} y1={60} x2={W/2} y2={busY} color={busColor}/>

      {/* ─── 480 V Bus ─── */}
      <line x1={20} y1={busY} x2={W - 20} y2={busY} stroke={busColor} strokeWidth={3}/>
      <text x={20} y={busY - 8} fontFamily={t.fontLabel} fontSize="8" fontWeight="700"
            letterSpacing="0.4" fill={busColor}>480 V · 60.01 Hz · A-B-C</text>

      {/* Drops from bus down to each branch */}
      {[colBess1, colBess2, colComputeA, colComputeB].map((cx, i) => (
        <line key={i} x1={cx} y1={busY} x2={cx} y2={busY + 24} stroke={lineColor} strokeWidth={1}/>
      ))}

      {/* ─── BESS-01 branch (PCS → battery) ─── */}
      <PcsSymbol cx={colBess1} cy={busY + 36} color={t.colorBess} status="ok" t={t}/>
      <line x1={colBess1} y1={busY + 46} x2={colBess1} y2={busY + 70} stroke={lineColor} strokeWidth={1}/>
      <NodeBox x={colBess1 - 30} y={busY + 70} w={60} h={48}
               color={t.colorBess} label="BESS-01" sub="2 MWh" kw="SoC 81%"
               t={t} status="ok"/>
      <BatterySymbol cx={colBess1} cy={busY + 138} color={t.colorBess} t={t}/>
      {/* BESS-01 idle indicator — explicit "no flow" instead of bare "0 kW" */}
      <text x={colBess1} y={busY + 158} fontFamily={t.fontLabel} fontSize="7.5"
            fill={t.textSoft} textAnchor="middle">0 kW · IDLE</text>

      {/* ─── BESS-02 branch (PCS → battery, ALARM, DISCHARGING) ─── */}
      <PcsSymbol cx={colBess2} cy={busY + 36} color={t.colorBess} status="alarm" t={t}/>
      <line x1={colBess2} y1={busY + 46} x2={colBess2} y2={busY + 70} stroke={lineColor} strokeWidth={1}/>
      <NodeBox x={colBess2 - 30} y={busY + 70} w={60} h={48}
               color={t.colorBess} label="BESS-02" sub="2 MWh" kw="SoC 67%"
               t={t} status="alarm"/>
      <BatterySymbol cx={colBess2} cy={busY + 138} color={t.colorBess} t={t}/>
      <text x={colBess2} y={busY + 158} fontFamily={t.fontLabel} fontSize="7.5"
            fill={t.statusAlarm} fontWeight="600" textAnchor="middle">−42 kW · DISCHARGE</text>
      {/* Static UP chevron + animated particles: BESS-02 is delivering kW UP to bus */}
      <DirChevron x={colBess2} y={busY + 14} color={t.colorBess} dir="up"/>
      <FlowArrow x1={colBess2} y1={busY + 70} x2={colBess2} y2={busY + 24} color={t.colorBess}/>

      {/* ─── COMPUTE-S04 branch (warn — CDU outlet rising) ─── */}
      <DirChevron x={colComputeA} y={busY + 30} color={t.colorCompute} dir="down"/>
      <NodeBox x={colComputeA - 38} y={busY + 36} w={76} h={48}
               color={t.colorCompute} label="COMPUTE-S04" sub="8 svr · DLC" kw="92.4 kW · DRAW"
               t={t} status="warn" isLoad/>
      <FlowArrow x1={colComputeA} y1={busY + 24} x2={colComputeA} y2={busY + 36} color={t.colorCompute}/>
      {/* COMPUTE-EDGE — separate small load (offline), stacked under S04 */}
      <line x1={colComputeA} y1={busY + 84} x2={colComputeA} y2={busY + 100} stroke={lineColor} strokeWidth={1}
            strokeDasharray="3 2"/>
      <NodeBox x={colComputeA - 38} y={busY + 100} w={76} h={42}
               color={t.colorCompute} label="EDGE" sub="4 svr · L40S" kw="OFFLINE"
               t={t} status="offline" isLoad dashed/>

      {/* ─── COMPUTE-S14 branch (ok — pushing power cap) ─── */}
      <DirChevron x={colComputeB} y={busY + 30} color={t.colorCompute} dir="down"/>
      <NodeBox x={colComputeB - 38} y={busY + 36} w={76} h={48}
               color={t.colorCompute} label="COMPUTE-S14" sub="8 svr · DLC" kw="91.8 kW · DRAW"
               t={t} status="ok" isLoad/>
      <FlowArrow x1={colComputeB} y1={busY + 24} x2={colComputeB} y2={busY + 36} color={t.colorCompute}/>

      {/* ─── Net flow legend (bottom) ─── */}
      <g transform={`translate(20, ${H - 40})`}>
        <text x={0} y={0} fontFamily={t.fontLabel} fontSize="8" fontWeight="700"
              letterSpacing="0.3" fill={t.textSoft}>NET FLOW</text>
        <text x={0} y={14} fontFamily={t.fontLabel} fontSize="9"
              fill={t.text}>
          <tspan fill={busColor} fontWeight="600">+142 kW</tspan>
          <tspan fill={t.textMid}> import</tspan>
          <tspan fill={t.textSoft}>  ·  </tspan>
          <tspan fill={t.colorBess} fontWeight="600">−42 kW</tspan>
          <tspan fill={t.textMid}> bess</tspan>
          <tspan fill={t.textSoft}>  ·  </tspan>
          <tspan fill={t.colorCompute} fontWeight="600">184 kW</tspan>
          <tspan fill={t.textMid}> load</tspan>
        </text>
      </g>
    </svg>
  );
}

// ─── Composed screen ───
function SldScreen({ t }) {
  const isSov = t.name === 'sovereign';
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: '100%',
      background: t.bg,
    }}>
      <SldTopBar t={t}/>
      <StatusStrip t={t}/>
      <BadgeStrip t={t}/>
      {/* Read-only banner — SLD displays state; commanding lives in module detail screens */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: `${SPACE[2]}px ${SPACE[4]}px`,
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
          fontFamily: t.fontLabel, fontSize: 9, fontWeight: 600,
          letterSpacing: 0.18, color: t.textSoft, textTransform: 'uppercase',
        }}>Read-only · open module to control</span>
        <div style={{ flex: 1 }}/>
        <span style={{
          fontFamily: t.fontLabel, fontSize: 9, fontWeight: 600,
          letterSpacing: 0.18, color: t.textSoft, textTransform: 'uppercase',
        }}>+ charge / − discharge</span>
      </div>
      <div style={{
        flex: 1,
        background: t.bg,
        padding: `${SPACE[3]}px ${SPACE[2]}px`,
        position: 'relative',
      }}>
        <SldDiagram t={t}/>
      </div>
    </div>
  );
}

window.SldScreen = SldScreen;
