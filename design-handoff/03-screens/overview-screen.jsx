// overview-screen.jsx — Overview (`/`) at phone breakpoint.
// Spec source: ems-hmi-ia-brief.md §6.1 "Overview" + §5.1 "Persistent Chrome" + §7.6 "Mobile Layout".

const { useState, useEffect, useMemo } = React;

// ─── Top app bar (deployment / sim-live / alarm bell / avatar) ───
function TopBar({ t }) {
  const isSov = t.name === 'sovereign';
  return (
    <div style={{
      padding: `10px ${SPACE[4]}px 10px`,
      borderBottom: `1px solid ${t.border}`,
      background: t.bg,
      display: 'flex', alignItems: 'center', gap: SPACE[3],
      flexShrink: 0,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: t.fontHeading,
          fontSize: 20,
          lineHeight: 1.15,
          letterSpacing: isSov ? 0.5 : 0,
          fontWeight: isSov ? 400 : 500,
          color: t.text,
          textTransform: isSov ? 'uppercase' : 'none',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>Brookside DC-1</div>
        <div style={{
          fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.15,
          color: t.textSoft, marginTop: 1, textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>Site overview</div>
      </div>

      {/* SIM/LIVE pill */}
      <div style={{
        height: 20, padding: '0 7px',
        borderRadius: RADIUS[2],
        background: t.statusOk + '20',
        border: `1px solid ${t.statusOk}`,
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontFamily: t.fontLabel, fontSize: 9, fontWeight: 600, letterSpacing: 0.18,
        color: t.statusOk, textTransform: 'uppercase',
        flexShrink: 0,
      }}>
        <span style={{
          width: 5, height: 5, borderRadius: '50%', background: t.statusOk,
        }}/>
        Live
      </div>

      {/* Alarm bell with count */}
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

      {/* Avatar */}
      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        background: t.accent, color: isSov ? '#fff' : '#fff',
        fontFamily: t.fontLabel, fontSize: 11, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>RM</div>
    </div>
  );
}

// ─── Persistent status strip ───
function StatusStrip({ t }) {
  // health | bess | compute | grid
  const items = [
    { label: 'SITE',     value: 'Nominal', color: t.statusOk, dot: true },
    { label: 'FLEET SoC', value: '74%',    color: t.colorBess },
    { label: 'GPU UTIL',  value: '88%',    color: t.colorCompute },
    { label: 'GRID',      value: 'Import', color: t.colorGrid },
  ];
  return (
    <div style={{
      height: 38, display: 'flex',
      borderBottom: `1px solid ${t.border}`,
      background: t.panel,
      flexShrink: 0,
    }}>
      {items.map((it, i) => (
        <div key={it.label} style={{
          flex: 1,
          borderRight: i < items.length - 1 ? `1px solid ${t.border}` : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 6, padding: '0 4px', minWidth: 0,
        }}>
          {it.dot && (
            <span style={{
              width: 7, height: 7, borderRadius: '50%', background: it.color,
              boxShadow: `0 0 0 3px ${it.color}25`,
              flexShrink: 0,
            }}/>
          )}
          <span style={{
            fontFamily: t.fontLabel, fontSize: 9, fontWeight: 600, letterSpacing: 0.15,
            color: t.textSoft, textTransform: 'uppercase',
          }}>{it.label}</span>
          <span style={{
            fontFamily: t.fontLabel, fontSize: 12, fontWeight: 600,
            color: i === 0 ? it.color : t.text,
            whiteSpace: 'nowrap',
          }}>{it.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Zone A — site health bar ───
function HealthBar({ t }) {
  return (
    <div style={{
      margin: `${SPACE[3]}px ${SPACE[4]}px 0`,
      padding: `${SPACE[3]}px ${SPACE[4]}px`,
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderLeft: `3px solid ${t.statusOk}`,
      borderRadius: RADIUS[3],
      display: 'flex', alignItems: 'center', gap: SPACE[3],
    }}>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: t.fontLabel, fontSize: 10, letterSpacing: 0.15,
          color: t.statusOk, textTransform: 'uppercase', fontWeight: 600,
        }}>All systems nominal</div>
        <div style={{
          fontFamily: t.fontBody, fontSize: 12,
          color: t.textMid, marginTop: 2, lineHeight: 1.35,
        }}>17 modules online · 2 active warnings</div>
      </div>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: t.statusOk + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <IconCheck size={18} color={t.statusOk}/>
      </div>
    </div>
  );
}

// ─── Zone B — GPU cluster strip ───
// 32 servers, colored by util on a green→amber→red ramp using compute-color, NOT status colors
function gpuColor(util, t) {
  // util 0..100. Use compute color for the OK band; warn/alarm only at extreme cases
  // but per IA brief: this is utilization, not alarm — so we ramp on a non-alarm scale.
  // Build ramp: low = colorCompute dim, mid = colorCompute, high = colorCompute saturated.
  // For very-low (<10) treat as idle gray.
  if (util < 5) return t.textFaint;
  if (util < 30) return t.colorCompute + 'aa';
  if (util < 70) return t.colorCompute;
  if (util < 90) return t.colorCompute;
  return t.colorCompute;
}
// Realistic-feeling utilization data
const GPU_SERVERS = [
  92, 94, 91, 89, 95, 93, 92, 88,
  90, 87, 91, 93, 96, 94, 89, 92,
  88, 91, 86, 90, 0, 0, 4, 12,
  85, 88, 87, 91, 72, 68, 71, 74,
];

function GpuClusterStrip({ t }) {
  const isSov = t.name === 'sovereign';
  const cellW = 26, cellH = 32, gap = 4;
  const totalKw = 184.2;
  const avgUtil = Math.round(GPU_SERVERS.reduce((s, x) => s + x, 0) / GPU_SERVERS.length);
  const headroom = 38.5;

  return (
    <div style={{
      margin: `${SPACE[3]}px ${SPACE[4]}px 0`,
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: RADIUS[3],
      overflow: 'hidden',
    }}>
      {/* heading row */}
      <div style={{
        padding: `${SPACE[3]}px ${SPACE[4]}px ${SPACE[2]}px`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: SPACE[3],
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.18,
            color: t.textSoft, textTransform: 'uppercase', fontWeight: 600,
            whiteSpace: 'nowrap',
          }}>Compute · 32 servers</div>
          <div style={{
            fontFamily: t.fontHeading, fontSize: 18, lineHeight: 1.2,
            color: t.text, marginTop: 3, paddingBottom: 2,
            textTransform: isSov ? 'uppercase' : 'none',
            letterSpacing: isSov ? 0.5 : 0,
            fontWeight: isSov ? 400 : 500,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>Cluster utilization</div>
        </div>
        <IconChevron size={18} color={t.textSoft}/>
      </div>

      {/* the strip — full width, scrolls horizontally if needed */}
      <div style={{
        padding: `0 ${SPACE[4]}px ${SPACE[3]}px`,
        overflowX: 'auto', overflowY: 'hidden',
        scrollbarWidth: 'none', msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
      }}>
        <div style={{
          display: 'flex', gap, paddingTop: 2,
        }}>
          {GPU_SERVERS.map((util, i) => {
            const c = gpuColor(util, t);
            return (
              <div key={i} title={`s${i+1} · ${util}%`}
                   style={{
                     width: cellW, height: cellH,
                     borderRadius: RADIUS[2],
                     background: util < 5 ? t.borderSoft : c,
                     position: 'relative', flexShrink: 0,
                     opacity: util < 5 ? 0.55 : (0.55 + (util / 100) * 0.45),
                     border: `1px solid ${util < 5 ? t.border : 'transparent'}`,
                   }}>
                {/* fill bar at top representing util */}
                <div style={{
                  position: 'absolute', left: 3, right: 3, top: 3,
                  height: 3, borderRadius: 1.5,
                  background: util < 5 ? t.textFaint : '#fff',
                  opacity: 0.85,
                  width: `calc((100% - 6px) * ${util / 100})`,
                }}/>
                <div style={{
                  position: 'absolute', bottom: 4, left: 0, right: 0,
                  textAlign: 'center',
                  fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700,
                  color: util < 5 ? t.textSoft : '#fff',
                  letterSpacing: 0,
                }}>{util < 5 ? '—' : util}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* metrics row */}
      <div style={{
        borderTop: `1px solid ${t.borderSoft}`,
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
      }}>
        {[
          { label: 'Total draw', value: `${totalKw.toFixed(1)}`, unit: 'kW' },
          { label: 'Avg util',   value: `${avgUtil}`,            unit: '%' },
          { label: 'Headroom',   value: `${headroom.toFixed(1)}`, unit: 'kW' },
        ].map((m, i) => (
          <div key={m.label} style={{
            padding: `${SPACE[2]}px ${SPACE[3]}px`,
            borderRight: i < 2 ? `1px solid ${t.borderSoft}` : 'none',
          }}>
            <div style={{
              fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.15,
              color: t.textSoft, textTransform: 'uppercase', fontWeight: 600,
            }}>{m.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 2 }}>
              <span style={{
                fontFamily: t.fontLabel, fontSize: 18, fontWeight: 400,
                color: t.text, letterSpacing: -0.3, lineHeight: 1.0,
              }}>{m.value}</span>
              <span style={{
                fontFamily: t.fontLabel, fontSize: 10, color: t.textMid,
              }}>{m.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Zone B2 — Cluster headroom (Power / Cooling / Runway) ───
function StrandedCapacity({ t }) {
  // Cooling = aggregate of per-Compute-module DLC headroom (worst module wins).
  // The constraint that fires first is the one that matters.
  const power   = 0.71;  // 184 / 260 kW
  const cooling = 0.78;  // worst CDU: 38.4 / 49 °C alarm threshold
  const runway  = 0.62;  // 6.2 h of 10 h max runway
  const worst = Math.max(power, cooling, runway);
  const state = worst < 0.85 ? 'BALANCED'
              : cooling >= power && cooling >= runway ? 'COOLING LIMITED'
              : power >= runway ? 'POWER LIMITED' : 'RUNWAY LIMITED';
  const color = state === 'BALANCED' ? t.statusOk : t.statusWarn;
  const rows = [
    { label: 'Power',   val: power,   color: t.colorCompute, headline: '184 / 260 kW',  sub: '76 kW headroom' },
    { label: 'Cooling', val: cooling, color: t.colorThermal, headline: '38.4 / 49 °C',  sub: 'worst CDU · s04' },
    { label: 'Runway',  val: runway,  color: t.colorBess,    headline: '6.2 h',          sub: 'at current load' },
  ];
  return (
    <div style={{
      margin: `${SPACE[3]}px ${SPACE[4]}px 0`,
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: RADIUS[3],
      padding: `${SPACE[3]}px ${SPACE[4]}px`,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: SPACE[2],
      }}>
        <span style={{
          fontFamily: t.fontLabel, fontSize: 10, letterSpacing: 0.15,
          color: t.textSoft, textTransform: 'uppercase', fontWeight: 600,
        }}>Cluster headroom</span>
        <span style={{
          fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700, letterSpacing: 0.2,
          color: color, textTransform: 'uppercase',
          padding: '2px 7px', borderRadius: RADIUS[2],
          background: color + '18', border: `1px solid ${color}55`,
        }}>{state}</span>
      </div>

      {/* three ratio bars */}
      {rows.map((r) => (
        <div key={r.label} style={{ marginTop: 6 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', gap: SPACE[2],
            fontFamily: t.fontLabel, fontSize: 11, color: t.textMid,
          }}>
            <span style={{ whiteSpace: 'nowrap' }}>{r.label}</span>
            <span style={{ color: t.text, whiteSpace: 'nowrap', fontWeight: 600 }}>{r.headline}</span>
          </div>
          <div style={{
            marginTop: 4, height: 5, borderRadius: 2.5,
            background: t.borderSoft, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              width: `${r.val * 100}%`, background: r.color, borderRadius: 2.5,
            }}/>
          </div>
        </div>
      ))}

      <div style={{
        fontFamily: t.fontBody, fontSize: 11,
        color: t.textSoft, marginTop: SPACE[3], lineHeight: 1.4,
      }}>Power and runway have headroom; cooling is the closest constraint (s04 CDU at 38.4 °C).</div>
    </div>
  );
}

// ─── Zone C — KPI strip (horizontal scroll) ───
function RadialGauge({ t, value, color, size = 68 }) {
  const r = size / 2 - 5;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle cx={c} cy={c} r={r} stroke={t.borderSoft} strokeWidth="4" fill="none"/>
      <circle cx={c} cy={c} r={r} stroke={color} strokeWidth="4" fill="none"
              strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
              transform={`rotate(-90 ${c} ${c})`}/>
    </svg>
  );
}

function KpiSpark({ t, color, points }) {
  // simple sparkline svg
  const W = 90, H = 28;
  const min = Math.min(...points), max = Math.max(...points);
  const xs = points.map((_, i) => (i / (points.length - 1)) * W);
  const ys = points.map(v => H - ((v - min) / (max - min || 1)) * H * 0.85 - 2);
  const d = points.map((_, i) => `${i === 0 ? 'M' : 'L'} ${xs[i].toFixed(2)} ${ys[i].toFixed(2)}`).join(' ');
  return (
    <svg width={W} height={H} style={{ display: 'block' }}>
      <path d={d} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function KpiStrip({ t }) {
  const isSov = t.name === 'sovereign';
  const cardStyle = {
    width: 200,
    padding: `${SPACE[3]}px ${SPACE[3]}px`,
    background: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: RADIUS[3],
    flexShrink: 0,
    boxSizing: 'border-box',
  };
  const labelStyle = {
    fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.18,
    color: t.textSoft, textTransform: 'uppercase', fontWeight: 600,
    whiteSpace: 'nowrap',
  };
  const valueStyle = {
    fontFamily: t.fontLabel, fontSize: 26, fontWeight: 400,
    color: t.text, letterSpacing: -0.5, lineHeight: 1.0,
  };

  return (
    <div style={{
      marginTop: SPACE[3],
      paddingLeft: SPACE[4], paddingRight: SPACE[4],
      overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none',
      WebkitOverflowScrolling: 'touch',
    }}>
      <div style={{ display: 'flex', gap: SPACE[3], paddingRight: SPACE[2] }}>
        {/* BESS SoC */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={labelStyle}>BESS SoC</span>
            <IconBess size={13} color={t.textSoft}/>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3], marginTop: SPACE[2] }}>
            <div style={{ position: 'relative', width: 60, height: 60, flexShrink: 0 }}>
              <RadialGauge t={t} value={74} color={t.colorBess} size={60}/>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: t.fontLabel, fontSize: 14, fontWeight: 600,
                color: t.text, letterSpacing: -0.2,
              }}>74%</div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft, textTransform: 'uppercase', letterSpacing: 0.18, fontWeight: 600, whiteSpace: 'nowrap' }}>Runway</div>
              <div style={{ fontFamily: t.fontLabel, fontSize: 17, color: t.text, marginTop: 2, whiteSpace: 'nowrap' }}>~6.2 h</div>
              <div style={{ fontFamily: t.fontBody, fontSize: 11, color: t.textMid, marginTop: 2, whiteSpace: 'nowrap' }}>at current load</div>
            </div>
          </div>
        </div>

        {/* Net power */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={labelStyle}>Net power</span>
            <IconBolt size={13} color={t.textSoft}/>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: SPACE[3] }}>
            <span style={{
              fontFamily: t.fontLabel, fontSize: 11, color: t.statusWarn, fontWeight: 700,
            }}>−</span>
            <span style={valueStyle}>184.2</span>
            <span style={{ fontFamily: t.fontLabel, fontSize: 12, color: t.textMid }}>kW</span>
          </div>
          <div style={{
            marginTop: SPACE[2],
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '2px 7px', borderRadius: RADIUS[2],
            background: t.statusWarn + '15',
            border: `1px solid ${t.statusWarn}55`,
          }}>
            <IconArrow size={10} color={t.statusWarn} dir="down"/>
            <span style={{
              fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700,
              color: t.statusWarn, letterSpacing: 0.18, textTransform: 'uppercase',
            }}>Consuming</span>
          </div>
          <div style={{ fontFamily: t.fontBody, fontSize: 11, color: t.textMid, marginTop: SPACE[2], whiteSpace: 'nowrap' }}>
            Grid 142 · BESS 42 · kW
          </div>
        </div>

        {/* PUE 24h */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={labelStyle}>PUE · 24h</span>
            <span style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft, fontWeight: 600, whiteSpace: 'nowrap' }}>‹ 1.20</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: SPACE[3] }}>
            <span style={valueStyle}>1.14</span>
            <span style={{ fontFamily: t.fontLabel, fontSize: 11, color: t.statusOk, marginLeft: 4 }}>↓ 0.03</span>
          </div>
          <div style={{ marginTop: SPACE[2] }}>
            <KpiSpark t={t} color={t.colorThermal}
              points={[1.18, 1.17, 1.19, 1.16, 1.15, 1.16, 1.14, 1.13, 1.14, 1.15, 1.14, 1.13, 1.14]}/>
          </div>
          <div style={{ fontFamily: t.fontBody, fontSize: 11, color: t.textMid, marginTop: SPACE[2], whiteSpace: 'nowrap' }}>
            24h · liquid-cooled
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Zone D — Active alarms ───
const ALARMS = [
  {
    sev: 'alarm', device: 'BESS-02', name: 'Cell voltage spread',
    value: '0.142 V', valueLabel: 'spread', age: '4m', ack: false,
  },
  {
    sev: 'warn', device: 'COMPUTE-S04', name: 'CDU outlet rising',
    value: '38.4 °C', valueLabel: 'outlet', age: '17m', ack: false,
  },
  {
    sev: 'warn', device: 'COMPUTE-S14', name: 'Power approaching cap',
    value: '942 / 1000 W', valueLabel: 'draw', age: '1h 04m', ack: true,
  },
];

function SeverityIcon({ sev, t, size = 16, pulse = false }) {
  if (sev === 'fire') return <IconFire size={size} color={t.statusFire}/>;
  if (sev === 'alarm') return <IconAlarm size={size} color={t.statusAlarm}/>;
  return <IconWarning size={size} color={t.statusWarn}/>;
}

function AlarmsPanel({ t }) {
  const isSov = t.name === 'sovereign';
  return (
    <div style={{
      margin: `${SPACE[3]}px ${SPACE[4]}px 0`,
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: RADIUS[3],
      overflow: 'hidden',
    }}>
      <div style={{
        padding: `${SPACE[3]}px ${SPACE[4]}px`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: SPACE[3],
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.18,
            color: t.textSoft, textTransform: 'uppercase', fontWeight: 600,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>Active alarms · 2 unacknowledged</div>
          <div style={{
            fontFamily: t.fontHeading, fontSize: 18, lineHeight: 1.2,
            color: t.text, marginTop: 3, paddingBottom: 2,
            textTransform: isSov ? 'uppercase' : 'none',
            letterSpacing: isSov ? 0.5 : 0,
            fontWeight: isSov ? 400 : 500,
          }}>Operations</div>
        </div>
        <span style={{
          fontFamily: t.fontLabel, fontSize: 10, fontWeight: 600, letterSpacing: 0.15,
          color: t.accent, textTransform: 'uppercase',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>History →</span>
      </div>

      {ALARMS.map((a, i) => {
        const sevColor = a.sev === 'alarm' ? t.statusAlarm : (a.sev === 'fire' ? t.statusFire : t.statusWarn);
        return (
          <div key={i} style={{
            borderTop: `1px solid ${t.borderSoft}`,
            padding: `${SPACE[3]}px ${SPACE[4]}px`,
            display: 'flex', alignItems: 'center', gap: SPACE[3],
            background: !a.ack ? sevColor + '08' : 'transparent',
          }}>
            {/* unack indicator */}
            <div style={{ width: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {!a.ack && (
                <span style={{
                  width: 7, height: 7, borderRadius: '50%', background: sevColor,
                  boxShadow: `0 0 0 3px ${sevColor}30`,
                  animation: 'ackPulse 1.4s ease-in-out infinite',
                }}/>
              )}
            </div>
            <SeverityIcon sev={a.sev} t={t}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 1,
              }}>
                <span style={{
                  fontFamily: t.fontLabel, fontSize: 11, fontWeight: 700,
                  color: t.text, letterSpacing: 0.1,
                }}>{a.device}</span>
                <span style={{
                  fontFamily: t.fontLabel, fontSize: 10, color: t.textSoft,
                }}>· {a.age} ago</span>
              </div>
              <div style={{
                fontFamily: t.fontBody, fontSize: 12, color: t.textMid,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{a.name} · <span style={{ color: t.text, fontWeight: 600 }}>{a.value}</span></div>
            </div>
            {!a.ack ? (
              <button style={{
                background: 'transparent',
                border: `1px solid ${t.border}`,
                color: t.text,
                fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700,
                letterSpacing: 0.15, textTransform: 'uppercase',
                padding: '6px 10px', borderRadius: RADIUS[2],
                cursor: 'pointer',
              }}>Ack</button>
            ) : (
              <span style={{
                fontFamily: t.fontLabel, fontSize: 10, color: t.textSoft,
                textTransform: 'uppercase', letterSpacing: 0.15,
              }}>Ack’d</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Zone E — 24h energy bar chart ───
const ENERGY_BARS = [
  // [hour, consumed, stored, exported]  (kWh per hour)
  [ '00', 142,  8, 0], [ '02', 138, 12, 0], [ '04', 130, 14, 0], [ '06', 134,  6, 0],
  [ '08', 156,  0, 0], [ '10', 178,  0, 12], [ '12', 185,  0, 24], [ '14', 192,  0, 18],
  [ '16', 188,  0,  4], [ '18', 176,  4, 0], [ '20', 168, 10, 0], [ '22', 152, 12, 0],
];

function EnergyChart({ t }) {
  const isSov = t.name === 'sovereign';
  const maxV = Math.max(...ENERGY_BARS.map(([_, c, s, e]) => c + s + e));
  const W = 320, H = 120, padL = 28, padB = 22, padT = 8;
  const chartW = W - padL - 6, chartH = H - padB - padT;
  const barW = chartW / ENERGY_BARS.length - 4;

  return (
    <div style={{
      margin: `${SPACE[3]}px ${SPACE[4]}px ${SPACE[5]}px`,
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: RADIUS[3],
      overflow: 'hidden',
    }}>
      <div style={{
        padding: `${SPACE[3]}px ${SPACE[4]}px ${SPACE[2]}px`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: SPACE[3],
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.18,
            color: t.textSoft, textTransform: 'uppercase', fontWeight: 600,
            whiteSpace: 'nowrap',
          }}>Energy · 24h</div>
          <div style={{
            fontFamily: t.fontHeading, fontSize: 18, lineHeight: 1.2,
            color: t.text, marginTop: 3, paddingBottom: 2,
            textTransform: isSov ? 'uppercase' : 'none',
            letterSpacing: isSov ? 0.5 : 0,
            fontWeight: isSov ? 400 : 500,
          }}>Power balance</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          {[
            { label: 'Consumed', color: t.colorCompute },
            { label: 'Stored',   color: t.colorBess },
            { label: 'Exported', color: t.colorGrid },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: l.color }}/>
              <span style={{
                fontFamily: t.fontLabel, fontSize: 9, color: t.textMid,
                textTransform: 'uppercase', letterSpacing: 0.1, fontWeight: 600,
              }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: `0 ${SPACE[3]}px ${SPACE[3]}px` }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
          {/* grid */}
          {[0.25, 0.5, 0.75, 1].map(g => (
            <line key={g} x1={padL} x2={W - 6}
                  y1={padT + chartH * (1 - g)}
                  y2={padT + chartH * (1 - g)}
                  stroke={t.chartGrid} strokeWidth="1"/>
          ))}
          {/* y labels */}
          {[0, 0.5, 1].map(g => (
            <text key={g} x={padL - 5} y={padT + chartH * (1 - g) + 3}
                  fill={t.textSoft} fontSize="9"
                  fontFamily={t.fontLabel} textAnchor="end">{Math.round(maxV * g)}</text>
          ))}
          {/* bars */}
          {ENERGY_BARS.map(([h, c, s, e], i) => {
            const x = padL + i * (chartW / ENERGY_BARS.length) + 2;
            const total = c + s + e;
            const cH = (c / maxV) * chartH;
            const sH = (s / maxV) * chartH;
            const eH = (e / maxV) * chartH;
            let y = padT + chartH;
            return (
              <g key={i}>
                {/* consumed */}
                <rect x={x} y={(y -= cH)} width={barW} height={cH} fill={t.colorCompute} rx="1"/>
                {/* stored */}
                {sH > 0 && <rect x={x} y={(y -= sH)} width={barW} height={sH} fill={t.colorBess} rx="1"/>}
                {/* exported */}
                {eH > 0 && <rect x={x} y={(y -= eH)} width={barW} height={eH} fill={t.colorGrid} rx="1"/>}
                {/* x label every other */}
                {i % 2 === 0 && (
                  <text x={x + barW / 2} y={H - 6}
                        fill={t.textSoft} fontSize="9"
                        fontFamily={t.fontLabel} textAnchor="middle">{h}</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ─── Bottom tab bar ───
function BottomTabs({ t }) {
  const tabs = [
    { id: 'overview', label: 'Overview', Icon: IconOverview, active: true },
    { id: 'modules',  label: 'Modules',  Icon: IconModules,  active: false, badge: 2 },
    { id: 'energy',   label: 'Energy',   Icon: IconEnergy,   active: false },
    { id: 'compute',  label: 'Compute',  Icon: IconCompute,  active: false },
    { id: 'analyst',  label: 'Analyst', Icon: IconAnalyst,  active: false },
  ];
  return (
    <div style={{
      borderTop: `1px solid ${t.border}`,
      background: t.panel,
      display: 'flex',
      paddingBottom: 4,
      flexShrink: 0,
    }}>
      {tabs.map(tb => {
        const c = tb.active ? t.accent : t.textSoft;
        return (
          <button key={tb.id} style={{
            flex: 1, background: 'transparent', border: 'none',
            padding: '8px 4px 6px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            cursor: 'pointer', position: 'relative',
          }}>
            {tb.active && (
              <div style={{
                position: 'absolute', top: 0, left: '20%', right: '20%',
                height: 2, background: t.accent, borderRadius: '0 0 2px 2px',
              }}/>
            )}
            <div style={{ position: 'relative' }}>
              <tb.Icon size={20} color={c}/>
              {tb.badge && (
                <div style={{
                  position: 'absolute', top: -4, right: -8,
                  minWidth: 14, height: 14, padding: '0 3px',
                  borderRadius: 7, background: t.statusAlarm,
                  color: '#fff', fontFamily: t.fontLabel,
                  fontSize: 9, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1.5px solid ${t.panel}`,
                }}>{tb.badge}</div>
              )}
            </div>
            <span style={{
              fontFamily: t.fontLabel, fontSize: 9, fontWeight: 600,
              color: c, letterSpacing: 0.15, textTransform: 'uppercase',
              lineHeight: 1.1, textAlign: 'center', maxWidth: '100%',
            }}>{tb.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Composed screen ───
function OverviewScreen({ t }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: '100%',
      background: t.bg,
    }}>
      <TopBar t={t}/>
      <StatusStrip t={t}/>
      <div style={{ flex: 1, paddingBottom: SPACE[2] }}>
        <HealthBar t={t}/>
        <GpuClusterStrip t={t}/>
        <StrandedCapacity t={t}/>
        <KpiStrip t={t}/>
        <AlarmsPanel t={t}/>
        <EnergyChart t={t}/>
      </div>
    </div>
  );
}

function OverviewBottomTabs({ t }) {
  return <BottomTabs t={t}/>;
}

window.OverviewScreen = OverviewScreen;
window.OverviewBottomTabs = OverviewBottomTabs;
window.StatusStrip = StatusStrip;
window.BottomTabs = BottomTabs;
