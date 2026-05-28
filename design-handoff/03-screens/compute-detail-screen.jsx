// compute-detail-screen.jsx — Compute module detail (`/modules/compute/:id`).
// Spec: ems-hmi-ia-brief.md §6.2 Compute detail + DS §9.5 visual hierarchy.
//
// Designed for COMPUTE-CLUSTER, healthy but power-cap-pressured: 32 servers ×
// 8× H100 GPUs, several GPUs running near PowerLimit. Per the IA brief, the
// PowerLimit ratio is what causes throttling (not GPU temp alone) — so the
// hero diagnostic is the per-GPU "draw / cap" distribution, not a giant util %.
//
// Three things matter on this screen:
//   1) Headroom — how close are GPUs to their power cap? (causes throttling)
//   2) Throttle events — has anything actually capped recently?
//   3) ECC error trend — is silicon degrading?
// Everything else is context.

const COMPUTE = {
  id: 'compute-cluster',
  name: 'COMPUTE-CLUSTER',
  sub: '32 servers · 256× H100',
  status: 'warn',           // warn — power-cap pressure, no throttle yet
  runMode: 'AUTO',
  utilPct: 88,              // cluster aggregate
  drawKw: 184.2,
  capKw: 256.0,             // total fleet PowerLimit sum
  headroomKw: 71.8,         // capKw − drawKw
  throttleEvents24h: 1,
  eccErrors1h: 7,
  nvlink: 'OK',
  nercCip: 'COMPLIANT',
};

// 32 servers, 8 GPUs each. value = draw/cap ratio (0..1.05).
// Engineered: most around 0.78–0.92, srv-04 has two GPUs at 1.00 (capped),
// srv-19 has one GPU at 0.97 (warn), a few sprinkled outliers.
function buildGpuMatrix() {
  const rng = (() => { let s = 42; return () => (s = (s * 9301 + 49297) % 233280) / 233280; })();
  const rows = [];
  for (let s = 0; s < 32; s++) {
    const row = [];
    for (let g = 0; g < 8; g++) {
      // Base draw 0.74..0.92
      let v = 0.74 + rng() * 0.18;
      // Targeted outliers
      if (s === 3 && (g === 1 || g === 5)) v = 1.00;       // srv-04 capped
      if (s === 3 && g === 2) v = 0.98;                     // srv-04 warn neighbor
      if (s === 18 && g === 4) v = 0.97;                    // srv-19 warn
      if (s === 7 && g === 0) v = 0.95;                     // srv-08 warn
      if (s === 24 && g === 7) v = 0.96;                    // srv-25 warn
      // Some servers offline-ish (low draw — running idle)
      if (s === 27) v = 0.32 + rng() * 0.06;                // srv-28 idle
      row.push(v);
    }
    rows.push(row);
  }
  return rows;
}
const GPU_MATRIX = buildGpuMatrix();

// Histogram bins of "draw / cap" across 256 GPUs.
// Bins: 0.00–0.10 .. 1.00–1.10 (11 bins). MAX threshold at 0.95, alarm at 1.00.
function buildHistogram() {
  const bins = new Array(11).fill(0);
  for (const row of GPU_MATRIX) for (const v of row) {
    const idx = Math.min(10, Math.floor(v * 10));
    bins[idx]++;
  }
  return bins.map((count, i) => [`${(i / 10).toFixed(1)}`, count]);
}
const DRAW_HIST = buildHistogram();

// Top constrained servers — by max GPU draw/cap ratio, then by total draw.
function topConstrained() {
  const list = GPU_MATRIX.map((row, i) => {
    const peak = Math.max(...row);
    const peakIdx = row.indexOf(peak);
    return {
      idx: i,
      name: `srv-${String(i + 1).padStart(2, '0')}`,
      peak,
      peakIdx,
      avgDraw: row.reduce((a, b) => a + b, 0) / row.length,
    };
  });
  list.sort((a, b) => (b.peak - a.peak) || (b.avgDraw - a.avgDraw));
  return list.slice(0, 3);
}
const TOP_CONSTRAINED = topConstrained();

