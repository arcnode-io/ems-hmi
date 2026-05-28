// bess-detail-desktop.jsx — BESS module detail (`/modules/bess/:id`) at desktop breakpoint.
// Spec: ems-hmi-ia-brief.md §6.2 BESS detail · §7.7 desktop adaptation.
//
// Designed for BESS-02 in alarm state (voltage spread fault) — same scenario as
// the mobile screen so reviewers can read the breakpoints side-by-side.
//
// Layout (1440px content area minus 220px sidebar = 1220px work area):
//   ┌─ page header (back · name · sub · alarm pill · live · actions) ────┐
//   ├─ left rail (320) ─┬─ center (flex) ────────────┬─ right rail (340) ┤
//   │  hero: SoC ring   │  SoC trend · 24h           │  Active alarms    │
//   │  vitals stack     │  Cell voltage histogram    │  Recent cleared   │
//   │                   │                            │  Thermal sensors  │
//   └───────────────────┴─ controls (full width) ────┴───────────────────┘

const B = window.BESS_DATA;
const BSOC = window.BESS_SOC_TREND;
const BBINS = window.BESS_CELL_BINS;
const BALM = window.BESS_ACTIVE_ALARMS;
const BCLR = window.BESS_RECENT_CLEARED;
const BTHM = window.BESS_THERMAL_SENSORS;

