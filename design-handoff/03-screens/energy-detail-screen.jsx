// energy-detail-screen.jsx — Energy detail screen, mobile.
//
// IA brief §6.3 + §7: unified flow + market + revenue view. Operator question:
// "Is dispatch doing the right thing right now?"
//
// Layout decisions (per caveman feedback):
// • Hero D — flow diagram (boxed nodes + arrows, NOT curved Sankey — too narrow at 380px)
//            + money strip below.
// • NOW-focused — current interval, active dispatch, settlement clock, next-60-min forecast.
//   Day-level analytics live on the Analyst screen.
// • Light markets section — one row per active product, status pill, countdown.
// • "WHY ›" link from active dispatch → policy detail (placeholder anchor).

// ─── Mock data — site-realistic ────────────────────────────────────────────
const ENERGY = {
  // Active flow (kW). Sign convention: + into node, − out of node.
  pv:        2840,    // PV array generation
  bessOut:   1620,    // BESS net (positive = discharging)
  gridIn:        0,   // Grid import (positive = importing)
  gridOut:    760,    // Grid export (positive = exporting)
  computeLoad: 3700,  // Compute cluster pull
  // Today's revenue ($)
  revToday: {
    arbitrage: 4280,
    ancillary: 1840,
    capacity:  640,
    total:     6760,
    target:    8200,   // daily revenue target
  },
  // Active dispatch interval
  dispatch: {
    action:   'DISCHARGE BESS',
    reason:   'Arbitrage spread $187/MWh',
    intervalMin: 5,            // ancillary settlement interval
    intervalSecLeft: 142,
    confidence: 0.94,          // policy confidence
    bessSocPct: 73,
  },
  // Active market products (FERC-compliant)
  markets: [
    { id: 'CAISO-DA',    name: 'CAISO Day-Ahead',    product: 'Energy',     status: 'CLEARED', mwh: 8.2,  $: 187,  next: '12:00' },
    { id: 'CAISO-RT',    name: 'CAISO Real-Time',    product: 'Energy',     status: 'CLEARED', mwh: 1.4,  $: 213,  next: 'NOW' },
    { id: 'CAISO-AS-RR', name: 'Reg Up',             product: 'Ancillary',  status: 'CLEARED', mwh: 2.0,  $: 18,   next: '14:30' },
    { id: 'CAISO-AS-SR', name: 'Spinning Reserve',   product: 'Ancillary',  status: 'PENDING', mwh: 1.5,  $: null, next: '15:00' },
    { id: 'RA',          name: 'Resource Adequacy',  product: 'Capacity',   status: 'ACTIVE',  mwh: null, $: 640,  next: 'EOD' },
  ],
  // Next 60-min forecast (5-min intervals = 12 points)
  // [pvForecastKw, priceUsdPerMwh, plannedBessKw (+ = discharge)]
  forecast: [
    [2840, 187,  1620],
    [2880, 192,  1700],
    [2900, 198,  1750],
    [2920, 203,  1800],
    [2940, 211,  1850],
    [2950, 218,  1900],
    [2940, 224,  1950],
    [2920, 229,  1900],
    [2890, 226,  1820],
    [2840, 218,  1700],
    [2780, 205,  1500],
    [2700, 188,  1200],
  ],
  forecastNote: 'Peak price window 13:25–13:55 · BESS holds discharge',
  // Active warnings (surface 1 inline; count for badge)
  warnings: [
    { code: 'AS-2208', text: 'Spinning Reserve bid pending — 8m past target submit',
      sev: 'warn', anchor: 'ed-markets' },
  ],
};
const TOTAL_PV_CAP_KW = 4500;       // PV nameplate
const TOTAL_GRID_LIMIT_KW = 2000;   // Interconnect limit