// Realistic per-server detail. Pre-baked entries are overrides for the three
// servers we expect at the top; everything else is synthesized from the matrix
// so any top-N is safe (matches how this will wire to MQTT data per server).
const SERVER_OVERRIDES = {
  'srv-04': { tempC: 71, fanRpm: 9800, ecc: 0, bmc: 'OK',   note: 'Power-capped' },
  'srv-19': { tempC: 68, fanRpm: 9100, ecc: 7, bmc: 'WARN', note: 'ECC errors · 7 (1h)' },
  'srv-08': { tempC: 66, fanRpm: 8800, ecc: 0, bmc: 'OK',   note: 'Approaching cap' },
};
const CAP_W_PER_GPU = 728;
const GPUS_PER_SERVER = 8;
function serverDetail(name, peakRatio, avgRatio) {
  const o = SERVER_OVERRIDES[name] || {};
  const capW = CAP_W_PER_GPU * GPUS_PER_SERVER;
  // Synthesized draw: use avg draw across the server's 8 GPUs × cap × 8
  const drawW = Math.round(avgRatio * capW);
  // Synthesized thermal/fan scale roughly with average load
  const synthTemp = Math.round(58 + avgRatio * 18);            // 58–76 °C
  const synthFan  = Math.round(7000 + avgRatio * 3500);        // 7000–10500 RPM
  return {
    drawW: o.drawW ?? drawW,
    capW:  o.capW  ?? capW,
    tempC: o.tempC ?? synthTemp,
    fanRpm: o.fanRpm ?? synthFan,
    ecc:   o.ecc   ?? 0,
    bmc:   o.bmc   ?? 'OK',
    note:  o.note  ?? (peakRatio >= 1.00 ? 'Power-capped'
                      : peakRatio >= 0.95 ? 'Approaching cap' : 'Headroom OK'),
  };
}

// Throttle events — last 24h timeline (hours from now, going back)
const THROTTLE_EVENTS = [
  { hoursAgo: 1.4, server: 'srv-04', trigger: 'PowerCap', durationS: 22 },
];

// Active alarms / warnings on this module
const COMPUTE_ALARMS = [
  { sev: 'warn',  code: 'GPU-1142', name: 'GPU draw approaching cap',
    detail: 'srv-04/GPU-1, GPU-5 · 100% of 728W cap', age: '8m ago' },
  { sev: 'warn',  code: 'ECC-2208', name: 'ECC corrected error rate elevated',
    detail: 'srv-19/GPU-4 · 7 events in 1h', age: '14m ago' },
];

// ─── Top bar ───
function ComputeTopBar({ t }) {
  const isSov = t.name === 'sovereign';
  return (
    <div style={{
      padding: `10px ${SPACE[4]}px`, borderBottom: `1px solid ${t.border}`,
      background: t.bg, display: 'flex', alignItems: 'center', gap: SPACE[3], flexShrink: 0,
    }}>
      <button style={{
        background: 'transparent', border: 'none', padding: 0, width: 28, height: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
      }}>
        <IconChevron size={20} color={t.textMid} dir="left"/>
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: t.fontHeading, fontSize: 20, lineHeight: 1.15,
          letterSpacing: isSov ? 0.5 : 0, fontWeight: isSov ? 400 : 500,
          color: t.text, textTransform: isSov ? 'uppercase' : 'none', whiteSpace: 'nowrap',
        }}>{COMPUTE.name}</div>
        <div style={{
          fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.15,
          color: t.textSoft, marginTop: 1, textTransform: 'uppercase', whiteSpace: 'nowrap',
        }}>{COMPUTE.sub}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontFamily: t.fontLabel, fontSize: 9, fontWeight: 600,
          letterSpacing: 0.18, color: t.statusOk, textTransform: 'uppercase',
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: t.statusOk,
                         boxShadow: `0 0 0 3px ${t.statusOk}25` }}/>
          Live
        </div>
        <div style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft,
                      letterSpacing: 0.1, marginTop: 2 }}>1s ago</div>
      </div>
    </div>
  );
}

