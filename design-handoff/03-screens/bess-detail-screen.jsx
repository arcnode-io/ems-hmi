// bess-detail-screen.jsx — BESS module detail (`/modules/bess/:id`).
// Spec: ems-hmi-ia-brief.md §6.2 BESS detail.
//
// Designed for BESS-02 in alarm state — voltage spread fault — to exercise the
// most interesting cells: alarm header, cell-voltage histogram with outlier,
// active alarm row, controls panel disabled in SIM context.

const BESS = {
  id: 'bess-02', name: 'BESS-02', sub: 'Lithium · 2 MWh · Rack A2',
  status: 'alarm',
  runMode: 'AUTO',
  soc: 67,
  socThresholds: { warn: 25, alarm: 15 }, // low end
  power: -42,            // kW, − = discharge
  voltage: 798.4,        // pack V
  current: -52.6,        // A
  cycles: 1184,
  health: 96.2,          // SoH %
};

// 24h SoC trend — mostly steady, then a discharge dip in the last hours
const SOC_TREND = [
  78, 78, 79, 80, 80, 80, 81, 81, 80, 79, 78, 77,
  76, 76, 75, 75, 74, 73, 72, 71, 70, 69, 68, 67,
];

// Cell voltage histogram bins (V). 384 cells in pack. One outlier cluster low.
// [bin label, count]. Median ~3.42, the alarmed outlier is the leftmost stack at 3.28.
const CELL_BINS = [
  ['3.28', 4],   ['3.30', 0],   ['3.32', 0],   ['3.34', 1],
  ['3.36', 3],   ['3.38', 8],   ['3.40', 42],  ['3.42', 168],
  ['3.44', 121], ['3.46', 31],  ['3.48', 5],   ['3.50', 1],
];

const ACTIVE_ALARMS = [
  { sev: 'alarm', code: 'BMS-2104', name: 'Cell voltage spread',
    detail: '142 mV @ 14:32:18', age: '2m ago' },
];
const RECENT_CLEARED = [
  { sev: 'warn', code: 'BMS-1208', name: 'Coolant ΔT high', cleared: '08:14',
    peak: 'peak 9.2°C ΔT @ 07:58', cause: 'cleared by coolant pump auto-ramp' },
];

const THERMAL_SENSORS = [
  { id: 'COOL-IN',  label: 'Coolant in',  v: 24.8, u: '°C', spark: [24.6,24.6,24.7,24.7,24.8,24.8,24.8] },
  { id: 'COOL-OUT', label: 'Coolant out', v: 32.4, u: '°C', spark: [31.0,31.4,31.7,32.0,32.2,32.3,32.4] },
  { id: 'AMB',      label: 'Ambient',     v: 22.1, u: '°C', spark: [22.0,22.0,22.1,22.1,22.1,22.1,22.1] },
];

// ─── Top bar ───
function BessTopBar({ t }) {
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
        }}>{BESS.name}</div>
        <div style={{
          fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.15,
          color: t.textSoft, marginTop: 1, textTransform: 'uppercase', whiteSpace: 'nowrap',
        }}>{BESS.sub}</div>
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

// ─── Hero: SoC gauge + state ───
function SocGauge({ t, value, color, size = 96 }) {
  const stroke = 9;
  const r = size / 2 - stroke / 2 - 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - value / 100);
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke={t.border} strokeWidth={stroke}/>
      <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={off}
              transform={`rotate(-90 ${c} ${c})`}/>
      {/* 25% / 15% threshold ticks */}
      {[25, 15].map(p => {
        const a = (-90 + p * 3.6) * Math.PI / 180;
        const x1 = c + (r - stroke/2 - 2) * Math.cos(a);
        const y1 = c + (r - stroke/2 - 2) * Math.sin(a);
        const x2 = c + (r + stroke/2 + 2) * Math.cos(a);
        const y2 = c + (r + stroke/2 + 2) * Math.sin(a);
        return <line key={p} x1={x1} y1={y1} x2={x2} y2={y2} stroke={t.textSoft} strokeWidth={1}/>;
      })}
      <text x={c} y={c - 1} textAnchor="middle"
            fontFamily={t.fontLabel} fontSize="24" fontWeight="400"
            fill={t.text} letterSpacing="-0.5">{value}</text>
      <text x={c} y={c + 13} textAnchor="middle"
            fontFamily={t.fontLabel} fontSize="9" fontWeight="500"
            fill={t.textMid}>%</text>
      <text x={c} y={c + 26} textAnchor="middle"
            fontFamily={t.fontLabel} fontSize="7" fontWeight="600"
            letterSpacing="0.3" fill={t.textSoft}>UNIT SoC</text>
    </svg>
  );
}

