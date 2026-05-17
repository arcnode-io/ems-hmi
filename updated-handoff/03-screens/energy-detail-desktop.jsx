// energy-detail-desktop.jsx — /modules/energy at desktop breakpoint.
//
// Reuses ENERGY_DATA exposed by energy-detail-screen.jsx. Desktop-tailored
// layout: KPI strip → landscape flow diagram + dispatch/forecast column
// → markets table.

const { useState: useStateED } = React;
const ED = window.ENERGY_DATA;
const PV_CAP = window.TOTAL_PV_CAP_KW;
const GRID_LIMIT = window.TOTAL_GRID_LIMIT_KW;

const fmtKw = (v) => Math.abs(v) >= 1000 ? (v / 1000).toFixed(2) + ' MW' : v.toLocaleString() + ' kW';
const fmt$  = (v) => '$' + v.toLocaleString();

// ─── Header strip ─────────────────────────────────────────────────
function EDDeskHeader({ t, density }) {
  const isSov = t.name === 'sovereign';
  const dense = density === 'dense';
  const w = ED.warnings[0];
  return (
    <div style={{
      padding: `${dense ? 14 : 18}px ${SPACE[5]}px`,
      borderBottom: `1px solid ${t.border}`, background: t.bg,
      display: 'flex', flexDirection: 'column', gap: SPACE[3], flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[4] }}>
        <div>
          <div style={{
            fontFamily: t.fontHeading, fontSize: 28, lineHeight: 1.1,
            letterSpacing: isSov ? 0.5 : 0, fontWeight: isSov ? 400 : 500,
            color: t.text, textTransform: isSov ? 'uppercase' : 'none', whiteSpace: 'nowrap',
          }}>{isSov ? 'ENERGY' : 'Energy'}</div>
          <div style={{
            fontFamily: t.fontLabel, fontSize: 10, letterSpacing: 0.18,
            color: t.textSoft, marginTop: 2, textTransform: 'uppercase',
          }}>Dispatch · Markets · 5-min settlement · /modules/energy</div>
        </div>
        <div style={{ flex: 1 }}/>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700, letterSpacing: 0.18,
            color: t.statusOk, textTransform: 'uppercase',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.statusOk,
                           boxShadow: `0 0 0 3px ${t.statusOk}25` }}/>
            Live · 1s ago
          </div>
          <div style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft,
                         letterSpacing: 0.1, marginTop: 2 }}>
            CAISO OASIS · 5-min lag
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={edBtnGhost(t)}>Export day</button>
          <button style={edBtnGhost(t)}>Open Analyst</button>
          <button style={{ ...edBtnGhost(t), background: t.accent, borderColor: t.accent, color: '#fff' }}>
            Desk console ↗
          </button>
        </div>
      </div>

      {w && (
        <div style={{
          padding: `7px 12px`, display: 'flex', alignItems: 'center', gap: 10,
          background: t.statusWarn + '14', border: `1px solid ${t.statusWarn}55`,
          borderRadius: RADIUS[2],
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.statusWarn,
                         boxShadow: `0 0 0 3px ${t.statusWarn}25` }}/>
          <span style={{ fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700,
                         letterSpacing: 0.2, color: t.statusWarn, textTransform: 'uppercase' }}>
            {w.code}
          </span>
          <span style={{ fontFamily: t.fontLabel, fontSize: 11, color: t.text, flex: 1,
                         letterSpacing: 0.05 }}>{w.text}</span>
          <button style={edBtnGhost(t)}>Resolve</button>
        </div>
      )}
    </div>
  );
}
function edBtnGhost(t) {
  return {
    background: 'transparent', border: `1px solid ${t.border}`, color: t.textMid,
    padding: '6px 12px', borderRadius: RADIUS[2],
    fontFamily: t.fontLabel, fontSize: 11, fontWeight: 600, letterSpacing: 0.05,
    cursor: 'pointer', whiteSpace: 'nowrap',
  };
}