// ─── Section header / Panel ─── (mirrors BESS detail conventions)
function CDSectionHead({ t, title, meta, anchorId }) {
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
function CDPanel({ t, children }) {
  return (
    <div style={{
      margin: `0 ${SPACE[4]}px`,
      background: t.surface, border: `1px solid ${t.border}`, borderRadius: RADIUS[3],
    }}>{children}</div>
  );
}

// ─── Hero (no giant ring; per DS-011 the diagnostic is the histogram below) ───
function ComputeHero({ t }) {
  return (
    <div style={{
      margin: `${SPACE[3]}px ${SPACE[4]}px 0`,
      padding: `${SPACE[3]}px ${SPACE[3]}px`,
      background: t.surface, border: `1px solid ${t.border}`, borderRadius: RADIUS[3],
      borderLeft: `3px solid ${t.statusWarn}`,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {/* Top row: state badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        <div style={{
          height: 22, padding: '0 6px 0 8px', borderRadius: RADIUS[2],
          background: t.statusWarn + '22', border: `1px solid ${t.statusWarn}66`,
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700, letterSpacing: 0.18,
          color: t.statusWarn, textTransform: 'uppercase', cursor: 'pointer',
        }}>
          <button onClick={(e) => {
            const root = e.currentTarget.closest('[data-phone-scroll]') || e.currentTarget.closest('[style*="overflow"]');
            const target = (root || document).querySelector ? (root || document).querySelector('#cd-alarms') : null;
            // Walk up to find the scroll container, then find #cd-alarms inside the same shell.
            let el = e.currentTarget;
            let scroller = null;
            while (el && el !== document.body) {
              const cs = getComputedStyle(el);
              if (cs.overflowY === 'auto' || cs.overflowY === 'scroll') { scroller = el; break; }
              el = el.parentElement;
            }
            const t2 = scroller ? scroller.querySelector('#cd-alarms') : document.getElementById('cd-alarms');
            if (t2 && scroller) {
              scroller.scrollTo({ top: t2.offsetTop - 8, behavior: 'smooth' });
            } else if (t2) {
              t2.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            color: 'inherit', background: 'transparent', border: 'none',
            padding: 0, font: 'inherit', cursor: 'pointer', letterSpacing: 'inherit',
            textTransform: 'inherit',
          }}>
            <IconWarning size={11} color={t.statusWarn}/>2 WARN · JUMP
            <span style={{ fontSize: 11, lineHeight: 1, opacity: 0.7 }}>↓</span>
          </button>
        </div>
        <div style={{
          height: 22, padding: '0 8px', borderRadius: RADIUS[2],
          background: 'transparent', border: `1px solid ${t.border}`,
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700, letterSpacing: 0.18,
          color: t.textMid, textTransform: 'uppercase',
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: t.statusOk }}/>
          {COMPUTE.runMode}
        </div>
      </div>

      {/* Compact key-value grid: util / draw / cap / headroom */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 4, columnGap: 8 }}>
        <CDKV t={t} l="UNIT UTIL" v={COMPUTE.utilPct} u="%" c={t.colorCompute}/>
        <CDKV t={t} l="DRAW"      v={COMPUTE.drawKw.toFixed(1)} u="kW" c={t.text} sub="AC"/>
        <CDKV t={t} l="CAP"       v={COMPUTE.capKw.toFixed(0)}  u="kW" c={t.textMid} sub="LIMIT"/>
        <CDKV t={t} l="HEADROOM"  v={`+${COMPUTE.headroomKw.toFixed(1)}`} u="kW" c={t.colorBess}/>
      </div>

      {/* Compliance / fabric strip */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 6,
        paddingTop: 6, borderTop: `1px solid ${t.borderSoft}`,
      }}>
        <ComplianceChip t={t} label="NVLINK"   value={COMPUTE.nvlink}     ok/>
        <ComplianceChip t={t} label="NERC CIP" value={COMPUTE.nercCip}    ok/>
        <ComplianceChip t={t} label="ECC" value={`${COMPUTE.eccErrors1h} ERR/HR`} sub="> 5 = WARN" warn/>
      </div>
    </div>
  );
}

function ComplianceChip({ t, label, value, ok, warn, sub }) {
  const c = warn ? t.statusWarn : (ok ? t.statusOk : t.textMid);
  const bg = warn ? t.statusWarn + '18' : t.surface;
  const bd = warn ? t.statusWarn + '55' : t.borderSoft;
  return (
    <div style={{
      height: 22, padding: '0 8px', borderRadius: RADIUS[2],
      background: bg, border: `1px solid ${bd}`,
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontFamily: t.fontLabel, fontSize: 9, fontWeight: 600, letterSpacing: 0.18,
      textTransform: 'uppercase',
    }}>
      <span style={{ color: t.textSoft }}>{label}</span>
      <span style={{ color: c, fontWeight: 700 }}>{value}</span>
      {sub && <span style={{ color: t.textSoft, opacity: 0.8, fontWeight: 500 }}>· {sub}</span>}
    </div>
  );
}

function CDKV({ t, l, v, u, c, sub }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{
        fontFamily: t.fontLabel, fontSize: 8, letterSpacing: 0.18,
        fontWeight: 600, color: t.textSoft, textTransform: 'uppercase',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{l}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 1 }}>
        <span style={{ fontFamily: t.fontLabel, fontSize: 14, fontWeight: 500, color: c, letterSpacing: -0.2, lineHeight: 1 }}>{v}</span>
        <span style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textMid }}>{u}</span>
        {sub && <span style={{ fontFamily: t.fontLabel, fontSize: 8, color: t.textSoft, letterSpacing: 0.15, textTransform: 'uppercase', marginLeft: 2 }}>{sub}</span>}
      </div>
    </div>
  );
}

// ─── GPU heatmap — 32 servers × 8 GPUs, color by draw/cap ratio ───
//
// Color encodes HEADROOM (lower headroom = warmer color), not raw utilization,
// because PowerLimit ratio is what causes throttling. Cells:
//   < 0.85   colorCompute (in-budget)
//   0.85–0.94  textSoft (watching)
//   0.95–0.99  statusWarn
//   ≥ 1.00     statusAlarm
function ratioColor(t, v) {
  if (v < 0.40) return t.statusOffline;     // idle / low — distinct from danger zone
  if (v < 0.85) return t.colorCompute;
  if (v < 0.95) return t.text;
  if (v < 1.00) return t.statusWarn;
  return t.statusAlarm;
}