// ─── Page header ──────────────────────────────────────────────────
function BessDeskHeader({ t, density }) {
  const isSov = t.name === 'sovereign';
  const dense = density === 'dense';
  return (
    <div style={{
      padding: `${dense ? 14 : 18}px ${SPACE[5]}px`,
      borderBottom: `1px solid ${t.border}`,
      background: t.bg,
      display: 'flex', alignItems: 'center', gap: SPACE[4], flexShrink: 0,
    }}>
      <button style={{
        background: 'transparent', border: 'none', padding: 0, width: 28, height: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      }}>
        <IconChevron size={20} color={t.textMid} dir="left"/>
      </button>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: t.fontHeading, fontSize: 28, lineHeight: 1.1,
          letterSpacing: isSov ? 0.5 : 0, fontWeight: isSov ? 400 : 500,
          color: t.text, textTransform: isSov ? 'uppercase' : 'none', whiteSpace: 'nowrap',
        }}>{B.name}</div>
        <div style={{
          fontFamily: t.fontLabel, fontSize: 10, letterSpacing: 0.18,
          color: t.textSoft, marginTop: 2, textTransform: 'uppercase',
        }}>{B.sub} · /modules/bess/{B.id}</div>
      </div>

      {/* alarm pill */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 10px', borderRadius: RADIUS[2],
        background: t.statusAlarm + '18',
        border: `1px solid ${t.statusAlarm}`,
        color: t.statusAlarm,
        fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700, letterSpacing: 0.18,
        textTransform: 'uppercase',
      }}>
        <IconAlarm size={11} color={t.statusAlarm}/>
        Alarm · BMS-2104
      </div>

      <div style={{ flex: 1 }}/>

      {/* live + age */}
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
        <div style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft, letterSpacing: 0.1, marginTop: 2 }}>
          AUTO · operating mode
        </div>
      </div>

      {/* secondary actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={btnGhost(t)}>Audit log</button>
        <button style={btnGhost(t)}>Export CSV</button>
      </div>
    </div>
  );
}
function btnGhost(t) {
  return {
    background: 'transparent', border: `1px solid ${t.border}`, color: t.textMid,
    padding: '6px 12px', borderRadius: RADIUS[2],
    fontFamily: t.fontLabel, fontSize: 11, fontWeight: 600, letterSpacing: 0.05,
    cursor: 'pointer', whiteSpace: 'nowrap',
  };
}

// ─── Hero panel: SoC ring + state band ────────────────────────────
function HeroDeskPanel({ t }) {
  const isSov = t.name === 'sovereign';
  const socColor = B.soc <= B.socThresholds.alarm ? t.statusAlarm
                  : B.soc <= B.socThresholds.warn ? t.statusWarn
                  : t.colorBess;
  return (
    <div style={{
      background: t.panel, border: `1px solid ${t.border}`,
      borderRadius: RADIUS[3], padding: SPACE[4],
      display: 'flex', flexDirection: 'column', gap: SPACE[4],
    }}>
      {/* big SoC ring */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <DeskSoc t={t} value={B.soc} color={socColor} size={172}/>
        <div style={{
          fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700, letterSpacing: 0.22,
          color: t.textSoft, textTransform: 'uppercase', marginTop: SPACE[2],
        }}>State of charge</div>
        <div style={{
          marginTop: 6,
          fontFamily: t.fontLabel, fontSize: 11, color: t.textMid, letterSpacing: 0.05,
        }}>
          <span style={{ color: t.statusAlarm, fontWeight: 700 }}>−42 kW</span> · DSCH · 9.3 h to floor
        </div>
      </div>

      <div style={{ height: 1, background: t.border }}/>

      {/* vitals grid 2×3 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACE[3] }}>
        <Vital t={t} label="Pack V (DC)" value="798.4" unit="V" sub="384 cells"/>
        <Vital t={t} label="Current"     value="−52.6" unit="A" sub="discharge"/>
        <Vital t={t} label="SoH"         value="96.2"  unit="%" sub="↓ 0.4 / 30d"/>
        <Vital t={t} label="Cycles"      value="1,184" unit=""  sub="EOL 6,000"/>
        <Vital t={t} label="Run mode"    value="AUTO"  unit=""  sub="grid-following"/>
        <Vital t={t} label="Online"      value="62"    unit="d" sub="since cmm-fw 1.4"/>
      </div>
    </div>
  );
}
function Vital({ t, label, value, unit, sub }) {
  return (
    <div>
      <div style={{
        fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700, letterSpacing: 0.18,
        color: t.textSoft, textTransform: 'uppercase',
      }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
        <span style={{
          fontFamily: t.fontLabel, fontSize: 18, fontWeight: 600, color: t.text,
          letterSpacing: -0.3, whiteSpace: 'nowrap',
        }}>{value}</span>
        {unit && (
          <span style={{ fontFamily: t.fontLabel, fontSize: 11, color: t.textMid, fontWeight: 500 }}>{unit}</span>
        )}
      </div>
      <div style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft, letterSpacing: 0.1, marginTop: 2 }}>
        {sub}
      </div>
    </div>
  );
}
function DeskSoc({ t, value, color, size }) {
  const stroke = 14;
  const r = size / 2 - stroke / 2 - 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - value / 100);
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke={t.border} strokeWidth={stroke}/>
      <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={stroke}
              strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off}
              transform={`rotate(-90 ${c} ${c})`}/>
      <text x={c} y={c + 8} textAnchor="middle"
            fontFamily={t.fontLabel} fontSize={42} fontWeight={600}
            fill={t.text} letterSpacing="-1.5">{value}<tspan fontSize={20} fill={t.textMid} dx={2}>%</tspan></text>
    </svg>
  );
}

// ─── SoC trend (desktop — big) ────────────────────────────────────
function SocTrendDesk({ t }) {
  const W = 760, H = 220, padL = 44, padR = 14, padT = 16, padB = 28;
  const min = 60, max = 90;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const x = i => padL + (i / (BSOC.length - 1)) * innerW;
  const y = v => padT + (1 - (v - min) / (max - min)) * innerH;
  const pts = BSOC.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const area = `${padL},${padT + innerH} ${pts} ${padL + innerW},${padT + innerH}`;

  // y-axis ticks
  const ticks = [60, 70, 80, 90];
  const xticks = [0, 6, 12, 18, 23];
  const xlab = ['00:00', '06:00', '12:00', '18:00', '23:00'];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: SPACE[2] }}>
        <div>
          <div style={{
            fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700, letterSpacing: 0.2,
            color: t.textSoft, textTransform: 'uppercase',
          }}>State of charge</div>
          <div style={{ fontFamily: t.fontHeading, fontSize: 18, color: t.text, marginTop: 2,
                        fontWeight: t.name === 'sovereign' ? 400 : 500 }}>24-hour trend</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['1h', '24h', '7d', '30d'].map((p, i) => (
            <span key={p} style={{
              padding: '4px 10px', borderRadius: RADIUS[2],
              border: `1px solid ${i === 1 ? t.accent : t.border}`,
              background: i === 1 ? t.accentFaint : 'transparent',
              color: i === 1 ? t.accent : t.textMid,
              fontFamily: t.fontLabel, fontSize: 10, fontWeight: 600, letterSpacing: 0.1,
              cursor: 'pointer',
            }}>{p}</span>
          ))}
        </div>
      </div>
      <svg width={W} height={H} style={{ display: 'block', maxWidth: '100%' }}>
        {/* grid */}
        {ticks.map(v => (
          <g key={v}>
            <line x1={padL} x2={padL + innerW} y1={y(v)} y2={y(v)}
                  stroke={t.borderSoft} strokeDasharray="2 4"/>
            <text x={padL - 8} y={y(v) + 4} textAnchor="end"
                  fontFamily={t.fontLabel} fontSize={10} fill={t.textSoft}>{v}%</text>
          </g>
        ))}
        {/* area */}
        <polygon points={area} fill={t.colorBess + '22'}/>
        {/* line */}
        <polyline points={pts} fill="none" stroke={t.colorBess} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round"/>
        {/* now marker */}
        <line x1={x(BSOC.length - 1)} x2={x(BSOC.length - 1)} y1={padT} y2={padT + innerH}
              stroke={t.accent} strokeWidth={1.5} strokeDasharray="3 3"/>
        <circle cx={x(BSOC.length - 1)} cy={y(BSOC[BSOC.length - 1])} r={4.5}
                fill={t.colorBess} stroke={t.panel} strokeWidth={2}/>
        <rect x={x(BSOC.length - 1) - 22} y={padT - 2} width={44} height={14} rx={2}
              fill={t.accent}/>
        <text x={x(BSOC.length - 1)} y={padT + 8} textAnchor="middle"
              fontFamily={t.fontLabel} fontSize={9} fontWeight={700} fill="#fff" letterSpacing="0.1em">NOW</text>
        {/* x labels */}
        {xticks.map((i, k) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor="middle"
                fontFamily={t.fontLabel} fontSize={10} fill={t.textSoft}>{xlab[k]}</text>
        ))}
      </svg>
    </div>
  );
}