function HeroPanel({ t }) {
  const isSov = t.name === 'sovereign';
  return (
    <div style={{
      margin: `${SPACE[3]}px ${SPACE[4]}px 0`,
      padding: `${SPACE[3]}px ${SPACE[3]}px`,
      background: t.surface, border: `1px solid ${t.border}`, borderRadius: RADIUS[3],
      borderLeft: `3px solid ${t.statusAlarm}`,
      display: 'flex', alignItems: 'center', gap: SPACE[3],
    }}>
      <SocGauge t={t} value={BESS.soc} color={t.colorBess}/>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Alarm + run mode badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {/* Alarm chip — tappable jump to alarm section */}
        <div style={{
            height: 22, padding: '0 6px 0 8px', borderRadius: RADIUS[2],
            background: t.statusAlarm + '20', border: `1px solid ${t.statusAlarm}66`,
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700, letterSpacing: 0.18,
            color: t.statusAlarm, textTransform: 'uppercase', cursor: 'pointer',
          }}>
            <IconAlarm size={11} color={t.statusAlarm}/>1 ALARM
            <span style={{ fontSize: 11, lineHeight: 1, opacity: 0.7 }}>›</span>
          </div>
          <div style={{
            height: 22, padding: '0 8px', borderRadius: RADIUS[2],
            background: 'transparent', border: `1px solid ${t.border}`,
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700, letterSpacing: 0.18,
            color: t.textMid, textTransform: 'uppercase',
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: t.statusOk }}/>
            {BESS.runMode}
          </div>
        </div>
        {/* P/V/I quick-read */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 4, columnGap: 8, marginTop: 2 }}>
          <KV t={t} l="POWER"   v={`${BESS.power > 0 ? '+' : ''}${BESS.power}`} u="kW"
              c={t.statusAlarm} sub="DSCH"/>
          <KV t={t} l="PACK V"  v={BESS.voltage} u="V" c={t.text} sub="DC"/>
          <KV t={t} l="CURRENT" v={BESS.current} u="A" c={t.text}/>
          <KV t={t} l="SoH"     v={BESS.health} u="%" c={t.colorBess}/>
        </div>
      </div>
    </div>
  );
}