function GpuHeatmap({ t }) {
  const [selected, setSelected] = React.useState(null); // server index or null
  const cellW = 16, cellH = 14, gap = 2;     // taller cells: 14px (was 10) for finger tap targets
  const rowH = cellH + gap;
  const counts = React.useMemo(() => {
    let alarm = 0, warn = 0, idle = 0;
    GPU_MATRIX.forEach(row => row.forEach(v => {
      if (v >= 1.00) alarm++;
      else if (v >= 0.95) warn++;
      else if (v < 0.40) idle++;
    }));
    return { alarm, warn, idle, total: 32 * 8 };
  }, []);
  const sel = selected != null ? GPU_MATRIX[selected] : null;
  const selPeak = sel ? Math.max(...sel) : 0;
  const selAvg  = sel ? sel.reduce((a,b)=>a+b,0) / sel.length : 0;
  return (
    <div style={{ padding: `${SPACE[3]}px ${SPACE[3]}px ${SPACE[2]}px` }}>
      {/* Count summary so operator knows total scope */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 6, fontFamily: t.fontLabel, fontSize: 8.5, letterSpacing: 0.18,
        color: t.textSoft, textTransform: 'uppercase',
      }}>
        <span>32 servers · 256 GPUs · all visible</span>
        <span>
          <span style={{ color: t.statusAlarm, fontWeight: 700 }}>{counts.alarm}</span>
          <span style={{ opacity: 0.6 }}> capped · </span>
          <span style={{ color: t.statusWarn, fontWeight: 700 }}>{counts.warn}</span>
          <span style={{ opacity: 0.6 }}> warn</span>
        </span>
      </div>
      {/* Column labels */}
      <div style={{
        display: 'flex', gap, marginLeft: 36, marginBottom: 4,
      }}>
        {Array.from({ length: 8 }).map((_, g) => (
          <div key={g} style={{
            width: cellW, fontFamily: t.fontLabel, fontSize: 7.5,
            color: t.textSoft, textAlign: 'center', letterSpacing: 0.1,
          }}>G{g}</div>
        ))}
      </div>
      {/* Rows: server label + cells (whole row is tappable — finger-friendly) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap }}>
        {GPU_MATRIX.map((row, sIdx) => {
          const peak = Math.max(...row);
          const isSel = selected === sIdx;
          const rowBg = isSel ? t.surface
                      : peak >= 1.00 ? t.statusAlarm + '14'
                      : peak >= 0.95 ? t.statusWarn + '12'
                      : 'transparent';
          const rowBd = isSel ? t.accent
                      : peak >= 1.00 ? t.statusAlarm + '40'
                      : peak >= 0.95 ? t.statusWarn + '40'
                      : 'transparent';
          return (
            <button key={sIdx} onClick={() => setSelected(s => s === sIdx ? null : sIdx)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: rowBg, border: `1px solid ${rowBd}`, borderRadius: 3,
              padding: '2px 4px 2px 2px', cursor: 'pointer', textAlign: 'left',
              fontFamily: 'inherit',
            }}>
              <div style={{
                width: 28, fontFamily: t.fontLabel, fontSize: 8,
                color: isSel ? t.accent : t.textSoft, textAlign: 'right', letterSpacing: 0.1,
                fontWeight: isSel ? 700 : 600, flexShrink: 0,
              }}>srv{String(sIdx + 1).padStart(2, '0')}</div>
              <div style={{ display: 'flex', gap, flex: 1 }}>
                {row.map((v, g) => (
                  <div key={g} style={{
                    width: cellW, height: cellH, borderRadius: 1,
                    background: ratioColor(t, v),
                    opacity: v < 0.40 ? 0.5 : 1,
                  }}/>
                ))}
              </div>
            </button>
          );
        })}
      </div>
      {/* Selection detail strip — shown when a row is tapped */}
      {sel && (
        <div style={{
          marginTop: 8, padding: '8px 10px',
          background: t.panel, border: `1px solid ${t.accent}55`, borderRadius: RADIUS[2],
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            fontFamily: t.fontLabel, fontSize: 9.5, letterSpacing: 0.15,
          }}>
            <span style={{ color: t.text, fontWeight: 700, textTransform: 'uppercase' }}>
              srv-{String(selected + 1).padStart(2, '0')} · 8 GPUs
            </span>
            <button onClick={() => setSelected(null)} style={{
              background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
              color: t.textSoft, fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.15,
              textTransform: 'uppercase', fontWeight: 600,
            }}>close ✕</button>
          </div>
          <div style={{ display: 'flex', gap: 14,
                        fontFamily: t.fontLabel, fontSize: 10, color: t.textMid }}>
            <span>peak <span style={{ color: selPeak >= 1.0 ? t.statusAlarm : selPeak >= 0.95 ? t.statusWarn : t.text, fontWeight: 700 }}>{(selPeak*100).toFixed(0)}%</span></span>
            <span>avg <span style={{ color: t.text, fontWeight: 700 }}>{(selAvg*100).toFixed(0)}%</span></span>
            <span>draw <span style={{ color: t.text, fontWeight: 700 }}>{(selAvg * 728 * 8 / 1000).toFixed(2)} kW</span></span>
          </div>
          {/* Per-GPU readout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 3 }}>
            {sel.map((v, g) => (
              <div key={g} style={{
                padding: '3px 0', textAlign: 'center', borderRadius: 2,
                background: ratioColor(t, v) + '22', border: `1px solid ${ratioColor(t, v)}66`,
                fontFamily: t.fontLabel, fontSize: 8.5, fontWeight: 700,
                color: ratioColor(t, v),
              }}>{(v*100).toFixed(0)}</div>
            ))}
          </div>
        </div>
      )}
      {/* Legend */}
      <div style={{
        display: 'flex', gap: 10, marginTop: 8, marginLeft: 30,
        fontFamily: t.fontLabel, fontSize: 8, color: t.textSoft, letterSpacing: 0.15,
        textTransform: 'uppercase', flexWrap: 'wrap',
      }}>
        <LegendKey t={t} c={t.statusOffline} l="idle"/>
        <LegendKey t={t} c={t.colorCompute}  l="< 85%"/>
        <LegendKey t={t} c={t.text}          l="85–94%"/>
        <LegendKey t={t} c={t.statusWarn}    l="95–99%"/>
        <LegendKey t={t} c={t.statusAlarm}   l="≥ 100% cap"/>
      </div>
    </div>
  );
}
function LegendKey({ t, c, l }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 8, height: 8, background: c, borderRadius: 1 }}/>
      {l}
    </span>
  );
}