// ─── Cell voltage histogram (desktop — bigger, with thresholds) ──
function CellHistDesk({ t }) {
  const W = 760, H = 220, padL = 44, padR = 14, padT = 18, padB = 36;
  const max = Math.max(...BBINS.map(b => b[1]));
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const barW = innerW / BBINS.length - 4;

  // alarmed bin = leftmost (3.28 V)
  // threshold lines at 3.34 (warn) and 3.30 (alarm) — for label voltages
  const xV = v => {
    const minV = 3.28, maxV = 3.50;
    return padL + ((v - minV) / (maxV - minV)) * innerW;
  };
  const labelTicks = [3.30, 3.35, 3.40, 3.45, 3.50];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: SPACE[2] }}>
        <div>
          <div style={{
            fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700, letterSpacing: 0.2,
            color: t.textSoft, textTransform: 'uppercase',
          }}>Cell voltage</div>
          <div style={{ fontFamily: t.fontHeading, fontSize: 18, color: t.text, marginTop: 2,
                        fontWeight: t.name === 'sovereign' ? 400 : 500 }}>
            384-cell distribution · spread <span style={{ color: t.statusAlarm }}>142 mV</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: SPACE[3], fontFamily: t.fontLabel, fontSize: 10 }}>
          <Stat t={t} label="Min"    val="3.28 V" color={t.statusAlarm}/>
          <Stat t={t} label="Median" val="3.42 V"/>
          <Stat t={t} label="Max"    val="3.46 V"/>
        </div>
      </div>
      <svg width={W} height={H} style={{ display: 'block', maxWidth: '100%' }}>
        {/* y-axis */}
        {[0, 50, 100, 150].map(v => (
          <g key={v}>
            <line x1={padL} x2={padL + innerW}
                  y1={padT + innerH - (v / max) * innerH}
                  y2={padT + innerH - (v / max) * innerH}
                  stroke={t.borderSoft} strokeDasharray="2 4"/>
            <text x={padL - 8} y={padT + innerH - (v / max) * innerH + 4} textAnchor="end"
                  fontFamily={t.fontLabel} fontSize={10} fill={t.textSoft}>{v}</text>
          </g>
        ))}
        {/* threshold lines */}
        <line x1={xV(3.30)} x2={xV(3.30)} y1={padT} y2={padT + innerH}
              stroke={t.statusAlarm} strokeWidth={1.5} strokeDasharray="4 3"/>
        <line x1={xV(3.34)} x2={xV(3.34)} y1={padT} y2={padT + innerH}
              stroke={t.statusWarn} strokeWidth={1.5} strokeDasharray="4 3"/>
        <text x={xV(3.30) + 4} y={padT + 10} fontFamily={t.fontLabel} fontSize={9}
              fill={t.statusAlarm} fontWeight={700} letterSpacing="0.1em">ALARM &lt; 3.30 V</text>
        <text x={xV(3.34) + 4} y={padT + 10} fontFamily={t.fontLabel} fontSize={9}
              fill={t.statusWarn} fontWeight={700} letterSpacing="0.1em">WARN &lt; 3.34 V</text>
        {/* bars */}
        {BBINS.map((b, i) => {
          const h = (b[1] / max) * innerH;
          const xb = padL + (i / BBINS.length) * innerW + 2;
          const yb = padT + innerH - h;
          const isAlarm = i === 0;
          return (
            <g key={b[0]}>
              <rect x={xb} y={yb} width={barW} height={h}
                    fill={isAlarm ? t.statusAlarm : t.colorBess}
                    rx={1.5}/>
              {b[1] > 0 && (
                <text x={xb + barW / 2} y={yb - 4} textAnchor="middle"
                      fontFamily={t.fontLabel} fontSize={9}
                      fill={isAlarm ? t.statusAlarm : t.textMid} fontWeight={isAlarm ? 700 : 400}>
                  {b[1]}
                </text>
              )}
            </g>
          );
        })}
        {/* alarmed-bin location callout — pins the 4 cells to a string/module */}
        {(() => {
          const bx = padL + 2 + barW / 2;       // mid of bar 0
          const by = padT + innerH - (BBINS[0][1] / max) * innerH; // top of bar 0
          const cx = padL + 6, cy = padT + 30, cw = 168, ch = 36;
          return (
            <g>
              <line x1={bx} y1={by - 1} x2={cx + 32} y2={cy + ch}
                    stroke={t.statusAlarm} strokeWidth={1} strokeDasharray="2 2"/>
              <rect x={cx} y={cy} width={cw} height={ch} rx={3}
                    fill={t.statusAlarm + '14'} stroke={t.statusAlarm} strokeWidth={1}/>
              <text x={cx + 8} y={cy + 14} fontFamily={t.fontLabel} fontSize={10}
                    fontWeight={700} fill={t.statusAlarm} letterSpacing="0.06em">
                4 CELLS · STR-3 MOD-7
              </text>
              <text x={cx + 8} y={cy + 28} fontFamily={t.fontLabel} fontSize={10}
                    fill={t.text} letterSpacing="0.04em">
                c41 · c43 · c44 · c47
              </text>
            </g>
          );
        })()}
        {/* x labels (every other bin) */}
        {BBINS.map((b, i) => i % 2 === 0 && (
          <text key={`l${i}`} x={padL + (i / BBINS.length) * innerW + barW / 2 + 2}
                y={padT + innerH + 14} textAnchor="middle"
                fontFamily={t.fontLabel} fontSize={9} fill={t.textSoft}>{b[0]}</text>
        ))}
        <text x={padL + innerW / 2} y={H - 6} textAnchor="middle"
              fontFamily={t.fontLabel} fontSize={9} fill={t.textSoft}
              letterSpacing="0.18em">CELL VOLTAGE · V</text>
      </svg>
    </div>
  );
}
function Stat({ t, label, val, color }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.18, color: t.textSoft,
                    textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: color || t.text, marginTop: 1 }}>{val}</div>
    </div>
  );
}