function KV({ t, l, v, u, c, sub }) {
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

// ─── Section header ───
function SectionHead({ t, title, meta }) {
  return (
    <div style={{
      margin: `${SPACE[4]}px ${SPACE[4]}px ${SPACE[2]}px`,
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      gap: 8,
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

function Panel({ t, children }) {
  return (
    <div style={{
      margin: `0 ${SPACE[4]}px`,
      background: t.surface, border: `1px solid ${t.border}`, borderRadius: RADIUS[3],
    }}>{children}</div>
  );
}

// ─── 24h SoC trend ───
function SocTrend({ t }) {
  const W = 320, H = 92, padL = 28, padR = 8, padT = 8, padB = 18;
  const min = 60, max = 90;
  const xs = SOC_TREND.length;
  const x = (i) => padL + (i / (xs - 1)) * (W - padL - padR);
  const y = (v) => padT + (1 - (v - min) / (max - min)) * (H - padT - padB);
  const path = SOC_TREND.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const areaPath = path + ` L ${x(xs - 1)} ${H - padB} L ${x(0)} ${H - padB} Z`;
  return (
    <div style={{ padding: `${SPACE[3]}px ${SPACE[2]}px ${SPACE[2]}px` }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        {/* Y gridlines */}
        {[60, 70, 80, 90].map(g => (
          <g key={g}>
            <line x1={padL} y1={y(g)} x2={W - padR} y2={y(g)} stroke={t.chartGrid} strokeWidth={1}/>
            <text x={padL - 4} y={y(g) + 3} textAnchor="end"
                  fontFamily={t.fontLabel} fontSize="8" fill={t.textSoft}>{g}</text>
          </g>
        ))}
        {/* Area */}
        <path d={areaPath} fill={t.colorBess} fillOpacity={0.12}/>
        {/* Line */}
        <path d={path} fill="none" stroke={t.colorBess} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round"/>
        {/* End dot */}
        <circle cx={x(xs - 1)} cy={y(SOC_TREND[xs - 1])} r={2.5} fill={t.colorBess}/>
        {/* X labels — show 00:00, 06:00, 12:00, 18:00, NOW */}
        {[
          { i: 0,  label: '00:00' },
          { i: 6,  label: '06:00' },
          { i: 12, label: '12:00' },
          { i: 18, label: '18:00' },
        ].map(({ i, label }) => (
          <text key={i} x={x(i)} y={H - 4} textAnchor="middle"
                fontFamily={t.fontLabel} fontSize="8" fill={t.textSoft}>
            {label}
          </text>
        ))}
        {/* NOW marker — vertical line + label, anchored at the last sample */}
        <line x1={x(xs - 1)} y1={padT} x2={x(xs - 1)} y2={H - padB}
              stroke={t.text} strokeWidth={1} strokeDasharray="2 2" opacity={0.5}/>
        <text x={x(xs - 1)} y={H - 4} textAnchor="end"
              fontFamily={t.fontLabel} fontSize="8" fontWeight="700"
              letterSpacing="0.2" fill={t.text}>NOW</text>
      </svg>
    </div>
  );
}

// ─── Cell voltage histogram ───
function CellHistogram({ t }) {
  const W = 320, H = 110, padL = 8, padR = 8, padT = 10, padB = 28;
  const max = Math.max(...CELL_BINS.map(b => b[1]));
  const colW = (W - padL - padR) / CELL_BINS.length - 2;
  return (
    <div style={{ padding: `${SPACE[3]}px ${SPACE[2]}px ${SPACE[2]}px` }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        {CELL_BINS.map(([label, count], i) => {
          const xL = padL + i * ((W - padL - padR) / CELL_BINS.length);
          const h = max > 0 ? (count / max) * (H - padT - padB) : 0;
          // The 4 cells in the leftmost bin are the alarmed outliers — color red
          const isOutlier = i <= 1;
          const c = count === 0 ? t.borderSoft : (isOutlier ? t.statusAlarm : t.colorBess);
          return (
            <g key={i}>
              {count > 0 && (
                <rect x={xL + 1} y={H - padB - h} width={colW} height={h}
                      fill={c} fillOpacity={isOutlier ? 1 : 0.85} rx={1}/>
              )}
              {/* count label on top (only if > 0 and tall enough) */}
              {count > 0 && h > 10 && (
                <text x={xL + 1 + colW/2} y={H - padB - h - 3} textAnchor="middle"
                      fontFamily={t.fontLabel} fontSize="7.5" fontWeight="600"
                      fill={isOutlier ? t.statusAlarm : t.textMid}>{count}</text>
              )}
              {/* x label every other bin to avoid crowding */}
              {(i % 2 === 0) && (
                <text x={xL + 1 + colW/2} y={H - 14} textAnchor="middle"
                      fontFamily={t.fontLabel} fontSize="7.5" fill={t.textSoft}>{label}</text>
              )}
            </g>
          );
        })}
        {/* Alarm threshold lines — pack must stay within these bounds */}
        {(() => {
          // Bin labels are 3.28..3.50 in 0.02 steps. Threshold at 3.30 (low) and 3.48 (high).
          // Map bin index to x at left edge of that bin.
          const xAt = (binIdx) => padL + binIdx * ((W - padL - padR) / CELL_BINS.length);
          const lowX  = xAt(1);    // boundary between 3.28 (alarm) and 3.30 (ok)
          const highX = xAt(11);   // boundary between 3.48 (ok) and 3.50 (warn)
          return (
            <g>
              <line x1={lowX} y1={padT - 2} x2={lowX} y2={H - padB}
                    stroke={t.statusAlarm} strokeWidth={1} strokeDasharray="3 2" opacity={0.7}/>
              <text x={lowX + 2} y={padT + 6} fontFamily={t.fontLabel} fontSize="7"
                    fontWeight="700" letterSpacing="0.2" fill={t.statusAlarm}>MIN</text>
              <line x1={highX} y1={padT - 2} x2={highX} y2={H - padB}
                    stroke={t.statusAlarm} strokeWidth={1} strokeDasharray="3 2" opacity={0.7}/>
              <text x={highX - 2} y={padT + 6} textAnchor="end"
                    fontFamily={t.fontLabel} fontSize="7"
                    fontWeight="700" letterSpacing="0.2" fill={t.statusAlarm}>MAX</text>
            </g>
          );
        })()}
        <text x={padL} y={H - 2} fontFamily={t.fontLabel} fontSize="7.5"
              fill={t.textSoft} letterSpacing="0.2">CELL VOLTAGE (V) · 384 cells</text>
        <text x={W - padR} y={H - 2} textAnchor="end" fontFamily={t.fontLabel}
              fontSize="7.5" fill={t.statusAlarm} fontWeight="600">Spread 142 mV · limit 100</text>
      </svg>
    </div>
  );
}

// ─── Active alarms ───
function AlarmsBlock({ t }) {
  return (
    <Panel t={t}>
      {ACTIVE_ALARMS.map((a, i) => (
        <div key={i} style={{
          padding: `${SPACE[3]}px ${SPACE[3]}px`,
          borderLeft: `3px solid ${t.statusAlarm}`,
          display: 'flex', alignItems: 'flex-start', gap: SPACE[3],
        }}>
          <IconAlarm size={18} color={t.statusAlarm}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: t.fontLabel, fontSize: 12, fontWeight: 700,
              color: t.text, letterSpacing: 0.15,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{a.name}</div>
            <div style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft,
                           letterSpacing: 0.15, fontWeight: 600, marginTop: 2,
                           whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.code}</div>
            <div style={{ fontFamily: t.fontBody, fontSize: 11, color: t.textMid, marginTop: 1,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {a.detail}
            </div>
            <div style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft,
                          letterSpacing: 0.15, marginTop: 3, textTransform: 'uppercase' }}>{a.age}</div>
          </div>
        </div>
      ))}
      {RECENT_CLEARED.map((a, i) => (
        <div key={i} style={{
          padding: `${SPACE[2]}px ${SPACE[3]}px`,
          borderTop: `1px solid ${t.borderSoft}`,
          display: 'flex', alignItems: 'center', gap: SPACE[3],
          opacity: 0.7,
        }}>
          <IconCheck size={14} color={t.statusOk}/>
          <div style={{ flex: 1, fontFamily: t.fontBody, fontSize: 11, color: t.textMid, minWidth: 0 }}>
            <div>
              <span style={{ color: t.text, fontWeight: 500 }}>{a.name}</span>
              <span style={{ marginLeft: 6, color: t.textSoft }}>cleared {a.cleared}</span>
            </div>
            <div style={{ fontFamily: t.fontLabel, fontSize: 10, color: t.textSoft,
                          letterSpacing: 0.05, marginTop: 2, lineHeight: 1.3 }}>
              {a.peak} · {a.cause}
            </div>
          </div>
        </div>
      ))}
    </Panel>
  );
}

// ─── Thermal sensors ───
function MiniSpark({ t, points, color }) {
  const W = 60, H = 18;
  const min = Math.min(...points), max = Math.max(...points);
  const range = Math.max(0.5, max - min);
  const x = (i) => (i / (points.length - 1)) * W;
  const y = (v) => H - 2 - ((v - min) / range) * (H - 4);
  const path = points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  return (
    <svg width={W} height={H} style={{ display: 'block' }}>
      <path d={path} fill="none" stroke={color} strokeWidth={1.25}/>
    </svg>
  );
}

function ThermalRows({ t }) {
  return (
    <Panel t={t}>
      {THERMAL_SENSORS.map((s, i) => (
        <div key={s.id} style={{
          padding: `${SPACE[2]}px ${SPACE[3]}px`,
          borderBottom: i < THERMAL_SENSORS.length - 1 ? `1px solid ${t.borderSoft}` : 'none',
          display: 'flex', alignItems: 'center', gap: SPACE[3],
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.15,
                          color: t.textSoft, fontWeight: 600, textTransform: 'uppercase' }}>{s.id}</div>
            <div style={{ fontFamily: t.fontBody, fontSize: 11, color: t.textMid, marginTop: 1 }}>{s.label}</div>
          </div>
          <MiniSpark t={t} points={s.spark} color={t.colorThermal}/>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, minWidth: 56, justifyContent: 'flex-end' }}>
            <span style={{ fontFamily: t.fontLabel, fontSize: 13, fontWeight: 500,
                           color: t.text, letterSpacing: -0.2 }}>{s.v}</span>
            <span style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textMid }}>{s.u}</span>
          </div>
        </div>
      ))}
    </Panel>
  );
}

// ─── Controls panel ───
function ControlsPanel({ t }) {
  const isSov = t.name === 'sovereign';
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
          {['AUTO', 'MANUAL', 'TARGET SoC'].map((m, i) => {
            const active = m === 'AUTO';
            return (
              <button key={m} style={{
                flex: 1, padding: '8px 6px',
                background: active ? t.text : 'transparent',
                color: active ? t.bg : t.textMid,
                border: 'none',
                borderRight: i < 2 ? `1px solid ${t.border}` : 'none',
                fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700,
                letterSpacing: 0.15, textTransform: 'uppercase', cursor: 'pointer',
              }}>{m}</button>
            );
          })}
        </div>
      </div>

      {/* P/Q setpoints — disabled because mode is AUTO */}
      <div style={{ padding: `0 ${SPACE[3]}px ${SPACE[2]}px`, opacity: 0.4 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {['Active P (kW)', 'Reactive Q (kVAR)'].map(lab => (
            <div key={lab}>
              <div style={{
                fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.18,
                color: t.textSoft, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4,
              }}>{lab}</div>
              <div style={{
                height: 32, border: `1px solid ${t.border}`, borderRadius: RADIUS[2],
                padding: '0 8px', display: 'flex', alignItems: 'center',
                fontFamily: t.fontLabel, fontSize: 13, color: t.textMid, background: t.surface,
              }}>—</div>
            </div>
          ))}
        </div>
        <div style={{
          fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft, marginTop: 4,
          letterSpacing: 0.1, textTransform: 'uppercase',
        }}>Setpoints available in MANUAL mode</div>
      </div>

      {/* Action row */}
      <div style={{
        borderTop: `1px solid ${t.border}`,
        padding: `${SPACE[2]}px ${SPACE[3]}px`,
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      }}>
        <button style={{
          flex: 1, minWidth: 110,
          height: 36, padding: '0 12px',
          background: 'transparent', color: t.text,
          border: `1px solid ${t.border}`, borderRadius: RADIUS[2],
          fontFamily: t.fontLabel, fontSize: 11, fontWeight: 700, letterSpacing: 0.15,
          textTransform: 'uppercase', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <IconWrench size={13} color={t.text}/>Maintenance
        </button>
        <button style={{
          flex: 1, minWidth: 110,
          height: 36, padding: '0 12px',
          background: t.statusAlarm + '14', color: t.statusAlarm,
          border: `1px solid ${t.statusAlarm}66`, borderRadius: RADIUS[2],
          fontFamily: t.fontLabel, fontSize: 11, fontWeight: 700, letterSpacing: 0.15,
          textTransform: 'uppercase', cursor: 'pointer',
        }}>Fault Reset</button>
      </div>
      <div style={{
        padding: `${SPACE[2]}px ${SPACE[3]}px`,
        borderTop: `1px solid ${t.borderSoft}`,
        fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft,
        letterSpacing: 0.1, textTransform: 'uppercase',
      }}>All commands require confirmation</div>
    </div>
  );
}

// ─── Composed screen ───
function BessDetailScreen({ t }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: t.bg }}>
      <BessTopBar t={t}/>
      <StatusStrip t={t}/>
      <div style={{ flex: 1, paddingBottom: SPACE[4] }}>
        <HeroPanel t={t}/>

        <SectionHead t={t} title="State of charge · 24h"/>
        <Panel t={t}><SocTrend t={t}/></Panel>

        <SectionHead t={t} title="Cell spread" meta="142 mV"/>
        <Panel t={t}><CellHistogram t={t}/></Panel>

        <SectionHead t={t} title="Alarms"/>
        <AlarmsBlock t={t}/>

        <SectionHead t={t} title="Thermal sensors"/>
        <ThermalRows t={t}/>

        <ControlsPanel t={t}/>
      </div>
    </div>
  );
}

window.BessDetailScreen = BessDetailScreen;
// Expose data + key visuals so the desktop layout can reuse them without duplication.
Object.assign(window, {
  BESS_DATA: BESS,
  BESS_SOC_TREND: SOC_TREND,
  BESS_CELL_BINS: CELL_BINS,
  BESS_ACTIVE_ALARMS: ACTIVE_ALARMS,
  BESS_RECENT_CLEARED: RECENT_CLEARED,
  BESS_THERMAL_SENSORS: THERMAL_SENSORS,
});