// ─── Histogram of GPU draw/cap ratio across all 256 GPUs (DS-011 hero) ───
function DrawCapHistogram({ t }) {
  const W = 320, H = 110, padL = 8, padR = 8, padT = 10, padB = 28;
  const max = Math.max(...DRAW_HIST.map(b => b[1]));
  const colW = (W - padL - padR) / DRAW_HIST.length - 2;
  // Thresholds: bin index 9 is 0.9–1.0 (warn boundary at 0.95 — sits inside this bin).
  // We render warn line at the 0.95 mark, alarm line at 1.00 mark.
  const xAt = (frac) => padL + frac * (W - padL - padR);
  const warnX = xAt(0.95 / 1.1);   // 0.95 within 0..1.1 axis
  const alarmX = xAt(1.00 / 1.1);
  return (
    <div style={{ padding: `${SPACE[3]}px ${SPACE[2]}px ${SPACE[2]}px` }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        {DRAW_HIST.map(([label, count], i) => {
          const frac = i / DRAW_HIST.length;
          const xL = padL + frac * (W - padL - padR);
          const h = max > 0 ? (count / max) * (H - padT - padB) : 0;
          // Outliers: any bin whose range overlaps >= 0.95
          const isWarn  = i === 9;       // 0.9–1.0 contains the 0.95 threshold
          const isAlarm = i === 10;      // 1.0–1.1 (capped or above)
          const c = count === 0 ? t.borderSoft
                  : isAlarm ? t.statusAlarm
                  : isWarn  ? t.statusWarn
                  : t.colorCompute;
          return (
            <g key={i}>
              {count > 0 && (
                <rect x={xL + 1} y={H - padB - h} width={colW} height={h}
                      fill={c} fillOpacity={(isAlarm || isWarn) ? 1 : 0.85} rx={1}/>
              )}
              {count > 0 && h > 10 && (
                <text x={xL + 1 + colW/2} y={H - padB - h - 3} textAnchor="middle"
                      fontFamily={t.fontLabel} fontSize="7.5" fontWeight="600"
                      fill={isAlarm ? t.statusAlarm : isWarn ? t.statusWarn : t.textMid}>{count}</text>
              )}
              {(i % 2 === 0) && (
                <text x={xL + 1 + colW/2} y={H - 14} textAnchor="middle"
                      fontFamily={t.fontLabel} fontSize="7.5" fill={t.textSoft}>{label}</text>
              )}
            </g>
          );
        })}
        {/* Warn threshold (95% of cap) */}
        <line x1={warnX} y1={padT - 2} x2={warnX} y2={H - padB}
              stroke={t.statusWarn} strokeWidth={1} strokeDasharray="3 2" opacity={0.8}/>
        <text x={warnX - 2} y={padT + 6} textAnchor="end"
              fontFamily={t.fontLabel} fontSize="7"
              fontWeight="700" letterSpacing="0.2" fill={t.statusWarn}>WARN</text>
        {/* Alarm threshold (100% of cap = throttling) */}
        <line x1={alarmX} y1={padT - 2} x2={alarmX} y2={H - padB}
              stroke={t.statusAlarm} strokeWidth={1} strokeDasharray="3 2" opacity={0.8}/>
        <text x={alarmX + 2} y={padT + 6}
              fontFamily={t.fontLabel} fontSize="7"
              fontWeight="700" letterSpacing="0.2" fill={t.statusAlarm}>CAP</text>
        <text x={padL} y={H - 2} fontFamily={t.fontLabel} fontSize="7.5"
              fill={t.textSoft} letterSpacing="0.2">DRAW / CAP RATIO · 256 GPUs</text>
        <text x={W - padR} y={H - 2} textAnchor="end" fontFamily={t.fontLabel}
              fontSize="7.5" fill={t.statusWarn} fontWeight="600">5 GPUs ≥ 95%</text>
      </svg>
    </div>
  );
}

// ─── Active warnings ───
function ComputeAlarmsBlock({ t }) {
  return (
    <CDPanel t={t}>
      {COMPUTE_ALARMS.map((a, i) => (
        <div key={i} style={{
          padding: `${SPACE[3]}px ${SPACE[3]}px`,
          borderTop: i > 0 ? `1px solid ${t.borderSoft}` : 'none',
          borderLeft: `3px solid ${t.statusWarn}`,
          display: 'flex', alignItems: 'flex-start', gap: SPACE[3],
        }}>
          <IconWarning size={16} color={t.statusWarn}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: t.fontLabel, fontSize: 12, fontWeight: 700,
              color: t.text, letterSpacing: 0.15,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{a.name}</div>
            <div style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft,
                           letterSpacing: 0.15, fontWeight: 600, marginTop: 2,
                           whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.code}</div>
            <div style={{ fontFamily: t.fontBody, fontSize: 11, color: t.textMid, marginTop: 1 }}>{a.detail}</div>
            <div style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft,
                          letterSpacing: 0.15, marginTop: 3, textTransform: 'uppercase' }}>{a.age}</div>
          </div>
        </div>
      ))}
    </CDPanel>
  );
}