// ─── Active alarms panel ──────────────────────────────────────────
function AlarmsDesk({ t }) {
  return (
    <div style={{
      background: t.panel, border: `1px solid ${t.border}`,
      borderRadius: RADIUS[3], padding: SPACE[4],
      display: 'flex', flexDirection: 'column', gap: SPACE[3],
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700,
                      letterSpacing: 0.2, color: t.textSoft, textTransform: 'uppercase' }}>
          Active alarms · {BALM.length}
        </div>
        <div style={{ fontFamily: t.fontLabel, fontSize: 10, color: t.textSoft, letterSpacing: 0.1 }}>
          1 unack
        </div>
      </div>
      {BALM.map(a => (
        <div key={a.code} style={{
          display: 'flex', flexDirection: 'column', gap: 6,
          padding: SPACE[3], borderRadius: RADIUS[2],
          background: t.statusAlarm + '10',
          borderLeft: `3px solid ${t.statusAlarm}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconAlarm size={14} color={t.statusAlarm}/>
            <span style={{ fontFamily: t.fontLabel, fontSize: 11, fontWeight: 700, letterSpacing: 0.15,
                            color: t.statusAlarm, textTransform: 'uppercase' }}>{a.code}</span>
            <span style={{ flex: 1 }}/>
            <span style={{ fontFamily: t.fontLabel, fontSize: 10, color: t.textSoft }}>{a.age}</span>
          </div>
          <div style={{ fontFamily: t.fontBody, fontSize: 13, color: t.text, fontWeight: 600 }}>{a.name}</div>
          <div style={{ fontFamily: t.fontLabel, fontSize: 11, color: t.textMid, letterSpacing: 0.05 }}>
            {a.detail}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <button style={{
              flex: 1,
              background: t.statusAlarm, color: '#fff', border: 'none',
              padding: '6px 10px', borderRadius: RADIUS[2],
              fontFamily: t.fontLabel, fontSize: 11, fontWeight: 700, letterSpacing: 0.12,
              textTransform: 'uppercase', cursor: 'pointer',
            }}>Acknowledge</button>
            <button style={btnGhost(t)}>Runbook</button>
          </div>
        </div>
      ))}

      {/* recent cleared */}
      <div style={{ height: 1, background: t.border }}/>
      <div style={{ fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700,
                    letterSpacing: 0.2, color: t.textSoft, textTransform: 'uppercase' }}>
        Recent cleared
      </div>
      {BCLR.map(a => (
        <div key={a.code} style={{ opacity: 0.75 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconWarning size={12} color={t.statusWarn}/>
            <span style={{ fontFamily: t.fontLabel, fontSize: 11, color: t.textMid, letterSpacing: 0.1,
                            fontWeight: 600 }}>{a.code}</span>
            <span style={{ flex: 1, fontFamily: t.fontBody, fontSize: 12, color: t.textMid,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</span>
            <span style={{ fontFamily: t.fontLabel, fontSize: 10, color: t.textSoft }}>{a.cleared}</span>
          </div>
          {(a.peak || a.cause) && (
            <div style={{ fontFamily: t.fontLabel, fontSize: 10, color: t.textSoft, letterSpacing: 0.05,
                          marginLeft: 20, marginTop: 2, lineHeight: 1.3 }}>
              {a.peak}{a.peak && a.cause ? ' · ' : ''}{a.cause}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Thermal sensors (right rail) ─────────────────────────────────
function ThermalDesk({ t }) {
  return (
    <div style={{
      background: t.panel, border: `1px solid ${t.border}`,
      borderRadius: RADIUS[3], padding: SPACE[4],
      display: 'flex', flexDirection: 'column', gap: SPACE[3],
    }}>
      <div style={{ fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700,
                    letterSpacing: 0.2, color: t.textSoft, textTransform: 'uppercase' }}>
        Thermal sensors
      </div>
      {BTHM.map(s => (
        <SensorRow key={s.id} t={t} s={s}/>
      ))}
    </div>
  );
}
function SensorRow({ t, s }) {
  // mini sparkline
  const W = 96, H = 22;
  const min = Math.min(...s.spark);
  const max = Math.max(...s.spark);
  const range = max - min || 1;
  const pts = s.spark.map((v, i) =>
    `${(i / (s.spark.length - 1)) * W},${H - ((v - min) / range) * (H - 4) - 2}`
  ).join(' ');
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', gap: SPACE[3] }}>
      <div>
        <div style={{ fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700, letterSpacing: 0.18,
                      color: t.textSoft, textTransform: 'uppercase' }}>{s.id}</div>
        <div style={{ fontFamily: t.fontBody, fontSize: 12, color: t.text, marginTop: 1 }}>{s.label}</div>
      </div>
      <svg width={W} height={H}>
        <polyline points={pts} fill="none" stroke={t.colorThermal || t.colorGrid} strokeWidth={1.5} strokeLinejoin="round"/>
      </svg>
      <div style={{ textAlign: 'right', fontFamily: t.fontLabel, fontSize: 14, fontWeight: 600,
                    color: t.text, whiteSpace: 'nowrap', letterSpacing: -0.2 }}>
        {s.v}<span style={{ fontSize: 10, color: t.textMid, marginLeft: 2 }}>{s.u}</span>
      </div>
    </div>
  );
}

// ─── Controls panel (bottom, full width) ──────────────────────────
function ControlsDesk({ t }) {
  const isSov = t.name === 'sovereign';
  return (
    <div style={{
      background: t.panel, border: `1px solid ${t.border}`,
      borderRadius: RADIUS[3], padding: SPACE[4],
      display: 'flex', alignItems: 'center', gap: SPACE[4],
    }}>
      <div style={{ minWidth: 200 }}>
        <div style={{ fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700,
                      letterSpacing: 0.2, color: t.textSoft, textTransform: 'uppercase' }}>
          Controls
        </div>
        <div style={{ fontFamily: t.fontBody, fontSize: 13, color: t.textMid, marginTop: 4, lineHeight: 1.4 }}>
          Read-only in SIM. Switch to LIVE deployment to enable.
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: SPACE[2], flexWrap: 'wrap' }}>
        {[
          { label: 'Set mode',     sub: 'AUTO / MANUAL / STANDBY' },
          { label: 'Power setpoint', sub: '−2 MW … +2 MW' },
          { label: 'Charge limit', sub: 'SoC ceiling' },
          { label: 'Discharge limit', sub: 'SoC floor' },
        ].map(b => (
          <div key={b.label} style={{
            flex: '1 0 180px',
            padding: `${SPACE[2]}px ${SPACE[3]}px`,
            border: `1px solid ${t.border}`,
            borderRadius: RADIUS[2],
            background: t.bg,
            opacity: 0.55,
            cursor: 'not-allowed',
          }}>
            <div style={{ fontFamily: t.fontBody, fontSize: 13, color: t.text, fontWeight: 600 }}>{b.label}</div>
            <div style={{ fontFamily: t.fontLabel, fontSize: 10, color: t.textSoft, letterSpacing: 0.05, marginTop: 2 }}>{b.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: RADIUS.full,
          background: t.bg, border: `1px solid ${t.border}`,
          fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700, letterSpacing: 0.18,
          color: t.textMid, textTransform: 'uppercase',
        }}>
          🔒 LOTO required
        </div>
        <div style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft, letterSpacing: 0.1 }}>
          Last cmd: 2026-04-02 by ops-sup
        </div>
      </div>
    </div>
  );
}

// ─── Body assembly ────────────────────────────────────────────────
function BessDeskBody({ t, density }) {
  const PAD = density === 'dense' ? SPACE[4] : SPACE[5];
  const GAP = density === 'dense' ? SPACE[3] : SPACE[4];
  return (
    <div style={{
      flex: 1, overflow: 'auto', minHeight: 0,
      padding: PAD, background: t.bg,
      display: 'grid', gridTemplateColumns: '320px 1fr 340px',
      gridTemplateRows: 'auto auto',
      gridTemplateAreas: `
        "left center right"
        "left controls right"
      `,
      gap: GAP,
      alignItems: 'start',
    }}>
      <div style={{ gridArea: 'left', display: 'flex', flexDirection: 'column', gap: GAP }}>
        <HeroDeskPanel t={t}/>
      </div>
      <div style={{ gridArea: 'center', display: 'flex', flexDirection: 'column', gap: GAP }}>
        <div style={{
          background: t.panel, border: `1px solid ${t.border}`,
          borderRadius: RADIUS[3], padding: SPACE[4],
        }}>
          <SocTrendDesk t={t}/>
        </div>
        <div style={{
          background: t.panel, border: `1px solid ${t.border}`,
          borderRadius: RADIUS[3], padding: SPACE[4],
        }}>
          <CellHistDesk t={t}/>
        </div>
      </div>
      <div style={{ gridArea: 'right', display: 'flex', flexDirection: 'column', gap: GAP }}>
        <AlarmsDesk t={t}/>
        <ThermalDesk t={t}/>
      </div>
      <div style={{ gridArea: 'controls' }}>
        <ControlsDesk t={t}/>
      </div>
    </div>
  );
}

// ─── Public entry ─────────────────────────────────────────────────
function BessDetailDesktopBody({ t, density }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
      <BessDeskHeader t={t} density={density}/>
      <BessDeskBody t={t} density={density}/>
    </div>
  );
}

window.BessDetailDesktopBody = BessDetailDesktopBody;