// ─── Section header / panel — match Compute Detail conventions ───
function EDSectionHead({ t, title, meta, anchorId }) {
  return (
    <div id={anchorId} style={{
      margin: `${SPACE[4]}px ${SPACE[4]}px ${SPACE[2]}px`,
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8,
      scrollMarginTop: 8,
    }}>
      <div style={{
        fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700,
        letterSpacing: 0.2, color: t.textMid, textTransform: 'uppercase',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        flexShrink: 1, minWidth: 0,
      }}>{title}</div>
      {meta && (
        <div style={{
          fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft,
          letterSpacing: 0.1, textTransform: 'uppercase',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>{meta}</div>
      )}
    </div>
  );
}
function EDPanel({ t, children, accent }) {
  return (
    <div style={{
      margin: `0 ${SPACE[4]}px`,
      background: t.surface, border: `1px solid ${t.border}`, borderRadius: RADIUS[3],
      borderLeft: accent ? `3px solid ${accent}` : `1px solid ${t.border}`,
    }}>{children}</div>
  );
}

// ─── Energy flow diagram — vertical Sankey (sources top, sinks bottom) ───
//
// Why vertical: at 380px wide, a horizontal Sankey forces 4 nodes into one
// row of ~80px each — no room for stream widths to read as proportional.
// Vertical lets streams use the full screen width and bend cleanly.
//
// Layer 1 (top, sources):   PV (2840),  BESS (1620 discharging)
// Layer 2 (bottom, sinks):  COMPUTE (3700),  GRID (760 export)
//
// Stream split, ordered L→R on each layer so streams don't cross:
//   PV→Compute: 2080  (left band of PV → left band of Compute)
//   PV→Grid:     760  (right band of PV → all of Grid)
//   BESS→Compute: 1620 (all of BESS → right band of Compute)
//
// Each source/sink is a vertical bar; stream width at each end matches
// the kW magnitude. Stream paths are cubic Béziers between the band edges.

function EnergyFlowDiagram({ t }) {
  const W = 340, H = 196;
  const padX = 16, padY = 12;
  const barH = 26;
  const labelH = 16;
  const valH = 16;
  const topBarY = padY + labelH;
  const botBarY = H - padY - valH - barH;
  const flowTop = topBarY + barH;
  const flowBot = botBarY;

  // Layer ordering chosen to avoid stream crossings:
  //   Sources (top, L→R):  PV, BESS
  //   Sinks   (bot, L→R):  GRID, COMPUTE
  // Resulting streams:
  //   PV → Grid     (left side)
  //   PV → Compute  (right side, slight diagonal — biggest stream)
  //   BESS → Compute (right side)
  // No crossings.

  const total = ENERGY.pv + ENERGY.bessOut;   // == compute + grid at this snapshot
  const trackW = W - 2 * padX;
  const gapBetweenNodes = 20;
  const pxPerKw = (trackW - gapBetweenNodes) / total;

  // Source bars
  const pvW   = ENERGY.pv * pxPerKw;
  const bessW = ENERGY.bessOut * pxPerKw;
  const pvX   = padX;
  const bessX = padX + pvW + gapBetweenNodes;

  // Sink bars (GRID left, COMPUTE right)
  const gridW    = ENERGY.gridOut * pxPerKw;
  const computeW = ENERGY.computeLoad * pxPerKw;
  const gridX    = padX;
  const computeX = padX + gridW + gapBetweenNodes;

  // Stream magnitudes
  const pvToGrid     = ENERGY.gridOut;        // 760
  const pvToCompute  = ENERGY.pv - pvToGrid;  // 2080
  const bessToCompute = ENERGY.bessOut;       // 1620

  // Bands. PV bottom edge: [0, pvToGrid] → Grid, [pvToGrid, pv] → Compute (left part).
  // BESS bottom edge: all → Compute (right part).
  // GRID top edge: all from PV.
  // COMPUTE top edge: [0, pvToCompute] from PV, [pvToCompute, total-grid] from BESS.
  const bands = [
    {
      key: 'pv-grid',
      color: t.colorPv,
      val: pvToGrid,
      x0Left:  pvX,
      x0Right: pvX + pvToGrid * pxPerKw,
      x1Left:  gridX,
      x1Right: gridX + gridW,
    },
    {
      key: 'pv-compute',
      color: t.colorPv,
      val: pvToCompute,
      x0Left:  pvX + pvToGrid * pxPerKw,
      x0Right: pvX + pvW,
      x1Left:  computeX,
      x1Right: computeX + pvToCompute * pxPerKw,
    },
    {
      key: 'bess-compute',
      color: t.colorBess,
      val: bessToCompute,
      x0Left:  bessX,
      x0Right: bessX + bessW,
      x1Left:  computeX + pvToCompute * pxPerKw,
      x1Right: computeX + computeW,
    },
  ];

  const ribbon = (b) => {
    const cy = (flowTop + flowBot) / 2;
    return `
      M ${b.x0Left}  ${flowTop}
      C ${b.x0Left}  ${cy}, ${b.x1Left}  ${cy}, ${b.x1Left}  ${flowBot}
      L ${b.x1Right} ${flowBot}
      C ${b.x1Right} ${cy}, ${b.x0Right} ${cy}, ${b.x0Right} ${flowTop}
      Z
    `.trim();
  };

  // Sinks now: GRID (left) + COMPUTE (right)
  const nodes = [
    { kind: 'src',  label: 'PV',      sub: 'GEN',    val: ENERGY.pv,          color: t.colorPv,      x: pvX,      w: pvW },
    { kind: 'src',  label: 'BESS',    sub: 'DISCH',  val: ENERGY.bessOut,     color: t.colorBess,    x: bessX,    w: bessW },
    { kind: 'sink', label: 'GRID',    sub: 'EXPORT', val: ENERGY.gridOut,     color: t.colorGrid,    x: gridX,    w: gridW },
    { kind: 'sink', label: 'COMPUTE', sub: 'LOAD',   val: ENERGY.computeLoad, color: t.colorCompute, x: computeX, w: computeW },
  ];

  // Decide stream label placement — prefer the wider end for legibility.
  // If neither end fits a label (< 28px), drop it.
  const streamLabel = (b) => {
    const topW = b.x0Right - b.x0Left;
    const botW = b.x1Right - b.x1Left;
    const useTop = topW >= botW;
    const w = Math.max(topW, botW);
    if (w < 28) return null;
    const cx = useTop ? (b.x0Left + b.x0Right) / 2 : (b.x1Left + b.x1Right) / 2;
    const y  = useTop ? (flowTop + 14) : (flowBot - 6);
    return { cx, y };
  };

  // Pick a contrasting "ink" color for text drawn on top of colored bars.
  const onColorInk = t.bg === '#f5f0e8' ? '#1a140a' : '#fff';

  return (
    <div style={{ padding: `${SPACE[3]}px ${SPACE[2]}px ${SPACE[2]}px` }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        {/* Streams */}
        {bands.map(b => (
          <path key={b.key} d={ribbon(b)} fill={b.color} fillOpacity={0.55}
                stroke={b.color} strokeWidth={1} strokeOpacity={0.75}/>
        ))}

        {/* Source/sink bars */}
        {nodes.map((n, i) => {
          const y = n.kind === 'src' ? topBarY : botBarY;
          // Decide whether label fits centered above/below — if bar is too narrow,
          // anchor label to the outer side.
          const labelOuter = n.w < 70;
          return (
            <g key={i}>
              {n.kind === 'src' && (
                <g>
                  {/* If bar wide enough, label + sub on same line; otherwise stack vertically */}
                  {n.w >= 70 ? (
                    <g>
                      <text x={n.x} y={y - 5} fontFamily={t.fontLabel} fontSize="10"
                            fontWeight="700" letterSpacing="0.2" fill={t.text}>{n.label}</text>
                      <text x={n.x + n.w} y={y - 5} textAnchor="end" fontFamily={t.fontLabel}
                            fontSize="8" fontWeight="600" letterSpacing="0.18"
                            fill={n.color}>{n.sub}</text>
                    </g>
                  ) : (
                    <g>
                      <text x={n.x + n.w / 2} y={y - 5} textAnchor="middle"
                            fontFamily={t.fontLabel} fontSize="10"
                            fontWeight="700" letterSpacing="0.2" fill={t.text}>
                        {n.label} <tspan fill={n.color} fontSize="7.5" letterSpacing="0.15">{n.sub}</tspan>
                      </text>
                    </g>
                  )}
                </g>
              )}
              <rect x={n.x} y={y} width={n.w} height={barH} rx={2}
                    fill={n.color} stroke={n.color} strokeWidth={1}/>
              {/* Big value text inside bar, only if bar is wide enough */}
              {n.w >= 40 && (
                <text x={n.x + n.w / 2} y={y + barH / 2 + 5} textAnchor="middle"
                      fontFamily={t.fontLabel} fontSize="13" fontWeight="700"
                      letterSpacing="-0.1" fill={onColorInk}>
                  {Math.abs(n.val).toLocaleString()}
                </text>
              )}
              {/* Narrow bars: render value next to the bar instead of inside */}
              {n.w < 40 && n.kind === 'sink' && (
                <text x={n.x + n.w + 4} y={y + barH / 2 + 4}
                      fontFamily={t.fontLabel} fontSize="11" fontWeight="700"
                      letterSpacing="-0.1" fill={n.color}>
                  {Math.abs(n.val).toLocaleString()}
                </text>
              )}
              {n.kind === 'sink' && (
                <g>
                  {n.w >= 70 ? (
                    <g>
                      <text x={n.x} y={y + barH + 13} fontFamily={t.fontLabel} fontSize="10"
                            fontWeight="700" letterSpacing="0.2" fill={t.text}>{n.label}</text>
                      <text x={n.x + n.w} y={y + barH + 13} textAnchor="end" fontFamily={t.fontLabel}
                            fontSize="8" fontWeight="600" letterSpacing="0.18"
                            fill={n.color}>{n.sub}</text>
                    </g>
                  ) : (
                    <text x={n.x + n.w / 2} y={y + barH + 13} textAnchor="middle"
                          fontFamily={t.fontLabel} fontSize="10"
                          fontWeight="700" letterSpacing="0.2" fill={t.text}>
                      {n.label} <tspan fill={n.color} fontSize="7.5" letterSpacing="0.15">{n.sub}</tspan>
                    </text>
                  )}
                </g>
              )}
            </g>
          );
        })}

        {/* Stream labels at the wide end */}
        {bands.map(b => {
          const sl = streamLabel(b);
          if (!sl) return null;
          return (
            <text key={`l-${b.key}`} x={sl.cx} y={sl.y} textAnchor="middle"
                  fontFamily={t.fontLabel} fontSize="9" fontWeight="700"
                  letterSpacing="0.15" fill={onColorInk}>
              {b.val.toLocaleString()} kW
            </text>
          );
        })}

        {/* Caption */}
        <text x={padX} y={H - 2} fontFamily={t.fontLabel} fontSize="7.5"
              fill={t.textSoft} letterSpacing="0.18">
          NOW · {Math.round(total).toLocaleString()} kW THROUGHPUT
        </text>
      </svg>
    </div>
  );
}


// ─── Money strip — today's revenue split ─────────────────────────────────
function MoneyStrip({ t }) {
  const r = ENERGY.revToday;
  const pct = Math.round((r.total / r.target) * 100);
  const seg = (val, color) => (val / r.total) * 100;
  return (
    <div style={{
      margin: `${SPACE[2]}px ${SPACE[4]}px 0`,
      padding: `${SPACE[3]}px ${SPACE[3]}px`,
      background: t.surface, border: `1px solid ${t.border}`, borderRadius: RADIUS[3],
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                    marginBottom: 6 }}>
        <div style={{ fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.2,
                      color: t.textSoft, fontWeight: 600, textTransform: 'uppercase' }}>
          REVENUE TODAY
        </div>
        <div style={{ fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.15,
                      color: t.textSoft, textTransform: 'uppercase' }}>
          target ${(r.target/1000).toFixed(1)}k · <span style={{ color: pct >= 100 ? t.statusOk : t.text, fontWeight: 700 }}>{pct}%</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
        <span style={{ fontFamily: t.fontLabel, fontSize: 26, fontWeight: 500,
                       color: t.colorRevenue, letterSpacing: -0.5, lineHeight: 1 }}>
          ${r.total.toLocaleString()}
        </span>
        <span style={{ fontFamily: t.fontLabel, fontSize: 10, color: t.textMid }}>USD</span>
      </div>
      {/* Stacked bar */}
      <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden',
                    background: t.borderSoft, marginBottom: 8 }}>
        <div style={{ width: `${seg(r.arbitrage)}%`, background: t.colorPv }}/>
        <div style={{ width: `${seg(r.ancillary)}%`, background: t.colorBess }}/>
        <div style={{ width: `${seg(r.capacity)}%`,  background: t.colorGrid }}/>
      </div>
      {/* Legend */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        <RevSegment t={t} color={t.colorPv}    label="ARBITRAGE" val={r.arbitrage}/>
        <RevSegment t={t} color={t.colorBess}  label="ANCILLARY" val={r.ancillary}/>
        <RevSegment t={t} color={t.colorGrid}  label="CAPACITY"  val={r.capacity}/>
      </div>
    </div>
  );
}
function RevSegment({ t, color, label, val }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 8, height: 8, background: color, borderRadius: 1 }}/>
        <span style={{ fontFamily: t.fontLabel, fontSize: 8, color: t.textSoft,
                       letterSpacing: 0.18, fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ fontFamily: t.fontLabel, fontSize: 12, fontWeight: 700,
                    color: t.text, letterSpacing: -0.1 }}>${val.toLocaleString()}</div>
    </div>
  );
}