// ─── Top 3 constrained servers ───
function TopServersList({ t }) {
  return (
    <CDPanel t={t}>
      {TOP_CONSTRAINED.map((s, i) => {
        const d = serverDetail(s.name, s.peak, s.avgDraw);
        const ratio = d.drawW / d.capW;
        const isCapped = ratio >= 1.0;
        const isWarn = !isCapped && ratio >= 0.95;
        const ringC = isCapped ? t.statusAlarm : isWarn ? t.statusWarn : t.colorCompute;
        return (
          <div key={s.name} style={{
            padding: `${SPACE[3]}px ${SPACE[3]}px`,
            borderTop: i > 0 ? `1px solid ${t.borderSoft}` : 'none',
            display: 'flex', alignItems: 'center', gap: SPACE[3],
          }}>
            {/* Ring: GPU draw / cap */}
            <ServerRing t={t} ratio={ratio} color={ringC} size={48}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: t.fontLabel, fontSize: 13, fontWeight: 700,
                               color: t.text, letterSpacing: 0.1 }}>{s.name}</span>
                <span style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft,
                               letterSpacing: 0.15, textTransform: 'uppercase' }}>{d.note}</span>
              </div>
              {/* Sub-row: draw/cap, temp, fan, ECC */}
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4,
                fontFamily: t.fontLabel, fontSize: 10, color: t.textMid, letterSpacing: 0.05,
              }}>
                <Inline label="DRAW" value={`${(d.drawW/1000).toFixed(2)} kW`} c={t.text}/>
                <Inline label="CAP"  value={`${(d.capW/1000).toFixed(2)} kW`} c={t.textSoft}/>
                <Inline label="GPU°" value={`${d.tempC} °C`} c={t.text}/>
                <Inline label="FAN"  value={`${d.fanRpm} RPM`} c={t.textMid}/>
                <Inline label="ECC"  value={String(d.ecc)}     c={d.ecc > 0 ? t.statusWarn : t.textMid}/>
                <Inline label="BMC"  value={d.bmc}            c={d.bmc === 'OK' ? t.statusOk : t.statusWarn}/>
              </div>
            </div>
            <IconChevron size={14} color={t.textSoft} dir="right"/>
          </div>
        );
      })}
    </CDPanel>
  );
}

function Inline({ label, value, c }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
      <span style={{ opacity: 0.7, fontWeight: 600, fontSize: 9, letterSpacing: 0.18, textTransform: 'uppercase' }}>{label}</span>
      <span style={{ color: c, fontWeight: 600 }}>{value}</span>
    </span>
  );
}

