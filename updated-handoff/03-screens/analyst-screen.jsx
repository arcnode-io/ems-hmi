// analyst-screen.jsx — natural-language analyst surface for the EMS HMI.
// Mobile-first. Layout (top-down):
//   1. Header strip — title + Live · 1s ago (matches other detail screens)
//   2. Chart canvas — fills ~55% of screen height. Pinch-zoom + tap-to-read.
//   3. Result caption — "PV vs forecast · today · 5-min interval" (echoes query)
//   4. Chat strip — last user query + assistant status ("generating chart...")
//   5. Suggested prompts — 2 chips above the input
//   6. Input field — sticky at bottom with submit button
//
// Query path:
//   user types → claude.complete(promptWithSchema) → returns JSON {title, xUnit,
//   yUnit, series:[{name, color, data:[[x,y],...]}], note}
//   We render the result. On JSON parse fail, fall back to canned series matched
//   by keyword. This keeps the demo robust if the LLM blips.
//
// The chart renders SVG paths; the pinch handler scales an SVG <g> wrapping the
// data layer, leaving axes untouched.

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ─── Mock time series ─────────────────────────────────────────────────────
// 96 points × 5-min intervals = 8 hours of synthetic data, matching the
// "today" range. All series use the same x-axis (minutes from 06:00).
const NPTS = 96;
const X_LABEL_HOURS = ['06:00', '08:00', '10:00', '12:00', '14:00'];
function tHour(i) { return 6 + (i / NPTS) * 8; } // returns hour-of-day for index

// PV: bell curve peaking ~12:30, max ~2900 kW.
// Actual deviates from forecast mid-day due to cloud cover (~6% under between
// 11:30–12:15) — this is the headline insight in the default chart so the
// dotted forecast line should sit visibly above the solid actual line in
// that window.
function pvActual(i) {
  const peak = NPTS * 0.55;
  const base = 2900 * Math.exp(-Math.pow((i - peak) / (NPTS * 0.32), 2));
  // Cloud cover dip 11:30–12:15 — that's i ≈ 66–75 (NPTS=96, 06:00→14:00, so
  // each i = 5 min from 06:00 → i*5/60 + 6 hours of day). 11:30 → i=66, 12:15 → i=75.
  let cloud = 0;
  if (i >= 60 && i <= 78) {
    const t = (i - 60) / 18;          // 0→1 across the dip
    cloud = -Math.sin(t * Math.PI) * 380; // up to ~380kW shortfall
  }
  // Small ambient noise so the line isn't perfectly smooth
  const noise = Math.sin(i * 0.7) * 22;
  return Math.max(0, base + cloud + noise);
}
function pvForecast(i) {
  const peak = NPTS * 0.55;
  return 2900 * Math.exp(-Math.pow((i - peak) / (NPTS * 0.32), 2));
}
// BESS: charges morning (negative), discharges peak afternoon (positive)
function bessDispatch(i) {
  const h = tHour(i);
  if (h < 9.5) return -700 - Math.sin(i * 0.3) * 80;          // charging
  if (h < 12) return -200 + (i - 42) * 25;                     // ramp down
  if (h < 14.5) return 1500 + Math.sin(i * 0.2) * 100;         // discharge
  return 800 - (i - 90) * 60;                                  // taper
}
function bessSoc(i) {
  // Integrate roughly from 22% start
  let soc = 22;
  for (let k = 0; k <= i; k++) {
    soc += -bessDispatch(k) / 2400 * (5 / 60) * 0.9; // 2400 kW power, 5min, 90% rt eff
    soc = Math.max(8, Math.min(95, soc));
  }
  return soc;
}
function gridFlow(i) {
  // Net grid (+ = export, − = import). Compute load is steady ~3500 kW.
  const compute = 3500 + Math.sin(i * 0.1) * 80;
  return pvActual(i) + Math.max(0, bessDispatch(i)) - compute;
}
function price(i) {
  const h = tHour(i);
  // Off-peak ~$60, peak ~$220 around 13:30
  const peak = 13.5;
  const dist = Math.abs(h - peak);
  return 60 + 160 * Math.exp(-Math.pow(dist / 1.4, 2)) + Math.sin(i * 0.4) * 4;
}
function computeLoad(i) {
  return 3500 + Math.sin(i * 0.1) * 80 + (Math.random() * 30 - 15);
}
function gpuTemp(i) {
  const h = tHour(i);
  return 62 + (h > 11 ? (h - 11) * 1.8 : 0) + Math.sin(i * 0.3) * 1.5;
}
function revenue7d(i) {
  // 7-day cumulative revenue in $K, monotonic
  return (i / NPTS) * 47.6 + Math.sin(i * 0.1) * 0.4;
}