// ─── Active dispatch interval — what the policy is doing right now ───
function ActiveDispatchPanel({ t }) {
  const d = ENERGY.dispatch;
  const mins = Math.floor(d.intervalSecLeft / 60);
  const secs = String(d.intervalSecLeft % 60).padStart(2, '0');
  return (
    <EDPanel t={t} accent={t.colorBess}>
      <div style={{ padding: `${SPACE[3]}px`, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Row 1: status chip + interval timer (right-aligned) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Status chip — read-only state of the autopilot policy.
              Dispatch overrides happen at the desk console; phone is monitor-only. */}
          <div style={{
            padding: '4px 8px', borderRadius: 2,
            background: t.colorBess + '14',
            display: 'inline-flex', alignItems: 'baseline', gap: 5,
            fontFamily: t.fontLabel, letterSpacing: 0.2,
            textTransform: 'uppercase', whiteSpace: 'nowrap',
          }}>
            <span style={{
              fontSize: 7.5, fontWeight: 800, letterSpacing: 0.3,
              color: t.colorBess, opacity: 0.7,
            }}>AUTO</span>
            <span style={{
              fontSize: 10, fontWeight: 700, color: t.colorBess,
            }}>{d.action}</span>
          </div>
          <div style={{ marginLeft: 'auto', fontFamily: t.fontLabel, fontSize: 9,
                        letterSpacing: 0.15, color: t.textMid, fontWeight: 600,
                        whiteSpace: 'nowrap' }}>
            settles <span style={{ color: t.text, fontWeight: 700 }}>{mins}:{secs}</span>
          </div>
        </div>
        {/* Row 2: reason — full width, can wrap */}
        <div style={{ fontFamily: t.fontLabel, fontSize: 11, color: t.text,
                      fontWeight: 600, lineHeight: 1.35 }}>
          {d.reason}
        </div>
        {/* Row 3: KV strip + WHY link */}
        <div style={{ display: 'flex', gap: 14, paddingTop: 6,
                      borderTop: `1px solid ${t.borderSoft}`,
                      fontFamily: t.fontLabel, fontSize: 10 }}>
          <KV t={t} l="BESS SOC" v={`${d.bessSocPct}%`} c={t.colorBess}/>
          <KV t={t} l="POLICY CONF" v={`${(d.confidence*100).toFixed(0)}%`} c={t.text}/>
          <button onClick={(e) => {
            let el = e.currentTarget, scroller = null;
            while (el && el !== document.body) {
              const cs = getComputedStyle(el);
              if (cs.overflowY === 'auto' || cs.overflowY === 'scroll') { scroller = el; break; }
              el = el.parentElement;
            }
            const target = scroller ? scroller.querySelector('#ed-markets') : document.getElementById('ed-markets');
            if (target && scroller) scroller.scrollTo({ top: target.offsetTop - 8, behavior: 'smooth' });
          }} style={{
            marginLeft: 'auto',
            background: 'transparent', border: `1px solid ${t.accent}66`,
            borderRadius: RADIUS[2], padding: '3px 8px',
            fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700, letterSpacing: 0.2,
            color: t.accent, textTransform: 'uppercase', cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}>WHY ›</button>
        </div>
      </div>
    </EDPanel>
  );
}
function KV({ t, l, v, c }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <span style={{ fontFamily: t.fontLabel, fontSize: 8, color: t.textSoft,
                     letterSpacing: 0.18, fontWeight: 600, textTransform: 'uppercase' }}>{l}</span>
      <span style={{ fontFamily: t.fontLabel, fontSize: 11, fontWeight: 700, color: c }}>{v}</span>
    </div>
  );
}

// ─── Next-60-min forecast — small 12-point trace ─────────────────────────
function ForecastTrace({ t }) {
  const W = 320, H = 88, padL = 28, padR = 8, padT = 8, padB = 18;
  const data = ENERGY.forecast;
  const pvMax = Math.max(...data.map(d => d[0])) * 1.1;
  const priceMax = Math.max(...data.map(d => d[1])) * 1.1;
  const bessMax = Math.max(...data.map(d => Math.abs(d[2]))) * 1.1;
  const xAt = (i) => padL + (i / (data.length - 1)) * (W - padL - padR);
  const yPv     = (v) => H - padB - (v / pvMax)    * (H - padT - padB);
  const yPrice  = (v) => H - padB - (v / priceMax) * (H - padT - padB);
  const yBess   = (v) => H - padB - (Math.abs(v) / bessMax) * (H - padT - padB);
  const path = (data, fn) => data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${fn(d)}`).join(' ');
  return (
    <div style={{ padding: `${SPACE[3]}px ${SPACE[2]}px ${SPACE[2]}px` }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        {/* Y-axis ticks (price) */}
        <text x={4} y={padT + 6} fontFamily={t.fontLabel} fontSize="7" fill={t.textSoft}
              letterSpacing="0.15">${Math.round(priceMax)}</text>
        <text x={4} y={H - padB} fontFamily={t.fontLabel} fontSize="7" fill={t.textSoft}
              letterSpacing="0.15">$0</text>
        {/* Price line (the lever — peak window highlighted) */}
        <path d={path(data, d => yPrice(d[1]))} fill="none" stroke={t.colorPv}
              strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.85}/>
        {/* PV forecast (dashed — it's a prediction) */}
        <path d={path(data, d => yPv(d[0]))} fill="none" stroke={t.colorCompute}
              strokeWidth={1.5} strokeDasharray="3 2" opacity={0.7}/>
        {/* Planned BESS dispatch (filled area, positive only) */}
        <path d={`${path(data, d => yBess(d[2]))} L ${xAt(data.length-1)} ${H - padB} L ${xAt(0)} ${H - padB} Z`}
              fill={t.colorBess} fillOpacity={0.18} stroke={t.colorBess} strokeWidth={1.2}/>
        {/* NOW marker at index 0 */}
        <line x1={xAt(0)} y1={padT} x2={xAt(0)} y2={H - padB}
              stroke={t.text} strokeWidth={1} opacity={0.4}/>
        <text x={xAt(0) + 3} y={padT + 7} fontFamily={t.fontLabel} fontSize="7"
              fontWeight="700" letterSpacing="0.2" fill={t.text}>NOW</text>
        {/* X-axis labels */}
        <text x={xAt(0)} y={H - 4} fontFamily={t.fontLabel} fontSize="7"
              fill={t.textSoft} letterSpacing="0.15">+0</text>
        <text x={xAt(6)} y={H - 4} textAnchor="middle" fontFamily={t.fontLabel}
              fontSize="7" fill={t.textSoft} letterSpacing="0.15">+30 MIN</text>
        <text x={xAt(11)} y={H - 4} textAnchor="end" fontFamily={t.fontLabel}
              fontSize="7" fill={t.textSoft} letterSpacing="0.15">+60</text>
      </svg>
      {/* Legend + note */}
      <div style={{ display: 'flex', gap: 10, padding: '4px 6px 0',
                    fontFamily: t.fontLabel, fontSize: 8, color: t.textSoft,
                    letterSpacing: 0.15, textTransform: 'uppercase', flexWrap: 'wrap' }}>
        <Legend t={t} c={t.colorPv} l="$/MWh"/>
        <Legend t={t} c={t.colorCompute} l="PV kW" dashed/>
        <Legend t={t} c={t.colorBess} l="BESS plan" filled/>
      </div>
      <div style={{ padding: '6px 6px 0', fontFamily: t.fontBody, fontSize: 10.5,
                    color: t.textMid, lineHeight: 1.35 }}>
        {ENERGY.forecastNote}
      </div>
    </div>
  );
}
function Legend({ t, c, l, dashed, filled }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{
        width: 14, height: dashed ? 1 : (filled ? 6 : 2),
        background: filled ? c + '88' : 'transparent',
        borderTop: dashed ? `1.5px dashed ${c}` : (filled ? 'none' : `2px solid ${c}`),
      }}/>
      {l}
    </span>
  );
}

// ─── Markets list — one row per active product ────────────────────────────
function MarketsList({ t }) {
  const statusColor = (s) =>
    s === 'CLEARED' ? t.statusOk :
    s === 'PENDING' ? t.statusWarn :
    s === 'ACTIVE'  ? t.colorBess :
    s === 'MISSED'  ? t.statusAlarm : t.textMid;
  return (
    <EDPanel t={t}>
      {ENERGY.markets.map((m, i) => (
        <div key={m.id} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: `${SPACE[3]}px ${SPACE[3]}px`,
          borderTop: i === 0 ? 'none' : `1px solid ${t.borderSoft}`,
        }}>
          {/* Status pill */}
          <div style={{
            padding: '2px 6px', borderRadius: RADIUS[1],
            background: statusColor(m.status) + '22',
            border: `1px solid ${statusColor(m.status)}55`,
            fontFamily: t.fontLabel, fontSize: 8, fontWeight: 700,
            letterSpacing: 0.2, color: statusColor(m.status),
            flexShrink: 0, minWidth: 50, textAlign: 'center',
          }}>{m.status}</div>
          {/* Name + product */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: t.fontLabel, fontSize: 11, fontWeight: 700, color: t.text,
              letterSpacing: 0.1,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{m.name}</div>
            <div style={{
              fontFamily: t.fontLabel, fontSize: 8.5, color: t.textSoft,
              letterSpacing: 0.18, fontWeight: 600, textTransform: 'uppercase', marginTop: 1,
            }}>{m.product} {m.mwh != null && `· ${m.mwh} MWh`}</div>
          </div>
          {/* Revenue + countdown */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: t.fontLabel, fontSize: 11, fontWeight: 700,
                          color: m.$ != null ? t.colorRevenue : t.textSoft, letterSpacing: -0.1 }}>
              {m.$ != null ? `$${m.$.toLocaleString()}` : '—'}
            </div>
            <div style={{ fontFamily: t.fontLabel, fontSize: 8.5, color: t.textSoft,
                          letterSpacing: 0.15, fontWeight: 600, marginTop: 1 }}>
              next {m.next}
            </div>
          </div>
        </div>
      ))}
    </EDPanel>
  );
}

// ─── Top-level screen ─────────────────────────────────────────────────────
function EnergyDetailScreen({ t }) {
  // Scroll-to-section helper. Walks up from the click target to find the
  // phone's scroll container (data-phone-scroll), then smooth-scrolls to the
  // anchored section.
  const scrollTo = (anchorId) => (e) => {
    let el = e.currentTarget;
    while (el && el !== document.body && !el.matches('[data-phone-scroll]')) {
      el = el.parentElement;
    }
    const target = el && el.querySelector(`#${anchorId}`);
    if (target && el) el.scrollTo({ top: target.offsetTop - 8, behavior: 'smooth' });
  };

  const w = ENERGY.warnings[0];

  return (
    <div data-phone-scroll style={{ padding: `0 0 ${SPACE[5]}px`, position: 'relative' }}>
      {/* Header strip — title + Live freshness (matches Compute Detail) */}
      <div style={{
        margin: `${SPACE[3]}px ${SPACE[4]}px ${SPACE[2]}px`,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: t.fontHeading, fontSize: 22, fontWeight: 500,
                        color: t.text, letterSpacing: t.fontHeading.includes('Cormorant') ? 0 : 0.5,
                        lineHeight: 1, marginBottom: 2 }}>
            {t.fontHeading.includes('Cormorant') ? 'Energy' : 'ENERGY'}
          </div>
          <div style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft,
                        letterSpacing: 0.2, textTransform: 'uppercase' }}>
            DISPATCH · MARKETS · 5-MIN SETTLEMENT
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontFamily: t.fontLabel, fontSize: 9, fontWeight: 600,
            letterSpacing: 0.18, color: t.statusOk, textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: t.statusOk,
                           boxShadow: `0 0 0 3px ${t.statusOk}25` }}/>
            Live
          </div>
          <div style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft,
                        letterSpacing: 0.1, marginTop: 2, whiteSpace: 'nowrap' }}>1s ago</div>
        </div>
      </div>

      {/* Inline warning strip — surfaces the actual warn instead of a floating count */}
      {w && (
        <button onClick={scrollTo(w.anchor)} style={{
          margin: `0 ${SPACE[4]}px ${SPACE[2]}px`,
          width: `calc(100% - ${SPACE[4]*2}px)`,
          padding: `6px 10px`,
          display: 'flex', alignItems: 'center', gap: 8,
          background: t.statusWarn + '14', border: `1px solid ${t.statusWarn}55`,
          borderRadius: RADIUS[2],
          textAlign: 'left', cursor: 'pointer',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.statusWarn,
                         boxShadow: `0 0 0 3px ${t.statusWarn}25`, flexShrink: 0 }}/>
          <span style={{ fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700,
                         letterSpacing: 0.2, color: t.statusWarn, textTransform: 'uppercase',
                         flexShrink: 0 }}>
            {w.code}
          </span>
          <span style={{ fontFamily: t.fontLabel, fontSize: 10, color: t.text,
                         flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis',
                         whiteSpace: 'nowrap' }}>
            {w.text}
          </span>
          <span style={{ fontFamily: t.fontLabel, fontSize: 11, color: t.textSoft,
                         flexShrink: 0 }}>›</span>
        </button>
      )}

      {/* Hero: flow diagram + money strip */}
      <EDPanel t={t}><EnergyFlowDiagram t={t}/></EDPanel>
      <MoneyStrip t={t}/>

      {/* Active dispatch */}
      <EDSectionHead t={t} title="Active dispatch" meta="now"/>
      <ActiveDispatchPanel t={t}/>

      {/* Forecast */}
      <EDSectionHead t={t} title="Next 60 min forecast" meta="5-min · planned"/>
      <EDPanel t={t}><ForecastTrace t={t}/></EDPanel>

      {/* Markets */}
      <EDSectionHead t={t} title="Active markets" meta="FERC · CAISO" anchorId="ed-markets"/>
      <MarketsList t={t}/>

      {/* Footer disclosure */}
      <div style={{
        margin: `${SPACE[4]}px ${SPACE[4]}px 0`,
        fontFamily: t.fontLabel, fontSize: 8, color: t.textSoft,
        letterSpacing: 0.15, textTransform: 'uppercase', textAlign: 'center',
      }}>
        Read-only · dispatch overrides require desk console · CAISO OASIS 5-min lag
      </div>
    </div>
  );
}

window.EnergyDetailScreen = EnergyDetailScreen;
Object.assign(window, {
  ENERGY_DATA: ENERGY,
  TOTAL_PV_CAP_KW,
  TOTAL_GRID_LIMIT_KW,
});