function ServerRing({ t, ratio, color, size = 44 }) {
  const stroke = 5;
  const r = size / 2 - stroke / 2 - 1;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - Math.min(1, ratio));
  return (
    <svg width={size} height={size} style={{ display: 'block', flexShrink: 0 }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke={t.border} strokeWidth={stroke}/>
      <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={off}
              transform={`rotate(-90 ${c} ${c})`}/>
      <text x={c} y={c + 2} textAnchor="middle"
            fontFamily={t.fontLabel} fontSize="11" fontWeight="600"
            fill={t.text} letterSpacing="-0.2">{Math.round(ratio*100)}</text>
      <text x={c} y={c + 11} textAnchor="middle"
            fontFamily={t.fontLabel} fontSize="6" fontWeight="600"
            letterSpacing="0.2" fill={t.textSoft}>%CAP</text>
    </svg>
  );
}

// ─── Throttle events timeline (24h) ───
function ThrottleTimeline({ t }) {
  const W = 320, H = 56, padL = 8, padR = 8, padT = 8, padB = 22;
  const trackY = H - padB - 8;
  return (
    <div style={{ padding: `${SPACE[3]}px ${SPACE[2]}px` }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        {/* Track */}
        <line x1={padL} y1={trackY} x2={W - padR} y2={trackY}
              stroke={t.borderSoft} strokeWidth={1.5} strokeLinecap="round"/>
        {/* Hour ticks */}
        {[0, 6, 12, 18, 24].map((h) => {
          // 24h ago at left, NOW at right
          const x = padL + ((24 - h) / 24) * (W - padL - padR);
          return (
            <g key={h}>
              <line x1={x} y1={trackY - 3} x2={x} y2={trackY + 3} stroke={t.textSoft} strokeWidth={1}/>
              <text x={x} y={H - 4} textAnchor="middle"
                    fontFamily={t.fontLabel} fontSize="8" fill={t.textSoft}>
                {h === 0 ? 'NOW' : `${h}h`}
              </text>
            </g>
          );
        })}
        {/* Events */}
        {THROTTLE_EVENTS.map((e, i) => {
          const x = padL + ((24 - e.hoursAgo) / 24) * (W - padL - padR);
          return (
            <g key={i}>
              {/* Vertical drop */}
              <line x1={x} y1={padT + 4} x2={x} y2={trackY} stroke={t.statusAlarm}
                    strokeWidth={1} strokeDasharray="2 2" opacity={0.6}/>
              <circle cx={x} cy={trackY} r={4} fill={t.statusAlarm}/>
              <text x={x} y={padT + 8} textAnchor="middle"
                    fontFamily={t.fontLabel} fontSize="8" fontWeight="700"
                    letterSpacing="0.15" fill={t.statusAlarm}>
                {e.server} · {e.durationS}s
              </text>
              <text x={x} y={padT + 18} textAnchor="middle"
                    fontFamily={t.fontLabel} fontSize="7"
                    fill={t.textMid}>{e.trigger}</text>
            </g>
          );
        })}
        {/* Empty-state hint when 0 events handled implicitly: dotted track only. */}
        <text x={padL} y={H - 4} fontFamily={t.fontLabel} fontSize="8"
              fill={t.textSoft} letterSpacing="0.15">{THROTTLE_EVENTS.length === 0 ? 'None in 24h' : ''}</text>
      </svg>
    </div>
  );
}

// ─── Controls panel ───
function ComputeControlsPanel({ t }) {
  return (
    <div style={{
      margin: `${SPACE[3]}px ${SPACE[4]}px 0`,
      background: t.panel, border: `1px solid ${t.border}`, borderRadius: RADIUS[3],
      overflow: 'hidden',
    }}>
      <div style={{
        padding: `${SPACE[2]}px ${SPACE[3]}px`,
        borderBottom: `1px solid ${t.border}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700,
          letterSpacing: 0.2, color: t.text, textTransform: 'uppercase',
        }}>Controls</div>
        <div style={{ flex: 1 }}/>
        <div style={{
          height: 18, padding: '0 6px', borderRadius: RADIUS[2],
          background: t.statusSim + '22', border: `1px solid ${t.statusSim}55`,
          fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700, letterSpacing: 0.18,
          color: t.statusSim, textTransform: 'uppercase',
          display: 'inline-flex', alignItems: 'center',
        }}>SIM</div>
      </div>

      {/* Run mode segmented */}
      <div style={{ padding: `${SPACE[3]}px ${SPACE[3]}px ${SPACE[2]}px` }}>
        <div style={{
          fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.18,
          color: t.textSoft, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6,
        }}>Run mode</div>
        <div style={{ display: 'flex', border: `1px solid ${t.border}`, borderRadius: RADIUS[2], overflow: 'hidden' }}>
          {['AUTO', 'MANUAL'].map((m, i) => {
            const active = m === 'AUTO';
            return (
              <button key={m} style={{
                flex: 1, padding: '8px 6px',
                background: active ? t.text : 'transparent',
                color: active ? t.bg : t.textMid,
                border: 'none',
                borderRight: i < 1 ? `1px solid ${t.border}` : 'none',
                fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700,
                letterSpacing: 0.15, textTransform: 'uppercase', cursor: 'pointer',
              }}>{m}</button>
            );
          })}
        </div>
      </div>

      {/* PowerLimit setpoint — disabled in AUTO */}
      <div style={{ padding: `0 ${SPACE[3]}px ${SPACE[2]}px`, opacity: 0.4 }}>
        <div>
          <div style={{
            fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.18,
            color: t.textSoft, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4,
          }}>PowerLimit (W per GPU)</div>
          <div style={{
            height: 32, border: `1px solid ${t.border}`, borderRadius: RADIUS[2],
            padding: '0 8px', display: 'flex', alignItems: 'center',
            fontFamily: t.fontLabel, fontSize: 13, color: t.textMid, background: t.surface,
          }}>728</div>
        </div>
        <div style={{
          fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft, marginTop: 4,
          letterSpacing: 0.1, textTransform: 'uppercase',
        }}>Setpoint editable in MANUAL · PATCH to Redfish</div>
      </div>

      {/* Action buttons — LOTO + Server reset + BMC reset */}
      <div style={{
        borderTop: `1px solid ${t.border}`,
        padding: `${SPACE[2]}px ${SPACE[3]}px`,
        display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
      }}>
        <button style={{
          flex: 1, minWidth: 100,
          height: 36, padding: '0 10px',
          background: 'transparent', color: t.text,
          border: `1px solid ${t.border}`, borderRadius: RADIUS[2],
          fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700, letterSpacing: 0.15,
          textTransform: 'uppercase', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <IconPadlock size={12} color={t.text}/>LOTO
        </button>
        <button style={{
          flex: 1, minWidth: 100,
          height: 36, padding: '0 10px',
          background: 'transparent', color: t.text,
          border: `1px solid ${t.border}`, borderRadius: RADIUS[2],
          fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700, letterSpacing: 0.15,
          textTransform: 'uppercase', cursor: 'pointer',
        }}>Reset Server</button>
        <button style={{
          flex: 1, minWidth: 100,
          height: 36, padding: '0 10px',
          background: t.statusWarn + '14', color: t.statusWarn,
          border: `1px solid ${t.statusWarn}66`, borderRadius: RADIUS[2],
          fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700, letterSpacing: 0.15,
          textTransform: 'uppercase', cursor: 'pointer',
        }}>Reset BMC</button>
      </div>
      <div style={{
        padding: `${SPACE[2]}px ${SPACE[3]}px`,
        borderTop: `1px solid ${t.borderSoft}`,
        fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft,
        letterSpacing: 0.1, textTransform: 'uppercase',
      }}>BMC reset is LOTO-gated · all commands require confirmation</div>
    </div>
  );
}

// ─── Composed screen ───
function ComputeDetailScreen({ t }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: t.bg }}>
      <ComputeTopBar t={t}/>
      <StatusStrip t={t}/>
      <div style={{ flex: 1, paddingBottom: SPACE[4] }}>
        <ComputeHero t={t}/>

        <CDSectionHead t={t} title="Draw / cap distribution" meta="diagnostic"/>
        <CDPanel t={t}><DrawCapHistogram t={t}/></CDPanel>

        <CDSectionHead t={t} title="GPU heatmap · tap row" meta="% of cap"/>
        <CDPanel t={t}><GpuHeatmap t={t}/></CDPanel>

        <CDSectionHead t={t} title="Top 3 by cap pressure"/>
        <TopServersList t={t}/>

        <CDSectionHead t={t} title="Throttle events · 24h"/>
        <CDPanel t={t}><ThrottleTimeline t={t}/></CDPanel>

        <CDSectionHead t={t} title="Active warnings" anchorId="cd-alarms"/>
        <ComputeAlarmsBlock t={t}/>

        <ComputeControlsPanel t={t}/>
      </div>
    </div>
  );
}

window.ComputeDetailScreen = ComputeDetailScreen;
// Expose data + helpers so the desktop layout can reuse them without duplication.
Object.assign(window, {
  COMPUTE_DATA: COMPUTE,
  COMPUTE_GPU_MATRIX: GPU_MATRIX,
  COMPUTE_DRAW_HIST: DRAW_HIST,
  COMPUTE_TOP_CONSTRAINED: TOP_CONSTRAINED,
  COMPUTE_ALARMS_DATA: COMPUTE_ALARMS,
  COMPUTE_THROTTLE_EVENTS: THROTTLE_EVENTS,
  computeServerDetail: serverDetail,
  computeRatioColor: ratioColor,
});