// Available series the analyst can plot. Keys are stable identifiers used in
// canned queries / fallback matching. Each series carries its own color
// (chosen per theme at render time via colorForKey).
const SERIES_DEFS = {
  pv:        { name: 'PV output',          unit: 'kW',     fn: pvActual },
  pvForecast:{ name: 'PV forecast',        unit: 'kW',     fn: pvForecast,   dashed: true },
  bess:      { name: 'BESS dispatch',      unit: 'kW',     fn: bessDispatch },
  bessSoc:   { name: 'BESS SOC',           unit: '%',      fn: bessSoc },
  grid:      { name: 'Grid net export',    unit: 'kW',     fn: gridFlow },
  price:     { name: 'Energy price',       unit: '$/MWh',  fn: price },
  compute:   { name: 'Compute load',       unit: 'kW',     fn: computeLoad },
  gpuTemp:   { name: 'GPU temp avg',       unit: '°C',     fn: gpuTemp },
  revenue:   { name: 'Revenue cumulative', unit: '$K',     fn: revenue7d },
};
function colorForKey(t, key) {
  const map = {
    pv: t.colorPv, pvForecast: t.colorPv,
    bess: t.colorBess, bessSoc: t.colorBess,
    grid: t.colorGrid,
    price: t.colorRevenue,
    compute: t.colorCompute,
    gpuTemp: t.statusWarn,
    revenue: t.colorRevenue,
  };
  return map[key] || t.text;
}

// Build the [{x,y}, ...] data array for a given series key.
function dataFor(key) {
  const def = SERIES_DEFS[key];
  if (!def) return [];
  const arr = [];
  for (let i = 0; i < NPTS; i++) arr.push([i, def.fn(i)]);
  return arr;
}

// Bundle a renderable spec from a list of series keys.
function specFromKeys(keys, title, note) {
  return {
    title,
    note,
    xLabel: 'Time (06:00 → 14:00)',
    series: keys.map(k => ({
      key: k,
      name: SERIES_DEFS[k].name,
      unit: SERIES_DEFS[k].unit,
      dashed: !!SERIES_DEFS[k].dashed,
      data: dataFor(k),
    })),
  };
}

// Canned fallback. Picks series keys based on simple keyword matching.
// Used when the LLM call fails OR for the initial chart on page load.
function fallbackSpec(query) {
  const q = (query || '').toLowerCase();
  const has = (s) => q.includes(s);

  if (has('forecast') || (has('pv') && has('vs')))
    return specFromKeys(['pv', 'pvForecast'], 'PV output vs forecast',
                        'Cloud cover dipped 11:30–12:15. Forecast over by ~6%.');
  if (has('soc') || has('state of charge'))
    return specFromKeys(['bessSoc'], 'BESS state of charge',
                        'SOC bottomed at 18% during peak discharge window.');
  if (has('bess') || has('dispatch') || has('discharge'))
    return specFromKeys(['bess'], 'BESS dispatch (kW)',
                        'Charge AM, discharge through 13:00–14:00 price peak.');
  if (has('price') || has('lmp') || has('$/mwh'))
    return specFromKeys(['price'], 'CAISO real-time energy price',
                        'Peak window 13:25–13:55 cleared at $213/MWh.');
  if (has('grid') || has('export') || has('import'))
    return specFromKeys(['grid'], 'Grid net flow',
                        'Site flips export-positive 12:00–13:30.');
  if (has('compute') || has('load'))
    return specFromKeys(['compute'], 'Compute load (kW)',
                        'Steady ~3.5 MW with mild diurnal trend.');
  if (has('gpu') || has('temp'))
    return specFromKeys(['gpuTemp'], 'GPU temperature average',
                        'Trending up with afternoon ambient — within spec.');
  if (has('revenue') || has('money') || has('$'))
    return specFromKeys(['revenue'], 'Revenue (cumulative)',
                        'Tracking $6.7K today, on pace for $8.2K target.');
  if (has('price') && has('dispatch'))
    return specFromKeys(['price', 'bess'], 'Price vs BESS dispatch',
                        'Dispatch leans into the price curve as expected.');

  // Default: PV vs forecast — the most "first chart you'd open" pick.
  return specFromKeys(['pv', 'pvForecast'], 'PV output vs forecast',
                      'Default view. Try: "show price today" or "BESS SOC".');
}

// Suggested prompts — caveman-approved set. Real queries an operator might run.
const SUGGESTIONS = [
  'PV vs forecast today',
  'BESS dispatch + price',
  'GPU temp average',
];

