// overview-desktop.jsx — Desktop Overview, IA spec.
// 12-col grid: GPU heatmap + stranded capacity (left 2/3) | KPIs + alarms (right 1/3) | energy chart (full-width below)

const { useState: useStateOD, useEffect: useEffectOD } = React;

// Realistic 8x4 server grid: 8 servers, each with 4 GPU slots → 32 GPUs
// Per-GPU utilization (more granular than mobile per-server)
const GPU_GRID = [
  // server 1..8 × slot 1..4
  [92, 94, 91, 89], [95, 93, 92, 88], [90, 87, 91, 93], [96, 94, 89, 92],
  [88, 91, 86, 90], [0,   0,  4, 12], [85, 88, 87, 91], [72, 68, 71, 74],
];
const SERVER_NAMES = ['s01','s02','s03','s04','s05','s06','s07','s08'];

function gpuColorD(util, t) {
  if (util < 5) return t.borderSoft;
  // ramp on compute-color saturation
  const a = Math.max(0.35, Math.min(1, 0.4 + (util / 100) * 0.6));
  return t.colorCompute;
}
function gpuOpacityD(util) {
  if (util < 5) return 0.35;
  return Math.max(0.45, Math.min(1, 0.45 + (util / 100) * 0.55));
}

// ─── Zone A — Site health bar (full width) ────────────────────────
function SiteHealthBar({ t }) {
  // Match the alarm panel exactly: 2 unack alarms (BESS-02, COMPUTE-S04) + 1 ack (COMPUTE-S14)
  // Also: 1 compute degraded (s06: 3/4 GPU offline). Site is NOT "all nominal" — it's "degraded".
  const accentColor = t.statusWarn;
  return (
    <div style={{
      margin: 0,
      padding: `${SPACE[3]}px ${SPACE[5]}px`,
      background: t.surface,
      borderBottom: `1px solid ${t.border}`,
      borderLeft: `3px solid ${accentColor}`,
      display: 'flex', alignItems: 'center', gap: SPACE[5],
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        background: accentColor + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <IconWarning size={16} color={accentColor}/>
      </div>
      <div>
        <div style={{
          fontFamily: t.fontLabel, fontSize: 10, letterSpacing: 0.15,
          color: accentColor, textTransform: 'uppercase', fontWeight: 700,
        }}>Degraded · 2 alarms unacknowledged</div>
        <div style={{
          fontFamily: t.fontBody, fontSize: 12, color: t.textMid, marginTop: 1,
        }}>17 modules online · 3 active alarms · last incident <a href="#" style={{
          color: t.accent, textDecoration: 'underline', textDecorationStyle: 'dotted',
          textUnderlineOffset: 2, cursor: 'pointer',
        }} title="BESS-02 cell-spread — 4h 18m ago">4h 18m ago</a></div>
      </div>
      <div style={{ flex: 1 }}/>
      {/* mini fleet roll-up */}
      <div style={{ display: 'flex', gap: SPACE[5] }}>
        {[
          { label: 'BESS', count: '3 / 4', color: t.colorBess, ok: 3, total: 4, warn: true },
          { label: 'Compute', count: '7 / 8', color: t.colorCompute, ok: 7, total: 8, warn: true },
          { label: 'Grid', count: '1 / 1', color: t.colorGrid, ok: 1, total: 1 },
        ].map(g => (
          <div key={g.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 8, height: 8, borderRadius: 2, background: g.color,
              opacity: g.warn ? 0.7 : 1,
            }}/>
            <span style={{
              fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.18,
              color: t.textSoft, textTransform: 'uppercase', fontWeight: 600,
            }}>{g.label}</span>
            <span style={{
              fontFamily: t.fontLabel, fontSize: 12, fontWeight: 600,
              color: g.warn ? t.statusWarn : t.text,
            }}>{g.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Zone B — GPU cluster heatmap (desktop-native: rows × slots) ──
function GpuHeatmap({ t, density, onSelectGpu, selectedGpu }) {
  const isSov = t.name === 'sovereign';
  const dense = density === 'dense';
  const cellW = dense ? 64 : 78;
  const cellH = dense ? 36 : 42;
  const gap = dense ? 3 : 4;
  const totalKw = 184.2;
  const all = GPU_GRID.flat();
  const live = all.filter(u => u >= 5);
  const avgUtil = Math.round(live.reduce((s, x) => s + x, 0) / live.length);
  const headroom = 38.5;

  return (
    <div style={{
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: RADIUS[3],
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* header */}
      <div style={{
        padding: `${dense ? SPACE[3] : SPACE[4]}px ${SPACE[4]}px`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${t.borderSoft}`,
      }}>
        <div>
          <div style={{
            fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.2,
            color: t.textSoft, textTransform: 'uppercase', fontWeight: 700,
          }}>Compute · 8 servers · 32 GPUs</div>
          <div style={{
            fontFamily: t.fontHeading, fontSize: 22, lineHeight: 1.1, marginTop: 3,
            color: t.text,
            textTransform: isSov ? 'uppercase' : 'none',
            letterSpacing: isSov ? 0.5 : 0,
            fontWeight: isSov ? 400 : 500,
          }}>Cluster utilization</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3] }}>
          {/* legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft, letterSpacing: 0.15, textTransform: 'uppercase', marginRight: 4 }}>Util</span>
            {[0.4, 0.6, 0.8, 1].map((o, i) => (
              <span key={i} style={{
                width: 14, height: 12,
                background: t.colorCompute, opacity: o, borderRadius: 1,
              }}/>
            ))}
            <span style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft, marginLeft: 4 }}>0 → 100%</span>
          </div>
          {/* time range */}
          <div style={{ display: 'flex', gap: 1, background: t.bg, border: `1px solid ${t.border}`, borderRadius: RADIUS[2], padding: 2 }}>
            {['Now', '1h', '24h'].map((r, i) => (
              <button key={r} style={{
                background: i === 0 ? t.accent + '22' : 'transparent',
                color: i === 0 ? t.accent : t.textSoft,
                border: 'none',
                fontFamily: t.fontLabel, fontSize: 10, fontWeight: 600, letterSpacing: 0.1,
                padding: '3px 9px', borderRadius: RADIUS[1], cursor: 'pointer',
                textTransform: 'uppercase',
              }}>{r}</button>
            ))}
          </div>
        </div>
      </div>

      {/* heatmap body — rows = servers, cols = GPU slots */}
      <div style={{ padding: `${SPACE[4]}px ${SPACE[4]}px ${SPACE[3]}px` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3] }}>
          {/* col headers */}
          <div style={{ width: 40 }}/>
          <div style={{ display: 'flex', gap, flex: 1 }}>
            {[0,1,2,3].map(slot => (
              <div key={slot} style={{
                flex: 1, textAlign: 'center',
                fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.15,
                color: t.textSoft, textTransform: 'uppercase', fontWeight: 600,
              }}>GPU·{slot}</div>
            ))}
          </div>
          {/* server avg col */}
          <div style={{ width: 60, textAlign: 'right',
                       fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.15,
                       color: t.textSoft, textTransform: 'uppercase', fontWeight: 600 }}>Avg</div>
          {/* power col */}
          <div style={{ width: 70, textAlign: 'right',
                       fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.15,
                       color: t.textSoft, textTransform: 'uppercase', fontWeight: 600 }}>Draw</div>
        </div>
        {/* rows */}
        {GPU_GRID.map((row, r) => {
          const liveR = row.filter(u => u >= 5);
          const avg = liveR.length ? Math.round(liveR.reduce((s,x)=>s+x,0)/liveR.length) : 0;
          const draw = row.reduce((s,u) => s + (u/100)*7.5, 0); // mock 7.5kW peak per gpu
          const isOffline = row.every(u => u < 5);
          const offlineCount = row.filter(u => u < 5).length;
          const isDegraded = !isOffline && offlineCount > 0; // some-but-not-all GPUs offline
          const alarmColor = t.statusAlarm;
          return (
            <div key={r} style={{
              display: 'flex', alignItems: 'center', gap: SPACE[3],
              marginTop: gap,
              opacity: isOffline ? 0.55 : 1,
              background: isDegraded ? alarmColor + '0c' : 'transparent',
              borderLeft: isDegraded ? `2px solid ${alarmColor}` : '2px solid transparent',
              borderRadius: isDegraded ? RADIUS[2] : 0,
              paddingLeft: isDegraded ? 6 : 0,
              marginLeft: isDegraded ? -8 : 0,
              paddingTop: isDegraded ? 2 : 0,
              paddingBottom: isDegraded ? 2 : 0,
            }}>
              <div style={{
                width: 40,
                fontFamily: t.fontLabel, fontSize: 11, fontWeight: 700,
                color: isDegraded ? alarmColor : (isOffline ? t.textSoft : t.text),
                letterSpacing: 0.05,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                {isDegraded && <IconAlarm size={10} color={alarmColor}/>}
                <span>{SERVER_NAMES[r]}</span>
              </div>
              <div style={{ display: 'flex', gap, flex: 1 }}>
                {row.map((util, c) => {
                  const isSel = selectedGpu && selectedGpu.r === r && selectedGpu.c === c;
                  // In a degraded row, offline cells get an alarm-tinted background so the
                  // pattern pops at a glance — empty rectangle in a hot row is the failure.
                  const cellBg = util < 5
                    ? (isDegraded ? alarmColor + '22' : t.borderSoft)
                    : t.colorCompute;
                  const cellBorder = util < 5
                    ? `1px dashed ${isDegraded ? alarmColor + '88' : t.border}`
                    : 'none';
                  return (
                    <div key={c}
                      onClick={() => onSelectGpu && onSelectGpu({ r, c, util, server: SERVER_NAMES[r] })}
                      title={`${SERVER_NAMES[r]} · GPU ${c} · ${util < 5 ? 'OFFLINE' : util + '%'}`}
                      style={{
                        flex: 1, height: cellH,
                        background: cellBg,
                        opacity: gpuOpacityD(util),
                        borderRadius: RADIUS[2],
                        position: 'relative',
                        cursor: 'pointer',
                        outline: isSel ? `2px solid ${t.accent}` : 'none',
                        outlineOffset: isSel ? 2 : 0,
                        border: cellBorder,
                        transition: 'outline 0.1s',
                      }}>
                      {/* fill bar */}
                      {util >= 5 && (
                        <div style={{
                          position: 'absolute', left: 4, right: 4, top: 4,
                          height: 3, borderRadius: 1.5,
                          background: '#fff', opacity: 0.85,
                          width: `calc((100% - 8px) * ${util / 100})`,
                        }}/>
                      )}
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: t.fontLabel, fontSize: 11, fontWeight: 700,
                        color: util < 5
                          ? (isDegraded ? alarmColor : t.textSoft)
                          : '#fff',
                        letterSpacing: 0,
                      }}>{util < 5 ? '—' : `${util}%`}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{
                width: 60, textAlign: 'right',
                fontFamily: t.fontLabel, fontSize: 12, fontWeight: 600,
                color: isDegraded ? alarmColor : (isOffline ? t.textSoft : t.text),
              }}>
                {isOffline ? '—' : isDegraded
                  ? <span title={`${offlineCount} of 4 GPUs offline`}>{offlineCount}/4 off</span>
                  : `${avg}%`}
              </div>
              <div style={{
                width: 70, textAlign: 'right',
                fontFamily: t.fontLabel, fontSize: 12, fontWeight: 500,
                color: isOffline ? t.textSoft : t.textMid,
              }}>{isOffline ? '—' : `${draw.toFixed(1)} kW`}</div>
            </div>
          );
        })}
      </div>

      {/* footer metrics */}
      <div style={{
        borderTop: `1px solid ${t.borderSoft}`,
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        background: t.panel + '60',
      }}>
        {[
          { label: 'Total draw',  value: totalKw.toFixed(1), unit: 'kW' },
          { label: 'Avg util',    value: avgUtil,            unit: '%' },
          { label: 'Headroom',    value: headroom.toFixed(1), unit: 'kW' },
          { label: 'Active GPUs', value: '28 / 32',          unit: '', alarm: true, sub: '4 offline · s06' },
        ].map((m, i) => (
          <div key={m.label} style={{
            padding: `${SPACE[2]}px ${SPACE[4]}px`,
            borderRight: i < 3 ? `1px solid ${t.borderSoft}` : 'none',
          }}>
            <div style={{
              fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.18,
              color: t.textSoft, textTransform: 'uppercase', fontWeight: 600,
            }}>{m.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
              <span style={{
                fontFamily: t.fontLabel, fontSize: 18, fontWeight: 400,
                color: m.alarm ? t.statusAlarm : t.text, letterSpacing: -0.3, lineHeight: 1.0,
              }}>{m.value}</span>
              {m.unit && <span style={{ fontFamily: t.fontLabel, fontSize: 10, color: t.textMid }}>{m.unit}</span>}
            </div>
            {m.sub && (
              <div style={{
                fontFamily: t.fontLabel, fontSize: 9, fontWeight: 600, letterSpacing: 0.15,
                color: t.statusAlarm, textTransform: 'uppercase', marginTop: 1,
              }}>{m.sub}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Zone B2 — Cluster headroom (Power / Cooling / Runway) ───────────
function StrandedCapacityD({ t }) {
  // Cooling is now an aggregate of per-Compute-module DLC headroom — worst module wins
  // (the constraint that fires first is the one that matters).
  const power   = 0.71;  // 184 / 260 kW
  const cooling = 0.78;  // worst CDU: 38.4 / 49 °C alarm threshold
  const runway  = 0.62;  // 6.2 h of 10 h max runway
  const worst = Math.max(power, cooling, runway);
  const state = worst < 0.85 ? 'BALANCED'
              : cooling >= power && cooling >= runway ? 'COOLING LIMITED'
              : power >= runway ? 'POWER LIMITED' : 'RUNWAY LIMITED';
  const color = state === 'BALANCED' ? t.statusOk : t.statusWarn;
  return (
    <div style={{
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: RADIUS[3],
      padding: `${SPACE[3]}px ${SPACE[4]}px`,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: SPACE[3],
      }}>
        <div>
          <span style={{
            fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.18,
            color: t.textSoft, textTransform: 'uppercase', fontWeight: 700,
          }}>Stranded capacity</span>
          <span style={{
            fontFamily: t.fontBody, fontSize: 11, color: t.textMid,
            marginLeft: SPACE[3],
          }}>power · cooling · runway</span>
        </div>
        <span style={{
          fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700, letterSpacing: 0.2,
          color: color, textTransform: 'uppercase',
          padding: '2px 8px', borderRadius: RADIUS[2],
          background: color + '18', border: `1px solid ${color}55`,
        }}>{state}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: SPACE[5] }}>
        {[
          { label: 'Power',   val: power,   color: t.colorCompute, headline: '184 / 260 kW',  sub: '76 kW headroom' },
          { label: 'Cooling', val: cooling, color: t.colorThermal, headline: '38.4 / 49 °C',  sub: 'worst CDU · s04' },
          { label: 'Runway',  val: runway,  color: t.colorBess,    headline: '6.2 h',           sub: 'at current load' },
        ].map(r => (
          <div key={r.label}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              fontFamily: t.fontLabel,
            }}>
              <span style={{ fontSize: 11, color: t.textMid, letterSpacing: 0.05 }}>{r.label}</span>
              <span style={{ fontSize: 11, color: t.text, fontWeight: 600 }}>{r.headline}</span>
            </div>
            <div style={{
              marginTop: 5, height: 6, borderRadius: 3,
              background: t.borderSoft, position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                width: `${r.val * 100}%`, background: r.color, borderRadius: 3,
              }}/>
              {/* tick marks for visual reference */}
              {[0.25, 0.5, 0.75].map(p => (
                <div key={p} style={{
                  position: 'absolute', left: `${p * 100}%`, top: 0, bottom: 0,
                  width: 1, background: t.bg, opacity: 0.5,
                }}/>
              ))}
            </div>
            <div style={{
              fontFamily: t.fontLabel, fontSize: 10, color: t.textSoft,
              marginTop: 4, letterSpacing: 0.05,
            }}>{Math.round(r.val * 100)}% · {r.sub}</div>
          </div>
        ))}
      </div>
      <div style={{
        fontFamily: t.fontBody, fontSize: 11, color: t.textSoft,
        marginTop: SPACE[3], paddingTop: SPACE[2],
        borderTop: `1px solid ${t.borderSoft}`,
        lineHeight: 1.4,
      }}>
        Power and runway have headroom; cooling is the closest constraint (s04 CDU at 38.4 °C, 11 °C below alarm).
      </div>
    </div>
  );
}

// ─── Zone C — KPI tiles (right column, stacked) ───────────────────
function RadialGaugeD({ t, value, color, size = 72 }) {
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
function KpiSparkD({ t, color, points, height = 32, fill = false }) {
  const W = 200, H = height;
  const min = Math.min(...points), max = Math.max(...points);
  const xs = points.map((_, i) => (i / (points.length - 1)) * W);
  const ys = points.map(v => H - ((v - min) / (max - min || 1)) * H * 0.85 - 2);
  const d = points.map((_, i) => `${i === 0 ? 'M' : 'L'} ${xs[i].toFixed(2)} ${ys[i].toFixed(2)}`).join(' ');
  const dFill = fill ? `${d} L ${W} ${H} L 0 ${H} Z` : null;
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      {dFill && <path d={dFill} fill={color} fillOpacity="0.15"/>}
      <path d={d} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function KpiTile({ t, children, label }) {
  return (
    <div style={{
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: RADIUS[3],
      padding: SPACE[4],
    }}>
      <div style={{
        fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.2,
        color: t.textSoft, textTransform: 'uppercase', fontWeight: 700,
        marginBottom: SPACE[2],
      }}>{label}</div>
      {children}
    </div>
  );
}

function KpiBessSoc({ t }) {
  // Forecast snapshot — same numbers as ForecastCard, surfaced above fold for dispatch decisions.
  // BESS reaches 95% ceiling at ~16:00 (90 min from "now" = 14:30). After that, ~67 kWh
  // of expected PV generation has nowhere to go → spill risk.
  const fillsAt = '~16:00';
  const spillKwh = 67;
  return (
    <KpiTile t={t} label="BESS · Fleet SoC">
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[4] }}>
        <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
          <RadialGaugeD t={t} value={74} color={t.colorBess} size={72}/>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column',
            fontFamily: t.fontLabel, color: t.text,
          }}>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: -0.3, lineHeight: 1 }}>74</div>
            <div style={{ fontSize: 9, color: t.textSoft, marginTop: 1, letterSpacing: 0.15 }}>%</div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft, letterSpacing: 0.18, textTransform: 'uppercase', fontWeight: 600 }}>Runway</div>
          <div style={{ fontFamily: t.fontLabel, fontSize: 22, color: t.text, marginTop: 2, letterSpacing: -0.3 }}>~6.2 h</div>
          <div style={{ fontFamily: t.fontBody, fontSize: 11, color: t.textMid, marginTop: 1 }}>at current load</div>
          <div style={{
            display: 'flex', gap: 4, marginTop: 8,
          }}>
            {[
              { id: 'B1', soc: 78, ok: true }, { id: 'B2', soc: 71, ok: false },
              { id: 'B3', soc: 76, ok: true }, { id: 'B4', soc: 72, ok: true },
            ].map(b => (
              <div key={b.id}
                title={b.ok ? `${b.id} · ${b.soc}% · healthy` : `${b.id} · alarm — cell voltage spread — see Active alarms`}
                style={{
                flex: 1, padding: '3px 4px',
                background: b.ok ? t.bg : t.statusAlarm + '22',
                border: `1px solid ${b.ok ? t.border : t.statusAlarm}`,
                borderRadius: RADIUS[1],
                textAlign: 'center', position: 'relative',
                cursor: b.ok ? 'default' : 'pointer',
                animation: b.ok ? 'none' : 'ackPulse 1.4s ease-in-out infinite',
              }}>
                <div style={{
                  fontFamily: t.fontLabel, fontSize: 8,
                  color: b.ok ? t.textSoft : t.statusAlarm,
                  fontWeight: b.ok ? 400 : 700,
                  letterSpacing: 0.1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2,
                }}>
                  {!b.ok && <span style={{
                    width: 5, height: 5, borderRadius: '50%', background: t.statusAlarm,
                  }}/>}
                  {b.id}
                </div>
                <div style={{ fontFamily: t.fontLabel, fontSize: 11, color: b.ok ? t.text : t.statusAlarm, fontWeight: 700 }}>{b.soc}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Forecast snapshot — pulled above-fold from ForecastCard for fast dispatch decisions */}
      <div style={{
        marginTop: SPACE[3], paddingTop: SPACE[2],
        borderTop: `1px solid ${t.borderSoft}`,
        display: 'flex', alignItems: 'center', gap: SPACE[3],
      }}>
        <span style={{
          fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700, letterSpacing: 0.18,
          color: t.statusSim, textTransform: 'uppercase',
          padding: '1px 5px', background: t.statusSim + '15',
          border: `1px solid ${t.statusSim}55`, borderRadius: RADIUS[1],
        }}>ML</span>
        <div style={{ flex: 1, display: 'flex', gap: SPACE[4] }}>
          <div>
            <div style={{
              fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft,
              letterSpacing: 0.15, textTransform: 'uppercase', fontWeight: 600,
            }}>Fills at</div>
            <div style={{
              fontFamily: t.fontLabel, fontSize: 13, color: t.text, fontWeight: 700,
              marginTop: 1,
            }}>{fillsAt}</div>
          </div>
          <div>
            <div style={{
              fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft,
              letterSpacing: 0.15, textTransform: 'uppercase', fontWeight: 600,
            }}>Spill risk</div>
            <div style={{
              fontFamily: t.fontLabel, fontSize: 13, fontWeight: 700, marginTop: 1,
              color: spillKwh > 5 ? t.statusWarn : t.text,
            }}>{spillKwh > 5 ? `${spillKwh} kWh` : 'none'}</div>
          </div>
        </div>
        <a href="#forecast" style={{
          fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700, letterSpacing: 0.15,
          color: t.accent, textTransform: 'uppercase', textDecoration: 'none',
          flexShrink: 0,
        }}>Chart →</a>
      </div>
    </KpiTile>
  );
}

function KpiNetPower({ t }) {
  // Sign convention: negative = site is a net consumer (draws from grid).
  // We show the signed number once and a tiny inline clarifier — no double labeling.
  return (
    <KpiTile t={t} label="Net power · now">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{
          fontFamily: t.fontLabel, fontSize: 30, fontWeight: 400,
          color: t.text, letterSpacing: -0.5, lineHeight: 1,
        }}>−184.2</span>
        <span style={{ fontFamily: t.fontLabel, fontSize: 12, color: t.textMid }}>kW</span>
        <span style={{ flex: 1 }}/>
        <span style={{
          fontFamily: t.fontLabel, fontSize: 9, fontWeight: 600,
          color: t.textSoft, letterSpacing: 0.15, textTransform: 'uppercase',
        }}>← net import from grid</span>
      </div>
      <div style={{ marginTop: SPACE[2] }}>
        <KpiSparkD t={t} color={t.colorCompute} fill
          points={[170, 168, 172, 178, 182, 180, 178, 176, 180, 184, 186, 184, 184.2]}/>
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        marginTop: SPACE[3], paddingTop: SPACE[2],
        borderTop: `1px solid ${t.borderSoft}`, gap: 0,
      }}>
        {[
          { label: 'Grid in',  v: '142', unit: 'kW', c: t.colorGrid },
          { label: 'BESS out', v: '42',  unit: 'kW', c: t.colorBess },
          { label: 'PV',       v: '0',   unit: 'kW', c: t.colorPv },
        ].map((m, i) => (
          <div key={m.label} style={{
            paddingLeft: i === 0 ? 0 : SPACE[3],
            borderLeft: i > 0 ? `1px solid ${t.borderSoft}` : 'none',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft,
              letterSpacing: 0.15, textTransform: 'uppercase', fontWeight: 600,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 1, background: m.c }}/>
              {m.label}
            </div>
            <div style={{ fontFamily: t.fontLabel, fontSize: 14, fontWeight: 600, color: t.text, marginTop: 2 }}>
              {m.v}<span style={{ color: t.textMid, fontWeight: 400, fontSize: 10, marginLeft: 2 }}>{m.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </KpiTile>
  );
}

function KpiPue({ t }) {
  return (
    <KpiTile t={t} label="PUE · 24h">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{
          fontFamily: t.fontLabel, fontSize: 30, fontWeight: 400,
          color: t.text, letterSpacing: -0.5, lineHeight: 1,
        }}>1.14</span>
        <span style={{ fontFamily: t.fontLabel, fontSize: 12, color: t.statusOk, fontWeight: 600 }}>↓ 0.03</span>
        <span style={{ flex: 1 }}/>
        <span style={{
          fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft, fontWeight: 600, letterSpacing: 0.15,
        }}>target ‹ 1.20</span>
      </div>
      <div style={{ marginTop: SPACE[2] }}>
        <KpiSparkD t={t} color={t.colorThermal} fill height={36}
          points={[1.18, 1.17, 1.19, 1.16, 1.15, 1.16, 1.14, 1.13, 1.14, 1.15, 1.14, 1.13, 1.14]}/>
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontFamily: t.fontLabel, fontSize: 10, color: t.textSoft,
        marginTop: 4,
      }}>
        <span>24h ago</span>
        <span>now</span>
      </div>
    </KpiTile>
  );
}

// ─── Zone D — Active alarms ───────────────────────────────────────
const ALARMS_D = [
  { sev: 'alarm', device: 'BESS-02', name: 'Cell voltage spread',     value: '0.142 V', age: '4m',     ack: false, route: '/modules/bess/02' },
  { sev: 'warn',  device: 'COMPUTE-S04', name: 'CDU outlet rising',     value: '38.4 °C', age: '17m',    ack: false, route: '/modules/compute/s04' },
  { sev: 'warn',  device: 'COMPUTE-S14', name: 'Power approaching cap', value: '942 / 1000 W', age: '1h 04m', ack: true, route: '/modules/compute/s14' },
];

function AlarmsPanelD({ t, density }) {
  const isSov = t.name === 'sovereign';
  const dense = density === 'dense';
  return (
    <div style={{
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: RADIUS[3],
      overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        padding: `${dense ? SPACE[3] : SPACE[4]}px ${SPACE[4]}px`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${t.borderSoft}`,
      }}>
        <div>
          <div style={{
            fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.2,
            color: t.textSoft, textTransform: 'uppercase', fontWeight: 700,
          }}>Active alarms · 2 unacknowledged</div>
          <div style={{
            fontFamily: t.fontHeading, fontSize: 18, lineHeight: 1.1, marginTop: 3,
            color: t.text,
            textTransform: isSov ? 'uppercase' : 'none',
            letterSpacing: isSov ? 0.5 : 0,
            fontWeight: isSov ? 400 : 500,
          }}>Operations</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3] }}>
          <button style={{
            background: t.bg, border: `1px solid ${t.border}`,
            color: t.textMid, fontFamily: t.fontLabel, fontSize: 10, fontWeight: 600,
            letterSpacing: 0.15, textTransform: 'uppercase',
            padding: '5px 10px', borderRadius: RADIUS[2], cursor: 'pointer',
          }}>Ack all</button>
          <span style={{
            fontFamily: t.fontLabel, fontSize: 10, fontWeight: 600, letterSpacing: 0.15,
            color: t.accent, textTransform: 'uppercase', cursor: 'pointer',
          }}>History →</span>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        {ALARMS_D.map((a, i) => {
          const sevColor = a.sev === 'alarm' ? t.statusAlarm : (a.sev === 'fire' ? t.statusFire : t.statusWarn);
          return (
            <div key={i} style={{
              borderBottom: i < ALARMS_D.length - 1 ? `1px solid ${t.borderSoft}` : 'none',
              padding: `${dense ? 10 : 12}px ${SPACE[4]}px`,
              display: 'flex', alignItems: 'center', gap: SPACE[3],
              background: !a.ack ? sevColor + '08' : 'transparent',
              cursor: 'pointer',
            }}>
              <div style={{ width: 8, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                {!a.ack && (
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', background: sevColor,
                    boxShadow: `0 0 0 3px ${sevColor}30`,
                    animation: 'ackPulse 1.4s ease-in-out infinite',
                  }}/>
                )}
              </div>
              {a.sev === 'alarm' ? <IconAlarm size={16} color={sevColor}/> :
               a.sev === 'fire'  ? <IconFire size={16} color={sevColor}/> :
                                   <IconWarning size={16} color={sevColor}/>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex', alignItems: 'baseline', gap: 8,
                }}>
                  <span style={{ fontFamily: t.fontLabel, fontSize: 11, fontWeight: 700, color: t.text, letterSpacing: 0.1 }}>{a.device}</span>
                  <span style={{ fontFamily: t.fontBody, fontSize: 12, color: t.textMid, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
                  <span style={{ fontFamily: t.fontLabel, fontSize: 11, color: t.text, fontWeight: 600 }}>{a.value}</span>
                  <span style={{ fontFamily: t.fontLabel, fontSize: 10, color: t.textSoft }}>· {a.age} ago</span>
                </div>
              </div>
              {!a.ack ? (
                <button style={{
                  background: 'transparent', border: `1px solid ${t.border}`,
                  color: t.text, fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700,
                  letterSpacing: 0.15, textTransform: 'uppercase',
                  padding: '5px 10px', borderRadius: RADIUS[2], cursor: 'pointer',
                  flexShrink: 0,
                }}>Ack</button>
              ) : (
                <span style={{
                  fontFamily: t.fontLabel, fontSize: 10, color: t.textSoft,
                  textTransform: 'uppercase', letterSpacing: 0.15, flexShrink: 0,
                }}>Ack’d</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Forecast — Generation → BESS, next 4h ───────────────────────
// Generation-source-agnostic: a site might be PV / genset / nuclear / etc.
// Brookside is PV-dominant; this card shows expected generation curve and
// the resulting BESS SoC trajectory, flagging spill risk at the ceiling.
const GEN_FORECAST = [
  // [t-offset min, gen kW, soc % projected]
  [0,    0, 74], [15,  20, 75], [30,  55, 76], [45,  92, 78],
  [60, 128, 80], [75, 158, 83], [90, 178, 86], [105,188, 89],
  [120,182, 92], [135,168, 94], [150,148, 95], [165,128, 95],
  [180,105, 95], [195, 82, 95], [210, 58, 95], [225, 36, 95], [240, 18, 95],
];

function ForecastCard({ t, density, source = 'pv' }) {
  const isSov = t.name === 'sovereign';
  const dense = density === 'dense';
  const sourceMeta = {
    pv:      { label: 'PV',       color: t.colorPv,      title: 'PV charge projection' },
    genset:  { label: 'Genset',   color: t.colorRevenue, title: 'Genset charge projection' },
    nuclear: { label: 'Nuclear',  color: t.colorThermal, title: 'Baseload charge projection' },
  }[source] || { label: 'Gen', color: t.colorPv, title: 'Charge projection' };

  const W = 760, H = dense ? 96 : 116;
  const padL = 36, padR = 60, padB = 16, padT = 8;
  const chartW = W - padL - padR, chartH = H - padT - padB;
  const maxGen = Math.max(...GEN_FORECAST.map(p => p[1]));
  const ceiling = 95;
  // find first index where soc reaches ceiling
  const fillIdx = GEN_FORECAST.findIndex(p => p[2] >= ceiling);
  const fillTimeMin = fillIdx >= 0 ? GEN_FORECAST[fillIdx][0] : null;
  // spill risk: gen still above some threshold AFTER ceiling reached
  const spillKwh = fillIdx >= 0
    ? GEN_FORECAST.slice(fillIdx).reduce((s, p, i, arr) => {
        if (i === 0) return s;
        const [t1, g1] = arr[i-1], [t2, g2] = p;
        return s + ((g1 + g2) / 2) * ((t2 - t1) / 60); // trapezoid kWh
      }, 0)
    : 0;

  // points → svg coords
  const xAt = (mins) => padL + (mins / 240) * chartW;
  const yGen = (kw) => padT + (1 - kw / maxGen) * chartH;
  const ySoc = (soc) => padT + (1 - soc / 100) * chartH;

  const genArea = GEN_FORECAST.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(p[0]).toFixed(1)} ${yGen(p[1]).toFixed(1)}`).join(' ')
    + ` L ${xAt(GEN_FORECAST[GEN_FORECAST.length-1][0]).toFixed(1)} ${(padT + chartH).toFixed(1)}`
    + ` L ${xAt(GEN_FORECAST[0][0]).toFixed(1)} ${(padT + chartH).toFixed(1)} Z`;
  const socLine = GEN_FORECAST.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(p[0]).toFixed(1)} ${ySoc(p[2]).toFixed(1)}`).join(' ');

  const fmtTime = (mins) => {
    const h = Math.floor(mins / 60), m = mins % 60;
    const hour = (14 + h) % 24; // mock "now" = 14:30
    const minute = (30 + m) % 60;
    const overflowH = (30 + m) >= 60 ? 1 : 0;
    return `${String((hour + overflowH) % 24).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;
  };

  return (
    <div style={{
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: RADIUS[3],
      overflow: 'hidden',
    }}>
      <div style={{
        padding: `${dense ? SPACE[2] : SPACE[3]}px ${SPACE[4]}px`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${t.borderSoft}`, gap: SPACE[3],
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.2,
            color: t.textSoft, textTransform: 'uppercase', fontWeight: 700,
          }}>
            <span>Forecast · {sourceMeta.label} → BESS · Next 4h</span>
            <span style={{
              padding: '1px 5px', background: t.statusSim + '15',
              border: `1px solid ${t.statusSim}55`, borderRadius: RADIUS[1],
              color: t.statusSim, fontSize: 8, letterSpacing: 0.18,
            }}>ML</span>
          </div>
          <div style={{
            fontFamily: t.fontHeading, fontSize: 16, lineHeight: 1.1, marginTop: 2,
            color: t.text,
            textTransform: isSov ? 'uppercase' : 'none',
            letterSpacing: isSov ? 0.5 : 0,
            fontWeight: isSov ? 400 : 500,
          }}>{sourceMeta.title}</div>
        </div>
        <div style={{ display: 'flex', gap: SPACE[4], flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: t.fontLabel, fontSize: 8, color: t.textSoft, letterSpacing: 0.18, textTransform: 'uppercase', fontWeight: 600 }}>Fills at</div>
            <div style={{ fontFamily: t.fontLabel, fontSize: 13, color: t.text, fontWeight: 600, marginTop: 1 }}>
              {fillTimeMin !== null ? `~${fmtTime(fillTimeMin)}` : '—'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: t.fontLabel, fontSize: 8, color: t.textSoft, letterSpacing: 0.18, textTransform: 'uppercase', fontWeight: 600 }}>Spill risk</div>
            <div style={{
              fontFamily: t.fontLabel, fontSize: 13, fontWeight: 600, marginTop: 1,
              color: spillKwh > 5 ? t.statusWarn : t.text,
            }}>
              {spillKwh > 5 ? `${spillKwh.toFixed(0)} kWh` : 'none'}
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: `${SPACE[2]}px ${SPACE[3]}px ${SPACE[2]}px` }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
          {/* grid */}
          {[0, 0.5, 1].map(g => (
            <line key={g} x1={padL} x2={padL + chartW}
                  y1={padT + chartH * g} y2={padT + chartH * g}
                  stroke={t.chartGrid} strokeWidth="1"/>
          ))}
          {/* gen area (left axis = kW) */}
          <path d={genArea} fill={sourceMeta.color} fillOpacity="0.22"/>
          <path d={GEN_FORECAST.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(p[0]).toFixed(1)} ${yGen(p[1]).toFixed(1)}`).join(' ')}
                fill="none" stroke={sourceMeta.color} strokeWidth="1.5" strokeDasharray="4 2"/>
          {/* SoC ceiling line */}
          <line x1={padL} x2={padL + chartW}
                y1={ySoc(ceiling)} y2={ySoc(ceiling)}
                stroke={t.statusWarn} strokeWidth="1" strokeDasharray="2 3" opacity="0.55"/>
          <text x={padL + chartW + 4} y={ySoc(ceiling) + 3}
                fill={t.statusWarn} fontSize="9" fontWeight="700"
                fontFamily={t.fontLabel} letterSpacing="0.1">CEIL</text>
          {/* SoC trajectory line */}
          <path d={socLine} fill="none" stroke={t.colorBess} strokeWidth="2"
                strokeDasharray="5 2.5" strokeLinecap="round"/>
          {/* fill point marker */}
          {fillIdx >= 0 && (
            <>
              <circle cx={xAt(GEN_FORECAST[fillIdx][0])} cy={ySoc(ceiling)}
                      r="3" fill={t.colorBess} stroke={t.bg} strokeWidth="1.5"/>
              <line x1={xAt(GEN_FORECAST[fillIdx][0])} x2={xAt(GEN_FORECAST[fillIdx][0])}
                    y1={padT} y2={padT + chartH}
                    stroke={t.colorBess} strokeWidth="1" strokeDasharray="2 2" opacity="0.4"/>
            </>
          )}
          {/* spill shading (after ceiling reached, where gen still > 0) */}
          {fillIdx >= 0 && spillKwh > 5 && (() => {
            const startX = xAt(GEN_FORECAST[fillIdx][0]);
            const endX = xAt(GEN_FORECAST[GEN_FORECAST.length-1][0]);
            const spillPath = GEN_FORECAST.slice(fillIdx).map((p, i) =>
              `${i === 0 ? 'M' : 'L'} ${xAt(p[0]).toFixed(1)} ${yGen(p[1]).toFixed(1)}`
            ).join(' ') + ` L ${endX.toFixed(1)} ${(padT + chartH).toFixed(1)} L ${startX.toFixed(1)} ${(padT + chartH).toFixed(1)} Z`;
            return <path d={spillPath} fill={t.statusWarn} fillOpacity="0.18"/>;
          })()}
          {/* x-axis ticks */}
          {[0, 60, 120, 180, 240].map(m => (
            <text key={m} x={xAt(m)} y={H - 4}
                  fill={t.textSoft} fontSize="9" fontFamily={t.fontLabel}
                  textAnchor="middle" letterSpacing="0.1">{fmtTime(m)}</text>
          ))}
          {/* left axis (kW) */}
          <text x={padL - 5} y={padT + 6} fill={t.textSoft} fontSize="9"
                fontFamily={t.fontLabel} textAnchor="end">{maxGen}</text>
          <text x={padL - 5} y={padT + chartH + 2} fill={t.textSoft} fontSize="9"
                fontFamily={t.fontLabel} textAnchor="end">0 kW</text>
          {/* right axis (SoC %) */}
          <text x={padL + chartW + 4} y={padT + 6}
                fill={t.colorBess} fontSize="9" fontWeight="600"
                fontFamily={t.fontLabel}>100%</text>
          <text x={padL + chartW + 4} y={padT + chartH + 2}
                fill={t.colorBess} fontSize="9" fontWeight="600"
                fontFamily={t.fontLabel}>0% SoC</text>
          {/* legend in-chart */}
          <g transform={`translate(${padL + 6}, ${padT + 6})`}>
            <line x1="0" y1="4" x2="14" y2="4" stroke={sourceMeta.color} strokeWidth="1.5" strokeDasharray="4 2"/>
            <text x="18" y="7" fill={t.textMid} fontSize="9" fontFamily={t.fontLabel} letterSpacing="0.1">{sourceMeta.label} kW</text>
            <line x1="68" y1="4" x2="82" y2="4" stroke={t.colorBess} strokeWidth="2" strokeDasharray="5 2.5"/>
            <text x="86" y="7" fill={t.textMid} fontSize="9" fontFamily={t.fontLabel} letterSpacing="0.1">BESS SoC</text>
          </g>
        </svg>
      </div>
    </div>
  );
}

// ─── Zone E — 24h energy stacked bar ──────────────────────────────
const ENERGY_BARS_D = [
  ['00', 142,  8, 0], ['01', 140, 10, 0], ['02', 138, 12, 0], ['03', 134, 14, 0],
  ['04', 130, 14, 0], ['05', 132,  8, 0], ['06', 134,  6, 0], ['07', 148,  2, 0],
  ['08', 156,  0, 0], ['09', 168,  0, 6], ['10', 178,  0, 12], ['11', 184,  0, 18],
  ['12', 185,  0, 24], ['13', 190,  0, 22], ['14', 192,  0, 18], ['15', 190,  0, 12],
  ['16', 188,  0,  4], ['17', 182,  2, 0], ['18', 176,  4, 0], ['19', 172,  8, 0],
  ['20', 168, 10, 0], ['21', 162, 12, 0], ['22', 152, 12, 0], ['23', 146, 10, 0],
];

function EnergyChartD({ t, density }) {
  const isSov = t.name === 'sovereign';
  const dense = density === 'dense';
  const maxV = Math.max(...ENERGY_BARS_D.map(([_, c, s, e]) => c + s + e));
  const W = 1200, H = dense ? 140 : 170, padL = 40, padR = 40, padB = 24, padT = 8;
  const chartW = W - padL - padR, chartH = H - padB - padT;
  const barW = chartW / ENERGY_BARS_D.length - 4;

  return (
    <div style={{
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: RADIUS[3],
      overflow: 'hidden',
    }}>
      <div style={{
        padding: `${dense ? SPACE[3] : SPACE[4]}px ${SPACE[4]}px`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${t.borderSoft}`,
      }}>
        <div>
          <div style={{
            fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.2,
            color: t.textSoft, textTransform: 'uppercase', fontWeight: 700,
          }}>Energy · 24h · kWh per hour</div>
          <div style={{
            fontFamily: t.fontHeading, fontSize: 18, lineHeight: 1.1, marginTop: 3,
            color: t.text,
            textTransform: isSov ? 'uppercase' : 'none',
            letterSpacing: isSov ? 0.5 : 0,
            fontWeight: isSov ? 400 : 500,
          }}>Power balance</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[4] }}>
          {[
            { label: 'Consumed', color: t.colorCompute, total: '4,142 kWh' },
            { label: 'Stored',   color: t.colorBess,    total: '128 kWh' },
            { label: 'Exported', color: t.colorGrid,    total: '116 kWh' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color }}/>
              <div>
                <div style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft, textTransform: 'uppercase', letterSpacing: 0.1, fontWeight: 600 }}>{l.label}</div>
                <div style={{ fontFamily: t.fontLabel, fontSize: 11, color: t.text, fontWeight: 600 }}>{l.total}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: `${SPACE[2]}px ${SPACE[3]}px ${SPACE[3]}px` }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
          {/* grid */}
          {[0, 0.25, 0.5, 0.75, 1].map(g => (
            <line key={g} x1={padL} x2={W - padR}
                  y1={padT + chartH * (1 - g)}
                  y2={padT + chartH * (1 - g)}
                  stroke={t.chartGrid} strokeWidth="1"/>
          ))}
          {/* y labels */}
          {[0, 0.5, 1].map(g => (
            <text key={g} x={padL - 6} y={padT + chartH * (1 - g) + 3}
                  fill={t.textSoft} fontSize="10"
                  fontFamily={t.fontLabel} textAnchor="end">{Math.round(maxV * g)}</text>
          ))}
          {/* bars */}
          {ENERGY_BARS_D.map(([h, c, s, e], i) => {
            const x = padL + i * (chartW / ENERGY_BARS_D.length) + 2;
            const cH = (c / maxV) * chartH;
            const sH = (s / maxV) * chartH;
            const eH = (e / maxV) * chartH;
            let y = padT + chartH;
            const isNow = i === 14;
            return (
              <g key={i}>
                <rect x={x} y={(y -= cH)} width={barW} height={cH} fill={t.colorCompute} rx="1" opacity={isNow ? 1 : 0.92}/>
                {sH > 0 && <rect x={x} y={(y -= sH)} width={barW} height={sH} fill={t.colorBess} rx="1"/>}
                {eH > 0 && <rect x={x} y={(y -= eH)} width={barW} height={eH} fill={t.colorGrid} rx="1"/>}
                {i % 3 === 0 && (
                  <text x={x + barW / 2} y={H - 6}
                        fill={t.textSoft} fontSize="10"
                        fontFamily={t.fontLabel} textAnchor="middle">{h}:00</text>
                )}
              </g>
            );
          })}
          {/* NOW marker */}
          <line x1={padL + 14 * (chartW / ENERGY_BARS_D.length) + barW / 2 + 2}
                x2={padL + 14 * (chartW / ENERGY_BARS_D.length) + barW / 2 + 2}
                y1={padT - 2} y2={padT + chartH + 4}
                stroke={t.accent} strokeWidth="1" strokeDasharray="3 2" opacity="0.6"/>
          <text x={padL + 14 * (chartW / ENERGY_BARS_D.length) + barW / 2 + 2}
                y={padT + 8}
                fill={t.accent} fontSize="9" fontWeight="700" letterSpacing="0.2"
                fontFamily={t.fontLabel} textAnchor="middle">NOW</text>
        </svg>
      </div>
    </div>
  );
}

// ─── Inspector panel (desktop-native moment #2) ───────────────────
function InspectorPanel({ t, gpu, onClose }) {
  if (!gpu) return null;
  return (
    <div style={{
      position: 'absolute',
      top: 0, right: 0, bottom: 0,
      width: 320,
      background: t.bg,
      borderLeft: `1px solid ${t.border}`,
      boxShadow: t.name === 'sovereign'
        ? '-12px 0 32px rgba(0,0,0,0.4)'
        : '-12px 0 32px rgba(40,30,18,0.12)',
      display: 'flex', flexDirection: 'column',
      zIndex: 10,
      animation: 'inspectorIn 0.2s ease-out',
    }}>
      <div style={{
        padding: `${SPACE[3]}px ${SPACE[4]}px`,
        borderBottom: `1px solid ${t.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.2,
            color: t.textSoft, textTransform: 'uppercase', fontWeight: 700,
          }}>Inspector · GPU</div>
          <div style={{
            fontFamily: t.fontLabel, fontSize: 16, color: t.text, marginTop: 3,
            fontWeight: 600, letterSpacing: 0.05,
          }}>{gpu.server} · GPU {gpu.c}</div>
        </div>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', color: t.textMid,
          fontSize: 18, cursor: 'pointer', padding: 4,
        }}>×</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: SPACE[4] }}>
        {/* big util ring */}
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[4] }}>
          <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
            <RadialGaugeD t={t} value={gpu.util < 5 ? 0 : gpu.util} color={gpu.util < 5 ? t.textFaint : t.colorCompute} size={100}/>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              fontFamily: t.fontLabel, color: t.text,
            }}>
              <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.5, lineHeight: 1 }}>{gpu.util < 5 ? '—' : gpu.util}</div>
              <div style={{ fontSize: 10, color: t.textSoft, marginTop: 2 }}>% UTIL</div>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.18,
              color: t.textSoft, textTransform: 'uppercase', fontWeight: 600,
            }}>State</div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '3px 8px', borderRadius: RADIUS[2],
              background: gpu.util < 5 ? t.statusOffline + '20' : t.statusOk + '18',
              border: `1px solid ${gpu.util < 5 ? t.statusOffline : t.statusOk}55`,
              marginTop: 4,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: gpu.util < 5 ? t.statusOffline : t.statusOk,
              }}/>
              <span style={{
                fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700, letterSpacing: 0.18,
                color: gpu.util < 5 ? t.textSoft : t.statusOk, textTransform: 'uppercase',
              }}>{gpu.util < 5 ? 'Offline' : 'Healthy'}</span>
            </div>
            <div style={{
              fontFamily: t.fontBody, fontSize: 11, color: t.textMid, marginTop: SPACE[2], lineHeight: 1.4,
            }}>{gpu.util < 5 ? 'No samples in last 30s' : `Steady at ${gpu.util}% over 5m`}</div>
          </div>
        </div>

        {/* measurements */}
        <div style={{ marginTop: SPACE[5] }}>
          <div style={{
            fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.2,
            color: t.textSoft, textTransform: 'uppercase', fontWeight: 700,
            marginBottom: SPACE[2],
          }}>Measurements</div>
          {[
            { k: 'Power draw',   v: gpu.util < 5 ? '—' : `${(gpu.util*7.5/100).toFixed(1)} kW`, sub: 'cap 1.0 kW' },
            { k: 'GPU 12V rail', v: gpu.util < 5 ? '—' : '12.08 V DC',                          sub: 'nominal' },
            { k: 'Core temp',    v: gpu.util < 5 ? '—' : '64 °C',                                sub: 'limit 87 °C' },
            { k: 'Coolant ΔT',   v: gpu.util < 5 ? '—' : '7.2 °C',                               sub: 'in 24 / out 31' },
            { k: 'Fan RPM',      v: gpu.util < 5 ? '—' : '4,200',                                sub: 'normal range' },
            { k: 'ECC errors',   v: '0',                                                         sub: '24h cumulative' },
            { k: 'Status.Health',v: gpu.util < 5 ? 'Absent' : 'OK',                              sub: 'Redfish BMC' },
          ].map(m => (
            <div key={m.k} style={{
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
              padding: '7px 0', borderBottom: `1px solid ${t.borderSoft}`, gap: SPACE[3],
            }}>
              <span style={{ fontFamily: t.fontBody, fontSize: 12, color: t.textMid }}>{m.k}</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: t.fontLabel, fontSize: 12, color: t.text, fontWeight: 600 }}>{m.v}</div>
                <div style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft, letterSpacing: 0.1 }}>{m.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: SPACE[5], display: 'flex', gap: SPACE[2] }}>
          <button style={{
            flex: 1, padding: '8px 12px', borderRadius: RADIUS[2],
            background: t.bg, border: `1px solid ${t.border}`, color: t.text,
            fontFamily: t.fontLabel, fontSize: 11, fontWeight: 600, letterSpacing: 0.15,
            textTransform: 'uppercase', cursor: 'pointer',
          }}>Open detail →</button>
          <button style={{
            flex: 1, padding: '8px 12px', borderRadius: RADIUS[2],
            background: 'transparent', border: `1px solid ${t.border}`, color: t.textMid,
            fontFamily: t.fontLabel, fontSize: 11, fontWeight: 600, letterSpacing: 0.15,
            textTransform: 'uppercase', cursor: 'pointer',
          }}>Pin to Analyst</button>
        </div>
      </div>
    </div>
  );
}

// ─── Composed desktop Overview page body ──────────────────────────
function OverviewDesktopBody({ t, density, selectedGpu, onSelectGpu }) {
  const dense = density === 'dense';
  const pad = dense ? SPACE[4] : SPACE[5];
  const gap = dense ? SPACE[3] : SPACE[4];
  return (
    <div style={{
      flex: 1, overflowY: 'auto', position: 'relative',
      background: t.bg,
    }}>
      <SiteHealthBar t={t}/>
      <div style={{
        padding: pad,
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap,
      }}>
        {/* LEFT — Zone B + B2 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap, minWidth: 0 }}>
          <GpuHeatmap t={t} density={density}
                       onSelectGpu={onSelectGpu}
                       selectedGpu={selectedGpu}/>
          <StrandedCapacityD t={t}/>
          <ForecastCard t={t} density={density} source="pv"/>
        </div>
        {/* RIGHT — Zone C + D */}
        <div style={{ display: 'flex', flexDirection: 'column', gap, minWidth: 0 }}>
          <KpiBessSoc t={t}/>
          <KpiNetPower t={t}/>
          <KpiPue t={t}/>
          <AlarmsPanelD t={t} density={density}/>
        </div>
      </div>
      {/* Zone E — full width below fold */}
      <div style={{ padding: `0 ${pad}px ${pad}px` }}>
        <EnergyChartD t={t} density={density}/>
      </div>
    </div>
  );
}

window.OverviewDesktopBody = OverviewDesktopBody;
window.InspectorPanel = InspectorPanel;