// ─── KPI strip ────────────────────────────────────────────────────
function EDKpiStrip({ t }) {
  const gridNet = ED.gridOut - ED.gridIn;
  const items = [
    { label: 'PV',         val: fmtKw(ED.pv),
      cap: `of ${(PV_CAP/1000).toFixed(1)} MW`,
      pct: ED.pv / PV_CAP, color: t.statusOk },
    { label: 'BESS',       val: fmtKw(ED.bessOut),
      cap: `${ED.dispatch.bessSocPct}% SOC · DISCHARGE`, color: t.accent },
    { label: 'Grid',       val: (gridNet >= 0 ? '+' : '−') + fmtKw(Math.abs(gridNet)),
      cap: `${gridNet >= 0 ? 'EXPORT' : 'IMPORT'} · limit ${(GRID_LIMIT/1000).toFixed(1)} MW`,
      color: gridNet >= 0 ? t.statusOk : t.textMid },
    { label: 'Compute',    val: fmtKw(ED.computeLoad),
      cap: 'CLUSTER PULL', color: t.text },
    { label: 'Today rev',  val: fmt$(ED.revToday.total),
      cap: `of ${fmt$(ED.revToday.target)} target · ${Math.round(ED.revToday.total/ED.revToday.target*100)}%`,
      color: t.statusOk },
    { label: 'Settlement', val: `${Math.floor(ED.dispatch.intervalSecLeft/60)}:${String(ED.dispatch.intervalSecLeft%60).padStart(2,'0')}`,
      cap: `5-MIN INTERVAL · CONF ${Math.round(ED.dispatch.confidence*100)}%`,
      color: t.accent },
  ];
  return (
    <div style={{
      padding: `${SPACE[3]}px ${SPACE[5]}px`, background: t.surface,
      borderBottom: `1px solid ${t.border}`,
      display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: SPACE[3],
    }}>
      {items.map((k, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3,
                              borderRight: i < items.length-1 ? `1px solid ${t.borderSoft}` : 'none',
                              paddingRight: SPACE[3] }}>
          <div style={{ fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700,
                        letterSpacing: 0.18, color: t.textSoft, textTransform: 'uppercase' }}>
            {k.label}
          </div>
          <div style={{ fontFamily: t.fontMono || t.fontLabel, fontSize: 22,
                        fontWeight: 600, color: k.color, letterSpacing: 0.02, lineHeight: 1.05 }}>
            {k.val}
          </div>
          <div style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft,
                        letterSpacing: 0.1, textTransform: 'uppercase' }}>
            {k.cap}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Landscape flow diagram ───────────────────────────────────────
function EDFlow({ t }) {
  const W = 720, H = 360;
  // Source nodes on left: PV (top), BESS (mid), Grid In (bot)
  // Sinks on right: Compute (top), BESS charge (mid), Grid Out (bot)
  const NODE_W = 180, NODE_H = 78;
  const xL = 24, xR = W - NODE_W - 24;
  const yTop = 30, yMid = H/2 - NODE_H/2, yBot = H - NODE_H - 30;

  const sources = [
    { id: 'pv',   x: xL, y: yTop, label: 'PV',          val: ED.pv,        cap: `of ${(PV_CAP/1000).toFixed(1)} MW · ${Math.round(ED.pv/PV_CAP*100)}%`,
      color: t.statusOk, side: 'src' },
    { id: 'bess', x: xL, y: yMid, label: 'BESS',        val: ED.bessOut,   cap: `${ED.dispatch.bessSocPct}% SOC · DISCH`,
      color: t.accent,   side: 'src' },
    { id: 'gin',  x: xL, y: yBot, label: 'Grid in',     val: ED.gridIn,    cap: `import · limit ${(GRID_LIMIT/1000).toFixed(1)} MW`,
      color: t.textMid,  side: 'src' },
  ];
  const sinks = [
    { id: 'load',   x: xR, y: yTop, label: 'Compute',  val: ED.computeLoad, cap: 'CLUSTER PULL',
      color: t.text,    side: 'snk' },
    { id: 'gout',   x: xR, y: yBot, label: 'Grid out', val: ED.gridOut,     cap: 'EXPORT',
      color: t.statusOk, side: 'snk' },
  ];

  // Flow allocations (kW). Greedy: PV first to load, then BESS, then grid in.
  // Also PV / BESS surplus to grid out.
  const allocs = [];
  let loadRem = ED.computeLoad, exportRem = ED.gridOut;
  // PV → load → export
  let pvRem = ED.pv;
  const pvToLoad = Math.min(pvRem, loadRem); pvRem -= pvToLoad; loadRem -= pvToLoad;
  if (pvToLoad > 0) allocs.push({ from: 'pv', to: 'load', kw: pvToLoad, color: t.statusOk });
  const pvToGrid = Math.min(pvRem, exportRem); pvRem -= pvToGrid; exportRem -= pvToGrid;
  if (pvToGrid > 0) allocs.push({ from: 'pv', to: 'gout', kw: pvToGrid, color: t.statusOk });
  // BESS → load → export
  let bRem = ED.bessOut;
  const bToLoad = Math.min(bRem, loadRem); bRem -= bToLoad; loadRem -= bToLoad;
  if (bToLoad > 0) allocs.push({ from: 'bess', to: 'load', kw: bToLoad, color: t.accent });
  const bToGrid = Math.min(bRem, exportRem); bRem -= bToGrid; exportRem -= bToGrid;
  if (bToGrid > 0) allocs.push({ from: 'bess', to: 'gout', kw: bToGrid, color: t.accent });
  // Grid in → load
  if (ED.gridIn > 0 && loadRem > 0) {
    const giToLoad = Math.min(ED.gridIn, loadRem);
    allocs.push({ from: 'gin', to: 'load', kw: giToLoad, color: t.textMid });
  }

  const maxKw = Math.max(...allocs.map(a => a.kw), 1);
  const swForKw = (kw) => 6 + (kw / maxKw) * 28;  // 6..34px

  const nodeMap = {};
  [...sources, ...sinks].forEach(n => { nodeMap[n.id] = n; });

  return (
    <div style={{
      background: t.panel, border: `1px solid ${t.border}`,
      borderRadius: RADIUS[3], padding: SPACE[4],
      display: 'flex', flexDirection: 'column', gap: SPACE[3],
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <div style={{
          fontFamily: t.fontLabel, fontSize: 11, fontWeight: 700, letterSpacing: 0.2,
          color: t.text, textTransform: 'uppercase',
        }}>Active flow</div>
        <div style={{ fontFamily: t.fontLabel, fontSize: 10, color: t.textSoft,
                      letterSpacing: 0.1, textTransform: 'uppercase' }}>
          NOW · band width = kW magnitude
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        {/* Streams */}
        {allocs.map((a, i) => {
          const f = nodeMap[a.from], to = nodeMap[a.to];
          const x1 = f.x + NODE_W, y1 = f.y + NODE_H/2;
          const x2 = to.x,         y2 = to.y + NODE_H/2;
          const cx1 = x1 + (x2 - x1) * 0.45;
          const cx2 = x2 - (x2 - x1) * 0.45;
          return (
            <g key={i}>
              <path d={`M ${x1} ${y1} C ${cx1} ${y1} ${cx2} ${y2} ${x2} ${y2}`}
                    fill="none" stroke={a.color} strokeWidth={swForKw(a.kw)}
                    strokeLinecap="round" opacity={0.55}/>
              {/* Label centered */}
              <text x={(x1+x2)/2} y={(y1+y2)/2 - swForKw(a.kw)/2 - 4}
                    textAnchor="middle"
                    fontFamily={t.fontLabel} fontSize="11" fontWeight="700"
                    fill={a.color} letterSpacing="0.05">
                {fmtKw(a.kw)}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {[...sources, ...sinks].map((n) => (
          <g key={n.id}>
            <rect x={n.x} y={n.y} width={NODE_W} height={NODE_H}
                  fill={t.surface} stroke={n.color} strokeWidth={2} rx={6}/>
            <text x={n.x + 14} y={n.y + 22}
                  fontFamily={t.fontLabel} fontSize="10" fontWeight="700"
                  letterSpacing="0.18" fill={t.textSoft}>
              {n.label.toUpperCase()}
            </text>
            <text x={n.x + 14} y={n.y + 48}
                  fontFamily={t.fontMono || t.fontLabel} fontSize="20" fontWeight="600"
                  fill={n.color} letterSpacing="0.02">
              {fmtKw(n.val)}
            </text>
            <text x={n.x + 14} y={n.y + 66}
                  fontFamily={t.fontLabel} fontSize="9" fontWeight="500"
                  fill={t.textSoft} letterSpacing="0.1">
              {n.cap.toUpperCase()}
            </text>
          </g>
        ))}
      </svg>

      <div style={{ display: 'flex', gap: 16, fontFamily: t.fontLabel, fontSize: 10,
                    color: t.textSoft, letterSpacing: 0.1, textTransform: 'uppercase' }}>
        <Legend t={t} c={t.statusOk} l="PV"/>
        <Legend t={t} c={t.accent}   l="BESS"/>
        <Legend t={t} c={t.textMid}  l="Grid in"/>
        <span style={{ marginLeft: 'auto' }}>
          Net production {fmtKw(ED.pv + ED.bessOut + ED.gridIn - ED.gridOut - ED.computeLoad)} surplus
        </span>
      </div>
    </div>
  );
}
function Legend({ t, c, l }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 14, height: 3, borderRadius: 2, background: c }}/>
      <span style={{ color: t.textMid, fontWeight: 600 }}>{l}</span>
    </span>
  );
}

// ─── Active dispatch panel ────────────────────────────────────────
function EDDispatchPanel({ t }) {
  const d = ED.dispatch;
  const mins = Math.floor(d.intervalSecLeft / 60);
  const secs = String(d.intervalSecLeft % 60).padStart(2, '0');
  const isSov = t.name === 'sovereign';
  return (
    <div style={{
      background: t.panel, border: `1px solid ${t.border}`,
      borderRadius: RADIUS[3], padding: SPACE[4],
      display: 'flex', flexDirection: 'column', gap: SPACE[3],
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: t.fontLabel, fontSize: 11, fontWeight: 700, letterSpacing: 0.2,
                      color: t.text, textTransform: 'uppercase' }}>Active dispatch</div>
        <div style={{ fontFamily: t.fontLabel, fontSize: 10, color: t.textSoft,
                      letterSpacing: 0.1, textTransform: 'uppercase' }}>now</div>
      </div>
      <div style={{
        background: t.bg, border: `1px solid ${t.borderSoft}`,
        borderLeft: `3px solid ${t.accent}`,
        borderRadius: RADIUS[2], padding: `${SPACE[3]}px ${SPACE[3]}px`,
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        <div style={{ fontFamily: t.fontHeading, fontSize: 22,
                      fontWeight: isSov ? 400 : 600, color: t.text, lineHeight: 1.1,
                      letterSpacing: 0.4,
                      textTransform: t.fontHeading.includes('Bebas') ? 'uppercase' : 'none' }}>
          {d.action}
        </div>
        <div style={{ fontFamily: t.fontBody, fontSize: 13, color: t.textMid }}>
          {d.reason}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: SPACE[3] }}>
        <KV t={t} l="Settle in" v={`${mins}:${secs}`} c={t.accent}/>
        <KV t={t} l="Confidence" v={`${Math.round(d.confidence*100)}%`} c={t.statusOk}/>
        <KV t={t} l="BESS SOC"  v={`${d.bessSocPct}%`}/>
      </div>
      <button style={{
        marginTop: SPACE[2],
        padding: '7px 12px',
        background: 'transparent', border: `1px solid ${t.borderSoft}`,
        borderRadius: RADIUS[2],
        fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700, letterSpacing: 0.18,
        color: t.textMid, textTransform: 'uppercase', cursor: 'pointer',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span>Why this action — policy detail</span>
        <span>›</span>
      </button>
    </div>
  );
}
function KV({ t, l, v, c }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <div style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft,
                    letterSpacing: 0.18, textTransform: 'uppercase', fontWeight: 600 }}>{l}</div>
      <div style={{ fontFamily: t.fontMono || t.fontLabel, fontSize: 16, fontWeight: 600,
                    color: c || t.text, letterSpacing: 0.02 }}>{v}</div>
    </div>
  );
}

// ─── Forecast trace (60-min) ──────────────────────────────────────
function EDForecast({ t }) {
  const data = ED.forecast;
  const W = 720, H = 200;
  const padL = 50, padR = 50, padT = 24, padB = 28;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const N = data.length;

  const pvVals = data.map(d => d[0]);
  const prVals = data.map(d => d[1]);
  const bzVals = data.map(d => d[2]);
  const pvMin = 0, pvMax = Math.max(...pvVals) * 1.1;
  const prMin = Math.min(...prVals) * 0.92, prMax = Math.max(...prVals) * 1.05;

  const xAt = (i) => padL + (i / (N-1)) * innerW;
  const yPv = (v) => padT + innerH - ((v - pvMin) / (pvMax - pvMin)) * innerH;
  const yPr = (v) => padT + innerH - ((v - prMin) / (prMax - prMin)) * innerH;
  const yBz = (v) => padT + innerH - ((v - pvMin) / (pvMax - pvMin)) * innerH;

  const path = (vals, yFn) => vals.map((v,i) => `${i===0?'M':'L'} ${xAt(i)} ${yFn(v)}`).join(' ');

  return (
    <div style={{
      background: t.panel, border: `1px solid ${t.border}`,
      borderRadius: RADIUS[3], padding: SPACE[4],
      display: 'flex', flexDirection: 'column', gap: SPACE[3],
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={{ fontFamily: t.fontLabel, fontSize: 11, fontWeight: 700,
                        letterSpacing: 0.2, color: t.text, textTransform: 'uppercase' }}>
            Next 60 min · forecast
          </div>
          <div style={{ fontFamily: t.fontLabel, fontSize: 10, color: t.textSoft,
                        letterSpacing: 0.1, marginTop: 2 }}>
            {ED.forecastNote}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, fontFamily: t.fontLabel, fontSize: 10,
                      letterSpacing: 0.1, textTransform: 'uppercase' }}>
          <Legend t={t} c={t.statusOk} l="PV forecast"/>
          <Legend t={t} c={t.accent}   l="BESS plan"/>
          <Legend t={t} c={t.textMid}  l="Price"/>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        {/* Y-axis labels: kW left, $/MWh right */}
        {[0, 0.5, 1].map((f, i) => {
          const y = padT + (1-f) * innerH;
          return (
            <g key={`y-${i}`}>
              <line x1={padL} x2={W-padR} y1={y} y2={y} stroke={t.borderSoft} strokeWidth={1}/>
              <text x={padL-8} y={y+4} textAnchor="end"
                    fontFamily={t.fontLabel} fontSize="10" fill={t.textSoft}>
                {Math.round(pvMin + f*(pvMax-pvMin)).toLocaleString()}
              </text>
              <text x={W-padR+8} y={y+4} textAnchor="start"
                    fontFamily={t.fontLabel} fontSize="10" fill={t.textMid}>
                {Math.round(prMin + f*(prMax-prMin))}
              </text>
            </g>
          );
        })}
        {/* X-axis ticks every 15 min (3 intervals) */}
        {[0, 3, 6, 9, 11].map((i) => (
          <g key={`x-${i}`}>
            <line x1={xAt(i)} x2={xAt(i)} y1={padT+innerH} y2={padT+innerH+4}
                  stroke={t.borderSoft} strokeWidth={1}/>
            <text x={xAt(i)} y={padT+innerH+18} textAnchor="middle"
                  fontFamily={t.fontLabel} fontSize="10" fill={t.textSoft}>
              +{i*5}m
            </text>
          </g>
        ))}
        <text x={padL-8} y={padT-10} textAnchor="end"
              fontFamily={t.fontLabel} fontSize="9" fill={t.textSoft} letterSpacing="0.18">kW</text>
        <text x={W-padR+8} y={padT-10} textAnchor="start"
              fontFamily={t.fontLabel} fontSize="9" fill={t.textSoft} letterSpacing="0.18">$/MWh</text>

        {/* PV forecast (filled area) */}
        <path d={`${path(pvVals, yPv)} L ${xAt(N-1)} ${padT+innerH} L ${xAt(0)} ${padT+innerH} Z`}
              fill={t.statusOk} fillOpacity={0.10}/>
        <path d={path(pvVals, yPv)} fill="none" stroke={t.statusOk} strokeWidth={2}
              strokeDasharray="5 4"/>
        {/* BESS plan */}
        <path d={path(bzVals, yBz)} fill="none" stroke={t.accent} strokeWidth={2.4}/>
        {/* Price (dual-axis, right scale) */}
        <path d={path(prVals, yPr)} fill="none" stroke={t.textMid} strokeWidth={1.6}
              strokeDasharray="2 3" opacity={0.85}/>
        {/* Plot border */}
        <rect x={padL} y={padT} width={innerW} height={innerH}
              fill="none" stroke={t.borderSoft} strokeWidth={1}/>
      </svg>
    </div>
  );
}

// ─── Markets table ────────────────────────────────────────────────
function EDMarkets({ t }) {
  const statusColor = (s) =>
    s === 'CLEARED' ? t.statusOk :
    s === 'ACTIVE'  ? t.accent  :
    s === 'PENDING' ? t.statusWarn : t.textMid;

  return (
    <div id="ed-markets" style={{
      background: t.panel, border: `1px solid ${t.border}`,
      borderRadius: RADIUS[3], overflow: 'hidden',
    }}>
      <div style={{
        padding: `${SPACE[3]}px ${SPACE[4]}px`,
        borderBottom: `1px solid ${t.borderSoft}`, background: t.surface,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontFamily: t.fontLabel, fontSize: 11, fontWeight: 700,
                        letterSpacing: 0.2, color: t.text, textTransform: 'uppercase' }}>
            Active markets
          </div>
          <div style={{ fontFamily: t.fontLabel, fontSize: 10, color: t.textSoft,
                        letterSpacing: 0.1, marginTop: 2, textTransform: 'uppercase' }}>
            FERC compliant · CAISO · {ED.markets.length} products
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={edBtnGhost(t)}>Filter</button>
          <button style={edBtnGhost(t)}>Add bid</button>
          <button style={edBtnGhost(t)}>Settle history</button>
        </div>
      </div>
      <div>
        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1.6fr 1fr 1fr 1fr 1fr 0.9fr',
          padding: '8px 16px', background: t.bg,
          borderBottom: `1px solid ${t.borderSoft}`,
          fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700, letterSpacing: 0.2,
          color: t.textSoft, textTransform: 'uppercase',
        }}>
          <div>ID</div>
          <div>Product</div>
          <div>Type</div>
          <div>Status</div>
          <div style={{ textAlign: 'right' }}>MWh</div>
          <div style={{ textAlign: 'right' }}>$ / Total</div>
          <div style={{ textAlign: 'right' }}>Next</div>
        </div>
        {ED.markets.map((m, i) => (
          <div key={m.id} style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1.6fr 1fr 1fr 1fr 1fr 0.9fr',
            padding: '12px 16px',
            borderBottom: i < ED.markets.length - 1 ? `1px solid ${t.borderSoft}` : 'none',
            alignItems: 'center',
          }}>
            <div style={{ fontFamily: t.fontMono || t.fontLabel, fontSize: 11,
                          color: t.textMid, letterSpacing: 0.05, fontWeight: 600 }}>
              {m.id}
            </div>
            <div style={{ fontFamily: t.fontBody, fontSize: 13, color: t.text, fontWeight: 500 }}>
              {m.name}
            </div>
            <div style={{ fontFamily: t.fontLabel, fontSize: 10, color: t.textSoft,
                          letterSpacing: 0.1, textTransform: 'uppercase', fontWeight: 600 }}>
              {m.product}
            </div>
            <div>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 8px', borderRadius: 9999,
                background: statusColor(m.status) + '1a',
                border: `1px solid ${statusColor(m.status)}55`,
                fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700,
                letterSpacing: 0.18, color: statusColor(m.status),
                textTransform: 'uppercase',
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%',
                               background: statusColor(m.status) }}/>
                {m.status}
              </span>
            </div>
            <div style={{ textAlign: 'right', fontFamily: t.fontMono || t.fontLabel,
                          fontSize: 13, color: t.text, fontWeight: 600, letterSpacing: 0.02 }}>
              {m.mwh != null ? m.mwh.toFixed(1) : '—'}
            </div>
            <div style={{ textAlign: 'right', fontFamily: t.fontMono || t.fontLabel,
                          fontSize: 13, color: m.$ != null ? t.statusOk : t.textSoft,
                          fontWeight: 700, letterSpacing: 0.02 }}>
              {m.$ != null ? '$' + m.$.toLocaleString() : '— pending'}
            </div>
            <div style={{ textAlign: 'right', fontFamily: t.fontLabel, fontSize: 11,
                          color: m.next === 'NOW' ? t.accent : t.textMid,
                          letterSpacing: 0.05, fontWeight: m.next === 'NOW' ? 700 : 500,
                          textTransform: 'uppercase' }}>
              {m.next}
            </div>
          </div>
        ))}
      </div>
      {/* Footer: totals */}
      <div style={{
        padding: '10px 16px', background: t.surface,
        borderTop: `1px solid ${t.borderSoft}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: t.fontLabel, fontSize: 10, color: t.textSoft, letterSpacing: 0.1,
        textTransform: 'uppercase',
      }}>
        <span>{ED.markets.filter(m => m.status === 'CLEARED').length} cleared ·
              {' '}{ED.markets.filter(m => m.status === 'PENDING').length} pending ·
              {' '}{ED.markets.filter(m => m.status === 'ACTIVE').length} active</span>
        <span>Today total
          <strong style={{ color: t.statusOk, fontFamily: t.fontMono || t.fontLabel,
                           fontSize: 13, marginLeft: 8, letterSpacing: 0.02 }}>
            ${ED.revToday.total.toLocaleString()}
          </strong>
        </span>
      </div>
    </div>
  );
}

// ─── Revenue strip ────────────────────────────────────────────────
function EDRevenue({ t }) {
  const r = ED.revToday;
  const pct = Math.round((r.total / r.target) * 100);
  return (
    <div style={{
      background: t.panel, border: `1px solid ${t.border}`,
      borderRadius: RADIUS[3], padding: SPACE[4],
      display: 'flex', flexDirection: 'column', gap: SPACE[3],
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: t.fontLabel, fontSize: 11, fontWeight: 700,
                      letterSpacing: 0.2, color: t.text, textTransform: 'uppercase' }}>
          Today's revenue
        </div>
        <div style={{ fontFamily: t.fontLabel, fontSize: 10, color: t.textSoft,
                      letterSpacing: 0.1, textTransform: 'uppercase' }}>
          {pct}% of {fmt$(r.target)} target
        </div>
      </div>
      <div style={{ fontFamily: t.fontMono || t.fontLabel, fontSize: 36,
                    fontWeight: 600, color: t.statusOk, letterSpacing: 0.02, lineHeight: 1 }}>
        {fmt$(r.total)}
      </div>
      {/* Progress bar */}
      <div style={{ height: 8, background: t.bg, border: `1px solid ${t.borderSoft}`,
                    borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
        <div style={{ width: `${(r.arbitrage/r.target)*100}%`, background: t.statusOk }}/>
        <div style={{ width: `${(r.ancillary/r.target)*100}%`, background: t.accent }}/>
        <div style={{ width: `${(r.capacity/r.target)*100}%`, background: t.textMid }}/>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: SPACE[3] }}>
        <RevSeg t={t} color={t.statusOk} l="Arbitrage" v={r.arbitrage}/>
        <RevSeg t={t} color={t.accent}   l="Ancillary" v={r.ancillary}/>
        <RevSeg t={t} color={t.textMid}  l="Capacity"  v={r.capacity}/>
      </div>
    </div>
  );
}
function RevSeg({ t, color, l, v }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: color }}/>
        <span style={{ fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700,
                       letterSpacing: 0.18, color: t.textSoft, textTransform: 'uppercase' }}>
          {l}
        </span>
      </div>
      <div style={{ fontFamily: t.fontMono || t.fontLabel, fontSize: 16, fontWeight: 600,
                    color: t.text, letterSpacing: 0.02 }}>
        {fmt$(v)}
      </div>
    </div>
  );
}

// ─── Body ─────────────────────────────────────────────────────────
function EnergyDetailDesktopBody({ t, density }) {
  const PAD = density === 'dense' ? SPACE[4] : SPACE[5];
  const GAP = density === 'dense' ? SPACE[3] : SPACE[4];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
      <EDDeskHeader t={t} density={density}/>
      <EDKpiStrip t={t}/>
      <div style={{
        flex: 1, overflow: 'auto', minHeight: 0, padding: PAD, background: t.bg,
        display: 'flex', flexDirection: 'column', gap: GAP,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: GAP }}>
          <EDFlow t={t}/>
          <EDDispatchPanel t={t}/>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: GAP }}>
          <EDForecast t={t}/>
          <EDRevenue t={t}/>
        </div>
        <EDMarkets t={t}/>
        <div style={{
          padding: `${SPACE[3]}px ${SPACE[5]}px`,
          fontFamily: t.fontLabel, fontSize: 10, color: t.textSoft, letterSpacing: 0.15,
          textTransform: 'uppercase', textAlign: 'center',
        }}>
          Read-only · dispatch overrides require desk console · CAISO OASIS 5-min lag
        </div>
      </div>
    </div>
  );
}

window.EnergyDetailDesktopBody = EnergyDetailDesktopBody;