// ─── Chart ───────────────────────────────────────────────────────────────
// Small responsive line chart. Pinch-zoom on the data layer scales x only
// (operators are usually zooming in on a time window, not stretching y).
function LineChart({ t, spec }) {
  const W = 340, H = 220;
  const padL = 36, padR = 14, padT = 14, padB = 26;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  // Compute combined y-range across all series (so they share an axis).
  // For mixed units, only the FIRST series drives the y-axis labels and
  // we scale others to fit. We keep axis labels honest: only show units
  // that match the first series; other series rendered on a normalized axis.
  const yRanges = spec.series.map(s => {
    const ys = s.data.map(p => p[1]);
    return [Math.min(...ys, 0), Math.max(...ys)];
  });

  // For multi-series with mixed units, normalize each to its own min/max.
  // Single-series: show real units.
  const single = spec.series.length === 1;
  const sameUnit = spec.series.every(s => s.unit === spec.series[0].unit);

  // Y-axis range from first series (or shared if same unit)
  let yMin, yMax;
  if (sameUnit) {
    yMin = Math.min(...yRanges.map(r => r[0]));
    yMax = Math.max(...yRanges.map(r => r[1]));
  } else {
    [yMin, yMax] = yRanges[0];
  }
  // Pad y range a bit
  const yPad = (yMax - yMin) * 0.1 || 1;
  yMin -= yPad; yMax += yPad;

  const xAt = (i) => padL + (i / (NPTS - 1)) * innerW;
  const yAt = (v, sIdx = 0) => {
    if (sameUnit) {
      return padT + innerH - ((v - yMin) / (yMax - yMin)) * innerH;
    }
    // Per-series normalize for mixed units
    const [lo, hi] = yRanges[sIdx];
    const span = hi - lo || 1;
    return padT + innerH - ((v - lo) / span) * innerH * 0.92 - innerH * 0.04;
  };

  // Build path strings
  const paths = spec.series.map((s, sIdx) => ({
    d: s.data.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(p[0])} ${yAt(p[1], sIdx)}`).join(' '),
    color: colorForKey(t, s.key),
    dashed: s.dashed,
    name: s.name,
    unit: s.unit,
  }));

  // Pinch zoom state — wraps the data <g> in a transform.
  const [zoom, setZoom] = useState({ x: 0, k: 1 });
  const svgRef = useRef(null);
  const pinchRef = useRef(null);

  const onTouchStart = (e) => {
    if (e.touches.length !== 2) return;
    const [a, b] = [e.touches[0], e.touches[1]];
    const dist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
    const mid = (a.clientX + b.clientX) / 2;
    pinchRef.current = { startDist: dist, startMid: mid, startZoom: zoom };
    e.preventDefault();
  };
  const onTouchMove = (e) => {
    if (e.touches.length !== 2 || !pinchRef.current) return;
    const [a, b] = [e.touches[0], e.touches[1]];
    const dist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
    const factor = dist / pinchRef.current.startDist;
    const newK = Math.max(1, Math.min(8, pinchRef.current.startZoom.k * factor));
    // Anchor zoom on midpoint
    const rect = svgRef.current.getBoundingClientRect();
    const midRel = (pinchRef.current.startMid - rect.left) / rect.width;
    const cx = midRel * W;
    const newX = cx - (cx - pinchRef.current.startZoom.x) * (newK / pinchRef.current.startZoom.k);
    setZoom({ x: newX, k: newK });
    e.preventDefault();
  };
  const onTouchEnd = () => { pinchRef.current = null; };
  const onDoubleClick = () => setZoom({ x: 0, k: 1 });

  // Tap-to-read: nearest data point to tap x
  const [readout, setReadout] = useState(null);
  const onTap = (e) => {
    if (e.touches && e.touches.length > 1) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    if (clientX == null) return;
    // Convert client x → svg x → data index, accounting for current zoom
    const svgX = ((clientX - rect.left) / rect.width) * W;
    const unzoomedX = (svgX - zoom.x) / zoom.k;
    const dataX = (unzoomedX - padL) / innerW * (NPTS - 1);
    const i = Math.max(0, Math.min(NPTS - 1, Math.round(dataX)));
    setReadout({ i, values: spec.series.map(s => s.data[i][1]) });
  };

  // Y-axis ticks (5)
  const yTicks = sameUnit
    ? [0, 0.25, 0.5, 0.75, 1].map(f => yMin + f * (yMax - yMin))
    : null;

  return (
    <div style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: 'block', touchAction: 'none', userSelect: 'none' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onDoubleClick={onDoubleClick}
        onClick={onTap}
      >
        {/* Plot background */}
        <rect x={padL} y={padT} width={innerW} height={innerH}
              fill={t.bg === '#080808' ? '#0a0a0a' : '#f0eade'} fillOpacity={0.4}/>

        {/* Y grid + labels */}
        {yTicks && yTicks.map((v, i) => (
          <g key={`yt-${i}`}>
            <line x1={padL} x2={W - padR} y1={yAt(v)} y2={yAt(v)}
                  stroke={t.chartGrid} strokeWidth={1}/>
            <text x={padL - 4} y={yAt(v) + 3} textAnchor="end"
                  fontFamily={t.fontLabel} fontSize="8" fill={t.textSoft}
                  letterSpacing="0.1">
              {Math.abs(v) >= 1000 ? (v / 1000).toFixed(1) + 'k' : Math.round(v)}
            </text>
          </g>
        ))}
        {/* If mixed units, show first-series label only */}
        {!yTicks && (
          <text x={padL - 4} y={padT + 8} textAnchor="end"
                fontFamily={t.fontLabel} fontSize="8" fill={t.textSoft}>
            {spec.series[0].unit}
          </text>
        )}

        {/* X axis ticks (hours) */}
        {X_LABEL_HOURS.map((lbl, i) => {
          const x = padL + (i / (X_LABEL_HOURS.length - 1)) * innerW;
          return (
            <g key={`xt-${i}`}>
              <line x1={x} x2={x} y1={padT + innerH} y2={padT + innerH + 3}
                    stroke={t.textFaint} strokeWidth={1}/>
              <text x={x} y={padT + innerH + 14} textAnchor="middle"
                    fontFamily={t.fontLabel} fontSize="8" fill={t.textSoft}
                    letterSpacing="0.1">{lbl}</text>
            </g>
          );
        })}

        {/* Zero line if y-range crosses zero */}
        {sameUnit && yMin < 0 && yMax > 0 && (
          <line x1={padL} x2={W - padR} y1={yAt(0)} y2={yAt(0)}
                stroke={t.text} strokeWidth={0.5} opacity={0.3} strokeDasharray="2 2"/>
        )}

        {/* Data layer (zoomable) */}
        <g transform={`translate(${zoom.x},0) scale(${zoom.k},1)`}>
          {paths.map((p, i) => (
            <path key={i} d={p.d} fill="none" stroke={p.color}
                  strokeWidth={2 / zoom.k} strokeLinecap="round" strokeLinejoin="round"
                  strokeDasharray={p.dashed ? `${4/zoom.k} ${3/zoom.k}` : ''}
                  opacity={p.dashed ? 0.7 : 1}
                  vectorEffect="non-scaling-stroke"/>
          ))}
          {/* Readout marker */}
          {readout && spec.series.map((s, sIdx) => (
            <circle key={`r-${sIdx}`}
                    cx={xAt(readout.i)} cy={yAt(readout.values[sIdx], sIdx)}
                    r={3 / zoom.k} fill={colorForKey(t, s.key)}
                    stroke={t.bg} strokeWidth={1.5 / zoom.k}
                    vectorEffect="non-scaling-stroke"/>
          ))}
        </g>

        {/* Plot border */}
        <rect x={padL} y={padT} width={innerW} height={innerH}
              fill="none" stroke={t.borderSoft} strokeWidth={1}/>
      </svg>

      {/* Readout overlay */}
      {readout && (
        <div style={{
          position: 'absolute', top: 6, right: 8,
          padding: '4px 8px', background: t.surface, border: `1px solid ${t.border}`,
          borderRadius: RADIUS[2],
          fontFamily: t.fontLabel, fontSize: 9, color: t.text,
          letterSpacing: 0.1,
        }}>
          <div style={{ color: t.textSoft, fontSize: 8, textTransform: 'uppercase',
                        letterSpacing: 0.2, marginBottom: 1 }}>
            {(() => {
              const h = tHour(readout.i);
              const hh = String(Math.floor(h)).padStart(2, '0');
              const mm = String(Math.floor((h % 1) * 60)).padStart(2, '0');
              return `${hh}:${mm}`;
            })()}
          </div>
          {spec.series.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5,
                                  marginTop: 1 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%',
                             background: colorForKey(t, s.key) }}/>
              <span style={{ fontWeight: 700 }}>
                {Math.round(readout.values[i]).toLocaleString()}
              </span>
              <span style={{ color: t.textSoft }}>{s.unit}</span>
            </div>
          ))}
        </div>
      )}

      {/* Pinch hint — only when at default zoom and no tap yet.
          Positioned ABOVE the x-axis tick labels so it doesn't overlap.
          (The svg padB region holds the tick labels; we sit just inside the
          plot area at the bottom-right.) */}
      {zoom.k === 1 && !readout && (
        <div style={{
          position: 'absolute',
          // top: anchor relative to plot area bottom (padT + innerH).
          // SVG is 100% width but native height; use percentage instead.
          top: `${((padT + innerH - 12) / H) * 100}%`,
          right: 8,
          fontFamily: t.fontLabel, fontSize: 7.5, color: t.textSoft,
          letterSpacing: 0.18, textTransform: 'uppercase', opacity: 0.6,
          pointerEvents: 'none',
        }}>
          Pinch · tap to read
        </div>
      )}
    </div>
  );
}

// ─── Mobile inline analyst — chat + artifacts in one vertical stream ─────
// Inline-stream model: chat messages and chart/table artifacts share a single
// scroll, newest at the bottom. Same agent behavior as desktop:
//   • Live tool trace as the agent works
//   • Three response types: chart, table, chat-only
//   • Rotating prompt placeholder + rotating intelligence-feed headline strip
//   • CSV export per artifact, × dismiss

const ANALYST_HEADLINES = [
  { src: 'Permutable',  cat: 'Geopolitical',
    text: 'Strait of Hormuz now uses Bitcoin for toll' },
  { src: 'OpenWeather', cat: 'Weather',
    text: 'ERCOT heat dome · 104°F peak Sat' },
  { src: 'YES Energy',  cat: 'Markets',
    text: 'ERCOT LMP $312 · scarcity pricing' },
];

const ANALYST_PROMPTS = [
  'BESS hit 92% SoC at 10:14 — explain why?',
  'Compute curtailed for 18 min at 11:30 — show me',
  'Why did LMP spike to $312 at 13:05?',
  'PV is 6% under forecast — is the heat dome the cause?',
  'Strait of Hormuz news — effect on tomorrow\'s LMP?',
];

const nowMobile = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
};
let __mid = 0;
const newId = (p) => `${p}-${++__mid}`;

function ToolTraceMobile({ t, steps }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4,
                  fontFamily: t.fontLabel, fontSize: 10.5, color: t.textMid }}>
      {steps.map((s, i) => {
        const done = s.status === 'done';
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, display: 'inline-flex',
                            alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {done ? (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"
                     stroke={t.statusOk} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.5 6.5 L5 9 L9.5 3.5"/>
                </svg>
              ) : (
                <span style={{ width: 6, height: 6, borderRadius: '50%',
                                background: t.accent,
                                animation: 'amobblink 0.9s ease-in-out infinite' }}/>
              )}
            </span>
            <span style={{ color: done ? t.textSoft : t.text,
                           fontWeight: done ? 500 : 600, letterSpacing: 0.05 }}>
              {s.tool && (
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.18,
                               textTransform: 'uppercase', color: t.textSoft,
                               marginRight: 5 }}>{s.tool}</span>
              )}
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ChatBubbleMobile({ t, msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      gap: 3, padding: `0 ${SPACE[4]}px`,
    }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontFamily: t.fontLabel, fontSize: 8.5, fontWeight: 700,
        letterSpacing: 0.18, color: t.textSoft, textTransform: 'uppercase',
      }}>
        {!isUser && (
          <span style={{
            width: 14, height: 14, borderRadius: '50%',
            background: t.accent, color: '#fff',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 800,
          }}>A</span>
        )}
        <span>{isUser ? 'You' : 'Analyst'}</span>
        <span style={{ color: t.textFaint || t.textSoft, fontWeight: 500,
                        opacity: 0.8 }}>· {msg.timestamp}</span>
      </div>
      <div style={{
        maxWidth: '88%',
        padding: '7px 11px',
        background: isUser ? t.accent : t.surface,
        color: isUser ? '#fff' : t.text,
        border: isUser ? 'none' : `1px solid ${t.border}`,
        borderRadius: isUser
          ? `${RADIUS[3]}px ${RADIUS[3]}px 4px ${RADIUS[3]}px`
          : `${RADIUS[3]}px ${RADIUS[3]}px ${RADIUS[3]}px 4px`,
        fontFamily: t.fontBody, fontSize: 12.5, lineHeight: 1.45,
      }}>
        {msg.thinking ? <ToolTraceMobile t={t} steps={msg.trace || []}/> : msg.text}
      </div>
    </div>
  );
}

function artBtnMobile(t) {
  return {
    background: 'transparent', border: `1px solid ${t.borderSoft}`,
    color: t.textSoft,
    width: 22, height: 22, borderRadius: RADIUS[1],
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 10, cursor: 'pointer', padding: 0,
  };
}

function ChartArtifactMobile({ t, art, onExport, onDismiss }) {
  return (
    <div style={{ padding: `0 ${SPACE[4]}px` }}>
      <div style={{
        background: t.surface, border: `1px solid ${t.border}`,
        borderRadius: RADIUS[3], overflow: 'hidden',
      }}>
        <div style={{
          padding: `${SPACE[2]}px ${SPACE[3]}px`,
          borderBottom: `1px solid ${t.borderSoft}`,
          display: 'flex', alignItems: 'flex-start', gap: 6,
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 7px', borderRadius: 9999,
            background: t.bg, border: `1px solid ${t.borderSoft}`,
            fontFamily: t.fontLabel, fontSize: 8.5, fontWeight: 700,
            letterSpacing: 0.2, color: t.textSoft, textTransform: 'uppercase',
            flexShrink: 0,
          }}>
            <svg width="8" height="8" viewBox="0 0 16 16" fill="none"
                 stroke="currentColor" strokeWidth="2"><path d="M2 13 L6 8 L9 11 L14 4"/></svg>
            Chart
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: t.fontHeading, fontSize: 14, fontWeight: 500,
              color: t.text, lineHeight: 1.2,
              letterSpacing: t.fontHeading.includes('Cormorant') ? 0 : 0.3,
              textTransform: t.fontHeading.includes('Bebas') ? 'uppercase' : 'none',
            }}>{art.spec.title}</div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => onExport(art)} style={artBtnMobile(t)}>
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none"
                   stroke="currentColor" strokeWidth="1.6"
                   strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 1.5 V8 M3.5 5.5 L6 8 L8.5 5.5 M2 10.5 H10"/>
              </svg>
            </button>
            <button onClick={() => onDismiss(art.id)} style={artBtnMobile(t)}>✕</button>
          </div>
        </div>
        <div style={{ padding: `${SPACE[2]}px ${SPACE[2]}px ${SPACE[3]}px` }}>
          <LineChart t={t} spec={art.spec}/>
        </div>
        {art.spec.series.length > 1 && (
          <div style={{
            padding: `${SPACE[2]}px ${SPACE[3]}px`,
            display: 'flex', flexWrap: 'wrap', gap: 10,
            borderTop: `1px solid ${t.borderSoft}`,
          }}>
            {art.spec.series.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{
                  width: 12, height: s.dashed ? 1 : 2,
                  borderTop: s.dashed
                    ? `1.5px dashed ${colorForKey(t, s.key)}`
                    : `2px solid ${colorForKey(t, s.key)}`,
                }}/>
                <span style={{ fontFamily: t.fontLabel, fontSize: 9,
                                color: t.textMid, letterSpacing: 0.15,
                                textTransform: 'uppercase' }}>{s.name}</span>
              </div>
            ))}
          </div>
        )}
        {art.spec.note && (
          <div style={{
            padding: `${SPACE[2]}px ${SPACE[3]}px`,
            borderTop: `1px solid ${t.borderSoft}`,
            background: t.bg,
            fontFamily: t.fontBody, fontSize: 11, color: t.textMid, lineHeight: 1.4,
          }}>
            <span style={{ fontFamily: t.fontLabel, fontSize: 8.5,
                            letterSpacing: 0.18, textTransform: 'uppercase',
                            fontWeight: 700, color: t.textSoft, marginRight: 5 }}>Insight</span>
            {art.spec.note}
          </div>
        )}
      </div>
    </div>
  );
}

function TableArtifactMobile({ t, art, onExport, onDismiss }) {
  const tbl = art.table;
  return (
    <div style={{ padding: `0 ${SPACE[4]}px` }}>
      <div style={{
        background: t.surface, border: `1px solid ${t.border}`,
        borderRadius: RADIUS[3], overflow: 'hidden',
      }}>
        <div style={{
          padding: `${SPACE[2]}px ${SPACE[3]}px`,
          borderBottom: `1px solid ${t.borderSoft}`,
          display: 'flex', alignItems: 'flex-start', gap: 6,
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 7px', borderRadius: 9999,
            background: t.bg, border: `1px solid ${t.borderSoft}`,
            fontFamily: t.fontLabel, fontSize: 8.5, fontWeight: 700,
            letterSpacing: 0.2, color: t.textSoft, textTransform: 'uppercase',
            flexShrink: 0,
          }}>
            <svg width="8" height="8" viewBox="0 0 16 16" fill="none"
                 stroke="currentColor" strokeWidth="1.6">
              <rect x="2" y="3" width="12" height="10" rx="1"/>
              <path d="M2 7 H14 M6 3 V13 M10 3 V13"/>
            </svg>
            Table
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: t.fontHeading, fontSize: 14, fontWeight: 500,
              color: t.text, lineHeight: 1.2,
              letterSpacing: t.fontHeading.includes('Cormorant') ? 0 : 0.3,
              textTransform: t.fontHeading.includes('Bebas') ? 'uppercase' : 'none',
            }}>{tbl.title}</div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => onExport(art)} style={artBtnMobile(t)}>
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none"
                   stroke="currentColor" strokeWidth="1.6"
                   strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 1.5 V8 M3.5 5.5 L6 8 L8.5 5.5 M2 10.5 H10"/>
              </svg>
            </button>
            <button onClick={() => onDismiss(art.id)} style={artBtnMobile(t)}>✕</button>
          </div>
        </div>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{
            borderCollapse: 'collapse', width: '100%',
            fontFamily: t.fontLabel, fontSize: 11,
          }}>
            <thead>
              <tr style={{ background: t.bg }}>
                {tbl.headers.map((h, i) => (
                  <th key={i} style={{
                    textAlign: 'left', padding: '6px 9px',
                    fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700,
                    letterSpacing: 0.18, color: t.textMid, textTransform: 'uppercase',
                    borderBottom: `1px solid ${t.borderSoft}`, whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tbl.rows.map((row, ri) => (
                <tr key={ri} style={{ background: ri % 2 ? t.surface : 'transparent' }}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{
                      padding: '6px 9px', color: t.text,
                      fontVariantNumeric: 'tabular-nums',
                      borderBottom: ri < tbl.rows.length - 1
                        ? `1px solid ${t.borderSoft}` : 'none',
                      whiteSpace: 'nowrap',
                    }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tbl.footer && (
          <div style={{
            padding: '6px 10px',
            borderTop: `1px solid ${t.borderSoft}`,
            background: t.bg,
            fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.1,
            color: t.textSoft, textAlign: 'right',
          }}>{tbl.footer}</div>
        )}
      </div>
    </div>
  );
}

function HeadlineStrip({ t }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI(x => (x + 1) % ANALYST_HEADLINES.length), 4500);
    return () => clearInterval(id);
  }, []);
  const h = ANALYST_HEADLINES[i];
  return (
    <div style={{
      margin: `0 ${SPACE[4]}px ${SPACE[2]}px`,
      padding: `6px 10px`,
      background: t.surface, border: `1px solid ${t.borderSoft}`,
      borderRadius: RADIUS[2],
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%',
                      background: t.statusOk,
                      boxShadow: `0 0 0 2px ${t.statusOk}30`, flexShrink: 0 }}/>
      <span style={{
        fontFamily: t.fontLabel, fontSize: 8.5, fontWeight: 700,
        letterSpacing: 0.18, color: t.textSoft, textTransform: 'uppercase',
        flexShrink: 0,
      }}>{h.src} · {h.cat}</span>
      <span style={{
        flex: 1, minWidth: 0, fontFamily: t.fontBody, fontSize: 11,
        color: t.text, fontWeight: 500, lineHeight: 1.25,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{h.text}</span>
    </div>
  );
}

function AnalystScreen({ t }) {
  const [stream, setStream] = useState(() => {
    const chartSpec = fallbackSpec('PV vs forecast today');
    return [
      { kind: 'message', id: newId('msg'), role: 'user', timestamp: '14:02:08',
        text: 'PV vs forecast today' },
      { kind: 'message', id: newId('msg'), role: 'assistant', timestamp: '14:02:12',
        text: 'Plotted PV vs forecast for today, 06:00–14:00. PV peaks at 11:30, running ~6% under forecast at midday — likely the marine layer clearing late.' },
      { kind: 'chart',   id: 'art-1', spec: chartSpec, timestamp: '14:02:12' },
      { kind: 'message', id: newId('msg'), role: 'user', timestamp: '14:04:18',
        text: 'Got it. Now list today\'s alarms and how long each one lasted.' },
      { kind: 'message', id: newId('msg'), role: 'assistant', timestamp: '14:04:31',
        text: 'Pulled the alarm log for the operating window. Four alarms today — three cleared, one active on GRID-Tie-1.' },
      { kind: 'table', id: 'art-2', timestamp: '14:04:31', table: {
          title: 'Today\'s alarms · 06:00 → 14:00',
          headers: ['Time', 'Module', 'Severity', 'Duration', 'Status'],
          rows: [
            ['07:42', 'BESS-02',     'Warning',  '4m 12s',  'Cleared'],
            ['09:18', 'COMPUTE-C04', 'Info',     '0m 38s',  'Cleared'],
            ['11:34', 'PV-Inv-3',    'Warning',  '12m 04s', 'Cleared'],
            ['13:05', 'GRID-Tie-1',  'Critical', '2m 47s',  'Active'],
          ],
          footer: '4 alarms · 1 active',
      } },
    ];
  });
  const [busy, setBusy] = useState(false);
  const [val, setVal] = useState('');
  const [promptIdx, setPromptIdx] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setPromptIdx(p => (p + 1) % ANALYST_PROMPTS.length), 4500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [stream.length, busy]);

  const dismiss = (id) => setStream(s => s.filter(x => x.id !== id));

  const exportArt = (art) => {
    let rows, fname;
    if (art.kind === 'table') {
      const tbl = art.table;
      rows = [tbl.headers.join(','), ...tbl.rows.map(r => r.join(','))];
      fname = (tbl.title || 'table').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    } else {
      const series = (art.spec && art.spec.series) || [];
      if (!series.length) return;
      const headers = ['time', ...series.map(s => `${s.name || s.key} (${s.unit || ''})`)];
      rows = [headers.join(',')];
      const start = 6 * 60, step = 5;
      const n = series[0].data.length;
      for (let i = 0; i < n; i++) {
        const minTotal = start + i * step;
        const hh = String(Math.floor(minTotal / 60)).padStart(2, '0');
        const mm = String(minTotal % 60).padStart(2, '0');
        const row = [`${hh}:${mm}`, ...series.map(s => {
          const v = (s.data[i] || [,])[1];
          return v == null ? '' : (Math.round(v * 100) / 100);
        })];
        rows.push(row.join(','));
      }
      fname = (art.spec.title || 'artifact').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${fname}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const submit = async (query) => {
    const text = (query || val).trim();
    if (!text || busy) return;
    setVal('');
    const ts = nowMobile();
    setStream(s => [...s, { kind: 'message', id: newId('msg'),
                            role: 'user', timestamp: ts, text }]);

    const q = text.toLowerCase();
    const isTable = /(list|table|show me the (rows|entries|alarms|events|log)|alarms|log|breakdown|export)/.test(q);
    const isChatOnly = /^(hi|hello|hey|thanks|thank you|nice|cool|got it|ok|okay)$/i.test(text)
      || (/^(can|could|would) you/.test(q) && !/(plot|chart|graph|table|list|show)/.test(q));

    const trace = [{ tool: 'agent', label: 'Parsing intent', status: 'running' }];
    if (!isChatOnly) trace.push({ tool: 'timeseries', label: 'Querying site DB', status: 'pending' });
    if (/(price|lmp|market|scarcity|revenue|dispatch)/.test(q))
      trace.push({ tool: 'YES Energy', label: 'ERCOT LMP + ancillary', status: 'pending' });
    if (/(weather|heat|cold|cloud|wind|forecast|sun|temp)/.test(q))
      trace.push({ tool: 'OpenWeather', label: 'Site forecast', status: 'pending' });
    if (/(hormuz|geopolit|news|event|oil|opec|sanction|outage)/.test(q))
      trace.push({ tool: 'Permutable', label: 'Flagged events', status: 'pending' });
    if (/(why|explain|cause|reason)/.test(q))
      trace.push({ tool: 'graph', label: 'Walking knowledge graph', status: 'pending' });
    trace.push({ tool: 'agent', label: isChatOnly ? 'Composing reply'
      : isTable ? 'Composing table' : 'Rendering chart spec', status: 'pending' });

    const tid = newId('msg');
    setStream(s => [...s, { kind: 'message', id: tid, role: 'assistant',
                            timestamp: ts, thinking: true, trace: [...trace] }]);
    setBusy(true);

    let stepIdx = 0;
    const tick = setInterval(() => {
      stepIdx += 1;
      if (stepIdx >= trace.length) { clearInterval(tick); return; }
      trace[stepIdx - 1].status = 'done';
      trace[stepIdx].status = 'running';
      setStream(s => s.map(x => x.id === tid ? { ...x, trace: trace.map(s2 => ({ ...s2 })) } : x));
    }, 360);

    let replyText, kind = 'chart', spec, table;
    if (isChatOnly) {
      kind = 'chat';
      try {
        if (!window.claude || !window.claude.complete) throw new Error('no llm');
        replyText = await window.claude.complete(
          `You are a friendly energy site analyst. Reply conversationally (1-2 sentences). User: "${text}"`
        );
      } catch (e) {
        replyText = 'Sure — what would you like to look at?';
      }
    } else if (isTable) {
      kind = 'table';
      table = {
        title: text.replace(/^[a-z]/, c => c.toUpperCase()),
        headers: ['Time', 'Source', 'Value', 'Note'],
        rows: [
          ['07:00', 'PV',         '142 kW',  'Ramp start'],
          ['09:00', 'PV',         '1.8 MW',  'Nominal'],
          ['10:30', 'BESS-02',    '−420 kW', 'Discharging'],
          ['11:30', 'PV',         '2.7 MW',  '6% under forecast'],
          ['13:05', 'Grid-Tie-1', 'Trip',    'Critical alarm'],
          ['14:00', 'BESS-02',    '+180 kW', 'Charging'],
        ],
        footer: '6 rows · from historian',
      };
      replyText = `Pulled a table for "${text}". Tap ↓ on the card to export.`;
    } else {
      const seriesKeys = Object.keys(SERIES_DEFS).join(', ');
      const prompt = `You are a chart-spec generator for an energy site analyst tool.
Available series keys: ${seriesKeys}.
User asked: "${text}"
Reply with ONLY a single JSON object:
{ "title": "...", "keys": ["...", "..."], "note": "...", "reply": "..." }`;
      try {
        if (!window.claude || !window.claude.complete) throw new Error('no llm');
        const raw = await window.claude.complete(prompt);
        const parsed = JSON.parse(raw.replace(/\`\`\`json|\`\`\`/g, '').trim());
        const keys = (parsed.keys || []).filter(k => SERIES_DEFS[k]);
        if (!keys.length) throw new Error('no keys');
        spec = specFromKeys(keys, parsed.title || text, parsed.note || '');
        replyText = parsed.reply || `Plotted ${parsed.title || text}.`;
      } catch (e) {
        spec = fallbackSpec(text);
        replyText = `Plotted "${spec.title}". ${spec.note}`;
      }
    }

    clearInterval(tick);
    trace.forEach(s => { s.status = 'done'; });
    const ts2 = nowMobile();

    setStream(s => {
      const updated = s.map(x => x.id === tid
        ? { ...x, thinking: false, text: replyText, timestamp: ts2, trace: undefined }
        : x);
      if (kind === 'chart')
        updated.push({ kind: 'chart', id: newId('art'), spec, timestamp: ts2 });
      else if (kind === 'table')
        updated.push({ kind: 'table', id: newId('art'), table, timestamp: ts2 });
      return updated;
    });
    setBusy(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%',
                   background: t.bg }}>
      <div style={{
        margin: `${SPACE[3]}px ${SPACE[4]}px ${SPACE[2]}px`,
      }}>
        <div style={{ fontFamily: t.fontHeading, fontSize: 22, fontWeight: 500,
                       color: t.text,
                       letterSpacing: t.fontHeading.includes('Cormorant') ? 0 : 0.5,
                       lineHeight: 1, marginBottom: 2 }}>
          {t.fontHeading.includes('Cormorant') ? 'Analyst' : 'ANALYST'}
        </div>
        <div style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft,
                       letterSpacing: 0.2, textTransform: 'uppercase' }}>
          Chat · charts · tables
        </div>
      </div>

      <HeadlineStrip t={t}/>

      <div ref={scrollRef} style={{
        flex: 1, overflow: 'auto', minHeight: 0,
        display: 'flex', flexDirection: 'column', gap: SPACE[3],
        paddingBottom: SPACE[3],
      }}>
        {stream.map((item) => {
          if (item.kind === 'message')
            return <ChatBubbleMobile key={item.id} t={t} msg={item}/>;
          if (item.kind === 'chart')
            return <ChartArtifactMobile key={item.id} t={t} art={item}
                                         onExport={exportArt} onDismiss={dismiss}/>;
          if (item.kind === 'table')
            return <TableArtifactMobile key={item.id} t={t} art={item}
                                         onExport={exportArt} onDismiss={dismiss}/>;
          return null;
        })}
      </div>

      <div style={{
        padding: `${SPACE[2]}px ${SPACE[4]}px ${SPACE[3]}px`,
        borderTop: `1px solid ${t.border}`, background: t.panel,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
          <input
            type="text"
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            placeholder={ANALYST_PROMPTS[promptIdx]}
            disabled={busy}
            style={{
              flex: 1, minWidth: 0,
              padding: '9px 11px',
              background: t.surface, border: `1px solid ${t.border}`,
              borderRadius: RADIUS[2],
              fontFamily: t.fontBody, fontSize: 13, color: t.text,
              outline: 'none',
            }}
          />
          <button onClick={() => submit()} disabled={busy || !val.trim()} style={{
            padding: '0 14px',
            background: busy ? t.borderSoft : t.accent,
            border: `1px solid ${busy ? t.border : t.accent}`,
            borderRadius: RADIUS[2],
            fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700,
            letterSpacing: 0.2, color: busy ? t.textSoft : '#fff',
            textTransform: 'uppercase',
            cursor: busy || !val.trim() ? 'default' : 'pointer',
            opacity: !val.trim() && !busy ? 0.5 : 1,
          }}>{busy ? '…' : 'Ask'}</button>
        </div>
        <div style={{
          marginTop: 4, fontFamily: t.fontLabel, fontSize: 8.5, color: t.textSoft,
          letterSpacing: 0.1,
        }}>⏎ send · Each reply may add a chart or table</div>
      </div>

      <style>{`
        @keyframes amobblink {
          0%, 100% { opacity: 0.3; }
          50%      { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

window.AnalystScreen = AnalystScreen;
Object.assign(window, {
  ANALYST_NPTS: NPTS,
  ANALYST_X_LABEL_HOURS: X_LABEL_HOURS,
  analystSeriesDefs: SERIES_DEFS,
  analystColorForKey: colorForKey,
  analystDataFor: dataFor,
  analystSpecFromKeys: specFromKeys,
  analystFallbackSpec: fallbackSpec,
  analystTHour: tHour,
});
