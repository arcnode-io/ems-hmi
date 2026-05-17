// compute-detail-desktop.jsx — Compute module detail (`/modules/compute/:id`) at desktop breakpoint.
// Spec: ems-hmi-ia-brief.md §6.2 Compute detail · §7.7 desktop adaptation.
//
// Same scenario as the mobile screen — COMPUTE-CLUSTER under power-cap pressure
// (5 GPUs ≥ 95% of cap, 2 capped at 100%) so reviewers can read both breakpoints
// side-by-side. The diagnostic story is identical at both sizes:
//   1) draw/cap distribution (the why) — hero center panel
//   2) GPU heatmap (the where)         — pinpoints which servers/GPUs
//   3) throttle events (the so what)    — has anything actually capped recently
//   4) controls (the response)          — power-limit, reset, LOTO
//
// Layout (1440 - 220 sidebar = 1220 work area):
//   ┌─ page header (back · name · sub · warn pill · live · actions) ──────┐
//   ├─ left rail (320) ─┬─ center (flex) ────────────┬─ right rail (340) ──┤
//   │  hero KPIs        │  Draw/cap histogram        │  Active warnings    │
//   │  compliance chips │  GPU heatmap (32×8)        │  Top constrained    │
//   │                   │                            │  Throttle 24h       │
//   └───────────────────┴─ controls (full width) ────┴─────────────────────┘

const C       = window.COMPUTE_DATA;
const CMTX    = window.COMPUTE_GPU_MATRIX;
const CHIST   = window.COMPUTE_DRAW_HIST;
const CTOPC   = window.COMPUTE_TOP_CONSTRAINED;
const CALMS   = window.COMPUTE_ALARMS_DATA;
const CEVT    = window.COMPUTE_THROTTLE_EVENTS;
const cSrvDet = window.computeServerDetail;
const cRatioC = window.computeRatioColor;

// ─── Page header ──────────────────────────────────────────────────
function ComputeDeskHeader({ t, density }) {
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
        }}>{C.name}</div>
        <div style={{
          fontFamily: t.fontLabel, fontSize: 10, letterSpacing: 0.18,
          color: t.textSoft, marginTop: 2, textTransform: 'uppercase',
        }}>{C.sub} · /modules/compute/{C.id}</div>
      </div>

      {/* warn pill — 2 active warnings */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 10px', borderRadius: RADIUS[2],
        background: t.statusWarn + '18',
        border: `1px solid ${t.statusWarn}`,
        color: t.statusWarn,
        fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700, letterSpacing: 0.18,
        textTransform: 'uppercase',
      }}>
        <IconWarning size={11} color={t.statusWarn}/>
        2 Warn · power cap pressure
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
        <div style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft, letterSpacing: 0.1, marginTop: 2 }}>
          AUTO · operating mode
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button style={cBtnGhost(t)}>Audit log</button>
        <button style={cBtnGhost(t)}>Export CSV</button>
      </div>
    </div>
  );
}
function cBtnGhost(t) {
  return {
    background: 'transparent', border: `1px solid ${t.border}`, color: t.textMid,
    padding: '6px 12px', borderRadius: RADIUS[2],
    fontFamily: t.fontLabel, fontSize: 11, fontWeight: 600, letterSpacing: 0.05,
    cursor: 'pointer', whiteSpace: 'nowrap',
  };
}

// ─── Left rail: cap policy provenance ────────────────────────────
// CAP 256 kW is EMS-set, not hardware TDP — operator needs to know that and
// where the policy comes from. Tappable like the dispatch card on Energy.
function CapPolicyCard({ t }) {
  const [open, setOpen] = React.useState(false);
  return (
    <button onClick={() => setOpen(o => !o)} style={{
      background: t.panel, border: `1px solid ${t.border}`,
      borderLeft: `3px solid ${t.colorCompute}`,
      borderRadius: RADIUS[3], padding: SPACE[4],
      display: 'flex', flexDirection: 'column', gap: SPACE[3],
      cursor: 'pointer', textAlign: 'left', font: 'inherit', color: 'inherit',
      width: '100%',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{
          fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700, letterSpacing: 0.18,
          color: t.textSoft, textTransform: 'uppercase',
        }}>Cap policy</div>
        <div style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft, letterSpacing: 0.12,
                      textTransform: 'uppercase' }}>{open ? 'less ▴' : 'more ▾'}</div>
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontFamily: t.fontLabel, fontSize: 22, fontWeight: 600, color: t.text,
                          letterSpacing: -0.4, lineHeight: 1 }}>256</span>
          <span style={{ fontFamily: t.fontLabel, fontSize: 11, color: t.textMid, fontWeight: 500 }}>kW</span>
          <span style={{ flex: 1 }}/>
          <span style={{
            fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700, letterSpacing: 0.18,
            color: t.colorCompute, textTransform: 'uppercase',
            padding: '2px 6px', border: `1px solid ${t.colorCompute}55`, borderRadius: RADIUS[1],
          }}>EMS-set</span>
        </div>
        <div style={{ fontFamily: t.fontLabel, fontSize: 10, color: t.textSoft, letterSpacing: 0.1,
                      textTransform: 'uppercase', marginTop: 4 }}>
          Cluster draw cap · NOT hardware TDP
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4,
                    fontFamily: t.fontLabel, fontSize: 11, color: t.textMid, letterSpacing: 0.05 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ color: t.textSoft }}>Set by</span>
          <span style={{ color: t.text, fontWeight: 600 }}>Power Allocation v3.2</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ color: t.textSoft }}>Reason</span>
          <span style={{ color: t.text, fontWeight: 600 }}>PCC headroom · grid-svc</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ color: t.textSoft }}>Hardware ceiling</span>
          <span style={{ color: t.text, fontWeight: 600 }}>1.49 MW (728 W × 256 GPU)</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ color: t.textSoft }}>Last change</span>
          <span style={{ color: t.text, fontWeight: 600 }}>04-26 · ops-sup</span>
        </div>
      </div>
      {open && (
        <div style={{
          marginTop: 4, paddingTop: SPACE[3], borderTop: `1px solid ${t.borderSoft}`,
          display: 'flex', flexDirection: 'column', gap: 6,
          fontFamily: t.fontBody, fontSize: 12, color: t.textMid, lineHeight: 1.45,
        }}>
          <div>
            Cluster cap is a <strong style={{ color: t.text }}>live dispatch decision</strong> — the EMS
            allocates compute draw against grid-services obligations and PCC headroom. Hardware can pull
            ~1.49 MW; we are limiting to 256 kW so the BESS can hold its frequency-response duty.
          </div>
          <div style={{
            display: 'flex', gap: 6, marginTop: 4,
            fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700, letterSpacing: 0.15,
            color: t.accent, textTransform: 'uppercase',
          }}>
            <span>Open policy →</span>
            <span>·</span>
            <span>Audit trail →</span>
          </div>
        </div>
      )}
    </button>
  );
}

// ─── Left rail: hero KPIs + compliance ────────────────────────────
function ComputeHeroDesk({ t }) {
  return (
    <div style={{
      background: t.panel, border: `1px solid ${t.border}`,
      borderLeft: `3px solid ${t.statusWarn}`,
      borderRadius: RADIUS[3], padding: SPACE[4],
      display: 'flex', flexDirection: 'column', gap: SPACE[4],
    }}>
      {/* KPI grid 2×2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: SPACE[4], columnGap: SPACE[3] }}>
        <BigKV t={t} label="Unit util"  value={C.utilPct.toFixed(0)} unit="%"   color={t.colorCompute}/>
        <BigKV t={t} label="Headroom"   value={`+${C.headroomKw.toFixed(1)}`} unit="kW" color={t.colorBess}/>
        <BigKV t={t} label="Draw"       value={C.drawKw.toFixed(1)} unit="kW"  color={t.text} sub="AC"/>
        <BigKV t={t} label="Cap"        value={C.capKw.toFixed(0)}  unit="kW"  color={t.textMid} sub="EMS-SET"/>
      </div>

      {/* Cap pressure mini-bar */}
      <div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700, letterSpacing: 0.18,
          color: t.textSoft, textTransform: 'uppercase', marginBottom: 6,
        }}>
          <span>Cap pressure</span>
          <span style={{ color: t.text, fontWeight: 700 }}>{Math.round((C.drawKw / C.capKw) * 100)}%</span>
        </div>
        <div style={{ position: 'relative', height: 8, background: t.border, borderRadius: 4 }}>
          <div style={{
            position: 'absolute', inset: 0, width: `${(C.drawKw / C.capKw) * 100}%`,
            background: `linear-gradient(90deg, ${t.colorCompute}, ${t.statusWarn})`,
            borderRadius: 4,
          }}/>
          {/* WARN tick at 95% */}
          <div style={{ position: 'absolute', left: '95%', top: -2, bottom: -2, width: 1.5,
                        background: t.statusWarn, opacity: 0.9 }}/>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4,
                      fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft, letterSpacing: 0.1 }}>
          <span>0</span><span style={{ color: t.statusWarn, fontWeight: 700, letterSpacing: 0.18,
                                       textTransform: 'uppercase' }}>WARN 95%</span><span>{C.capKw} kW</span>
        </div>
      </div>

      <div style={{ height: 1, background: t.border }}/>

      {/* Compliance chips */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <ComplianceRow t={t} label="NVLink fabric" value={C.nvlink}    state="ok"/>
        <ComplianceRow t={t} label="NERC CIP"      value={C.nercCip}   state="ok"/>
        <ComplianceRow t={t} label="ECC error rate" value={`${C.eccErrors1h} err / hr`} sub="> 5 = WARN" state="warn"/>
        <ComplianceRow t={t} label="Throttle 24h"  value={`${C.throttleEvents24h} event${C.throttleEvents24h === 1 ? '' : 's'}`}
                              state={C.throttleEvents24h > 0 ? 'warn' : 'ok'}/>
      </div>

      {/* Run mode */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8,
                    paddingTop: SPACE[3], borderTop: `1px solid ${t.borderSoft}` }}>
        <div style={{
          fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700, letterSpacing: 0.18,
          color: t.textSoft, textTransform: 'uppercase',
        }}>Run mode</div>
        <div style={{ flex: 1 }}/>
        <div style={{
          padding: '3px 10px', borderRadius: RADIUS.full,
          background: t.statusOk + '15', border: `1px solid ${t.statusOk}55`,
          fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700, letterSpacing: 0.15,
          color: t.statusOk, textTransform: 'uppercase',
        }}>{C.runMode}</div>
      </div>
    </div>
  );
}

function BigKV({ t, label, value, unit, color, sub }) {
  return (
    <div>
      <div style={{
        fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700, letterSpacing: 0.18,
        color: t.textSoft, textTransform: 'uppercase',
      }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
        <span style={{
          fontFamily: t.fontLabel, fontSize: 26, fontWeight: 600, color,
          letterSpacing: -0.6, lineHeight: 1, whiteSpace: 'nowrap',
        }}>{value}</span>
        <span style={{ fontFamily: t.fontLabel, fontSize: 12, color: t.textMid, fontWeight: 500 }}>{unit}</span>
      </div>
      {sub && (
        <div style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft, letterSpacing: 0.15, marginTop: 2,
                      textTransform: 'uppercase' }}>{sub}</div>
      )}
    </div>
  );
}

function ComplianceRow({ t, label, value, sub, state }) {
  const c = state === 'warn' ? t.statusWarn : state === 'ok' ? t.statusOk : t.text;
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <span style={{ fontFamily: t.fontLabel, fontSize: 10, color: t.textSoft, letterSpacing: 0.12,
                     textTransform: 'uppercase', flex: 1 }}>{label}</span>
      <span style={{ fontFamily: t.fontLabel, fontSize: 11, color: c, fontWeight: 700, letterSpacing: 0.1,
                     textTransform: 'uppercase' }}>{value}</span>
      {sub && (
        <span style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft, letterSpacing: 0.1,
                       textTransform: 'uppercase', opacity: 0.85 }}>· {sub}</span>
      )}
    </div>
  );
}

// ─── Center: Draw/cap histogram (big) ─────────────────────────────
function DrawCapHistDesk({ t }) {
  const W = 760, H = 220, padL = 44, padR = 14, padT = 18, padB = 36;
  const max = Math.max(...CHIST.map(b => b[1]));
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const N = CHIST.length;
  const barW = innerW / N - 4;
  const xAt = frac => padL + frac * innerW;
  const warnX = xAt(0.95 / 1.1);
  const alarmX = xAt(1.00 / 1.1);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: SPACE[2] }}>
        <div>
          <div style={{
            fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700, letterSpacing: 0.2,
            color: t.textSoft, textTransform: 'uppercase',
          }}>Draw / cap distribution</div>
          <div style={{ fontFamily: t.fontHeading, fontSize: 18, color: t.text, marginTop: 2,
                        fontWeight: t.name === 'sovereign' ? 400 : 500 }}>
            256 GPUs · <span style={{ color: t.statusWarn }}>5 ≥ 95%</span> · <span style={{ color: t.statusAlarm }}>2 capped</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: SPACE[3], fontFamily: t.fontLabel, fontSize: 10 }}>
          <CStat t={t} label="Median" val="83%"/>
          <CStat t={t} label="P95"    val="97%"  color={t.statusWarn}/>
          <CStat t={t} label="Max"    val="100%" color={t.statusAlarm}/>
        </div>
      </div>
      <svg width={W} height={H} style={{ display: 'block', maxWidth: '100%' }}>
        {/* y-axis ticks */}
        {[0, Math.round(max/3), Math.round(max*2/3), max].map((v, i) => (
          <g key={i}>
            <line x1={padL} x2={padL + innerW}
                  y1={padT + innerH - (v / max) * innerH}
                  y2={padT + innerH - (v / max) * innerH}
                  stroke={t.borderSoft} strokeDasharray="2 4"/>
            <text x={padL - 8} y={padT + innerH - (v / max) * innerH + 4} textAnchor="end"
                  fontFamily={t.fontLabel} fontSize={10} fill={t.textSoft}>{v}</text>
          </g>
        ))}
        {/* Bars */}
        {CHIST.map(([label, count], i) => {
          const xL = padL + (i / N) * innerW;
          const h = max > 0 ? (count / max) * innerH : 0;
          const isWarn  = i === 9;
          const isAlarm = i === 10;
          const c = count === 0 ? t.borderSoft
                  : isAlarm ? t.statusAlarm
                  : isWarn  ? t.statusWarn
                  : t.colorCompute;
          return (
            <g key={i}>
              {count > 0 && (
                <rect x={xL + 2} y={padT + innerH - h} width={barW} height={h}
                      fill={c} fillOpacity={(isAlarm || isWarn) ? 1 : 0.85} rx={1.5}/>
              )}
              {count > 0 && (
                <text x={xL + 2 + barW / 2} y={padT + innerH - h - 4} textAnchor="middle"
                      fontFamily={t.fontLabel} fontSize={9} fontWeight={isAlarm || isWarn ? 700 : 400}
                      fill={isAlarm ? t.statusAlarm : isWarn ? t.statusWarn : t.textMid}>
                  {count}
                </text>
              )}
              <text x={xL + 2 + barW / 2} y={padT + innerH + 14} textAnchor="middle"
                    fontFamily={t.fontLabel} fontSize={9} fill={t.textSoft}>{label}</text>
            </g>
          );
        })}
        {/* Threshold lines */}
        <line x1={warnX} y1={padT} x2={warnX} y2={padT + innerH}
              stroke={t.statusWarn} strokeWidth={1.5} strokeDasharray="4 3"/>
        <line x1={alarmX} y1={padT} x2={alarmX} y2={padT + innerH}
              stroke={t.statusAlarm} strokeWidth={1.5} strokeDasharray="4 3"/>
        <text x={warnX - 4} y={padT + 10} textAnchor="end" fontFamily={t.fontLabel} fontSize={9}
              fill={t.statusWarn} fontWeight={700} letterSpacing="0.1em">WARN ≥ 0.95</text>
        <text x={alarmX + 4} y={padT + 10} fontFamily={t.fontLabel} fontSize={9}
              fill={t.statusAlarm} fontWeight={700} letterSpacing="0.1em">CAP ≥ 1.00</text>
        {/* Axis label */}
        <text x={padL + innerW / 2} y={H - 6} textAnchor="middle"
              fontFamily={t.fontLabel} fontSize={9} fill={t.textSoft}
              letterSpacing="0.18em">DRAW / CAP RATIO</text>
      </svg>
    </div>
  );
}

function CStat({ t, label, val, color }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.18, color: t.textSoft,
                    textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: color || t.text, marginTop: 1 }}>{val}</div>
    </div>
  );
}

// ─── Center: GPU heatmap (32 servers × 8 GPUs, full-width row) ─────
function GpuHeatmapDesk({ t }) {
  const [selected, setSelected] = React.useState(3); // pre-select srv-04 so the per-GPU answer is visible
  // Full-width canvas (1140px area) so all 32 servers × 8 GPUs render unclipped.
  const cellW = 64, cellH = 20, gap = 3;
  const labelW = 56;
  const sel = selected != null ? CMTX[selected] : null;

  // Per-GPU strip helpers (NVLink domain on H100 SXM5: all 8 GPUs share one fabric;
  // PCIe / CPU root differs — 0–3 on CPU0, 4–7 on CPU1).
  const cpuRoot = (g) => g < 4 ? 'CPU0' : 'CPU1';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: SPACE[2] }}>
        <div>
          <div style={{
            fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700, letterSpacing: 0.2,
            color: t.textSoft, textTransform: 'uppercase',
          }}>GPU heatmap · 32 servers × 8 GPUs = 256</div>
          <div style={{ fontFamily: t.fontHeading, fontSize: 18, color: t.text, marginTop: 2,
                        fontWeight: t.name === 'sovereign' ? 400 : 500 }}>
            Click a server row for per-GPU detail
          </div>
        </div>
        {/* Legend + capped vs throttled glossary */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div style={{ display: 'flex', gap: 10, fontFamily: t.fontLabel, fontSize: 10,
                        color: t.textSoft, letterSpacing: 0.1, textTransform: 'uppercase', alignItems: 'center' }}>
            <CLegend t={t} c={t.statusOffline} l="idle"/>
            <CLegend t={t} c={t.colorCompute}  l="< 85%"/>
            <CLegend t={t} c={t.text}          l="85–94%"/>
            <CLegend t={t} c={t.statusWarn}    l="95–99%"/>
            <CLegend t={t} c={t.statusAlarm}   l="≥ 100% capped"/>
          </div>
          <div style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft, letterSpacing: 0.1 }}>
            <strong style={{ color: t.statusAlarm }}>CAPPED</strong> = at EMS draw cap ·
            <strong style={{ color: t.text, marginLeft: 6 }}>THROTTLED</strong> = firmware reduced clock
          </div>
        </div>
      </div>

      {/* Two-column layout for 32 rows: 16 rows per column, side-by-side, each with its own GPU header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: SPACE[4] }}>
        {[0, 1].map(col => (
          <div key={col}>
            {/* GPU header (per side) */}
            <div style={{ display: 'flex', gap, marginLeft: labelW + 6, marginBottom: 4 }}>
              {Array.from({ length: 8 }).map((_, g) => (
                <div key={g} style={{
                  width: cellW, fontFamily: t.fontLabel, fontSize: 9,
                  color: t.textSoft, textAlign: 'center', letterSpacing: 0.12,
                }}>GPU-{g}</div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap }}>
              {CMTX.slice(col * 16, (col + 1) * 16).map((row, rIdx) => {
                const sIdx = col * 16 + rIdx;
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
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: rowBg, border: `1px solid ${rowBd}`, borderRadius: 3,
                    padding: '2px 4px 2px 2px', cursor: 'pointer', textAlign: 'left',
                    fontFamily: 'inherit',
                  }}>
                    <div style={{
                      width: labelW, fontFamily: t.fontLabel, fontSize: 10,
                      color: isSel ? t.accent : t.textMid, textAlign: 'right', letterSpacing: 0.1,
                      fontWeight: isSel ? 700 : 600, flexShrink: 0, paddingRight: 4,
                    }}>srv-{String(sIdx + 1).padStart(2, '0')}</div>
                    <div style={{ display: 'flex', gap }}>
                      {row.map((v, g) => (
                        <div key={g} style={{
                          width: cellW, height: cellH, borderRadius: 1.5,
                          background: cRatioC(t, v),
                          opacity: v < 0.40 ? 0.5 : 1,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700,
                          color: v >= 0.95 ? '#fff'
                                : v < 0.40 ? t.bg
                                : v >= 0.85 ? t.bg
                                : t.bg,
                        }}>
                          {Math.round(v * 100)}
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Selection detail: per-GPU strip + NVLink / PCIe domain answer */}
      {sel && (
        <div style={{
          marginTop: SPACE[3], padding: '12px 14px',
          background: t.bg, border: `1px solid ${t.accent}55`, borderRadius: RADIUS[2],
          display: 'flex', flexDirection: 'column', gap: SPACE[3],
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[4] }}>
            <div style={{
              fontFamily: t.fontLabel, fontSize: 13, fontWeight: 700, letterSpacing: 0.15,
              color: t.text, textTransform: 'uppercase',
            }}>srv-{String(selected + 1).padStart(2, '0')}</div>
            <div style={{ display: 'flex', gap: SPACE[3], fontFamily: t.fontLabel, fontSize: 11, color: t.textMid }}>
              <span>peak <span style={{ color: Math.max(...sel) >= 1.0 ? t.statusAlarm : Math.max(...sel) >= 0.95 ? t.statusWarn : t.text, fontWeight: 700 }}>{Math.round(Math.max(...sel) * 100)}%</span></span>
              <span>avg <span style={{ color: t.text, fontWeight: 700 }}>{Math.round(sel.reduce((a,b)=>a+b,0) / sel.length * 100)}%</span></span>
              <span>draw <span style={{ color: t.text, fontWeight: 700 }}>{((sel.reduce((a,b)=>a+b,0) / sel.length) * 728 * 8 / 1000).toFixed(2)} kW</span></span>
              <span>capped <span style={{ color: sel.filter(v => v >= 1.0).length > 0 ? t.statusAlarm : t.text, fontWeight: 700 }}>{sel.filter(v => v >= 1.0).length}</span></span>
              <span>throttled 24h <span style={{ color: t.text, fontWeight: 700 }}>{selected === 3 ? 1 : 0}</span></span>
            </div>
            <div style={{ flex: 1 }}/>
            <button style={cBtnGhost(t)}>Open server</button>
            <button onClick={() => setSelected(null)} style={{
              background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
              color: t.textSoft, fontFamily: t.fontLabel, fontSize: 10, letterSpacing: 0.15,
              textTransform: 'uppercase', fontWeight: 600,
            }}>Close ✕</button>
          </div>

          {/* Per-GPU strip with PCIe/NVLink domain markers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[3] }}>
            <div style={{
              fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700, letterSpacing: 0.15,
              color: t.textSoft, textTransform: 'uppercase', width: 56, textAlign: 'right',
            }}>Per GPU</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {sel.map((v, g) => {
                const isCap = v >= 1.0;
                const isWarn = v >= 0.95 && v < 1.0;
                const c = isCap ? t.statusAlarm : isWarn ? t.statusWarn : t.colorCompute;
                return (
                  <div key={g} style={{
                    width: 78, padding: '6px 8px',
                    border: `1px solid ${isCap ? t.statusAlarm : t.borderSoft}`,
                    borderRadius: RADIUS[1],
                    background: isCap ? t.statusAlarm + '12' : 'transparent',
                    display: 'flex', flexDirection: 'column', gap: 2,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700,
                                     color: t.text, letterSpacing: 0.1 }}>GPU-{g}</span>
                      <span style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft, letterSpacing: 0.1 }}>{cpuRoot(g)}</span>
                    </div>
                    <div style={{ fontFamily: t.fontLabel, fontSize: 14, fontWeight: 600,
                                  color: c, letterSpacing: -0.2 }}>{Math.round(v * 100)}%</div>
                    <div style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textMid, letterSpacing: 0.05 }}>
                      {Math.round(v * 728)} W
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Diagnosis line — only when capped GPUs exist */}
          {sel.filter(v => v >= 1.0).length >= 2 && (
            <div style={{
              padding: '10px 12px',
              background: t.statusAlarm + '0d',
              borderLeft: `3px solid ${t.statusAlarm}`,
              borderRadius: RADIUS[1],
              fontFamily: t.fontBody, fontSize: 12, color: t.textMid, lineHeight: 1.5,
            }}>
              <div style={{
                fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700, letterSpacing: 0.15,
                color: t.statusAlarm, textTransform: 'uppercase', marginBottom: 4,
              }}>Diagnosis · {sel.filter(v => v >= 1.0).length} capped on this server</div>
              <span style={{ color: t.text }}>GPU-1 (CPU0) and GPU-5 (CPU1)</span> are different PCIe roots
              but share <strong style={{ color: t.text }}>one NVLink fabric</strong> (NVSwitch v3, all 8 GPUs).
              Both at 100% of EMS cap suggests <strong style={{ color: t.text }}>workload‐placement</strong> against
              the cap (collective op pinning peers), not a power-delivery fault. Throttle event 1.4 h ago
              correlates. Recommend: rebalance via scheduler before raising cap.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
function CLegend({ t, c, l }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 10, height: 10, background: c, borderRadius: 1.5 }}/>
      {l}
    </span>
  );
}

// ─── Right rail: Active warnings ──────────────────────────────────
function ComputeAlarmsDesk({ t }) {
  return (
    <div style={{
      background: t.panel, border: `1px solid ${t.border}`,
      borderRadius: RADIUS[3], padding: SPACE[4],
      display: 'flex', flexDirection: 'column', gap: SPACE[3],
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700,
                      letterSpacing: 0.2, color: t.textSoft, textTransform: 'uppercase' }}>
          Active warnings · {CALMS.length}
        </div>
        <div style={{ fontFamily: t.fontLabel, fontSize: 10, color: t.textSoft, letterSpacing: 0.1 }}>
          0 unack
        </div>
      </div>
      {CALMS.map(a => (
        <div key={a.code} style={{
          display: 'flex', flexDirection: 'column', gap: 6,
          padding: SPACE[3], borderRadius: RADIUS[2],
          background: t.statusWarn + '10',
          borderLeft: `3px solid ${t.statusWarn}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconWarning size={14} color={t.statusWarn}/>
            <span style={{ fontFamily: t.fontLabel, fontSize: 11, fontWeight: 700, letterSpacing: 0.15,
                            color: t.statusWarn, textTransform: 'uppercase' }}>{a.code}</span>
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
              background: t.statusWarn, color: '#fff', border: 'none',
              padding: '6px 10px', borderRadius: RADIUS[2],
              fontFamily: t.fontLabel, fontSize: 11, fontWeight: 700, letterSpacing: 0.12,
              textTransform: 'uppercase', cursor: 'pointer',
            }}>Acknowledge</button>
            <button style={cBtnGhost(t)}>Runbook</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Right rail: Top constrained servers ──────────────────────────
function TopServersDesk({ t }) {
  return (
    <div style={{
      background: t.panel, border: `1px solid ${t.border}`,
      borderRadius: RADIUS[3], padding: SPACE[4],
      display: 'flex', flexDirection: 'column', gap: SPACE[3],
    }}>
      <div style={{ fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700,
                    letterSpacing: 0.2, color: t.textSoft, textTransform: 'uppercase' }}>
        Top 3 · cap pressure
      </div>
      {CTOPC.map((s, i) => {
        const d = cSrvDet(s.name, s.peak, s.avgDraw);
        const ratio = d.drawW / d.capW;
        const ringC = ratio >= 1.0 ? t.statusAlarm : ratio >= 0.95 ? t.statusWarn : t.colorCompute;
        return (
          <div key={s.name} style={{
            display: 'flex', alignItems: 'center', gap: SPACE[3],
            paddingTop: i > 0 ? SPACE[3] : 0,
            borderTop: i > 0 ? `1px solid ${t.borderSoft}` : 'none',
          }}>
            <DeskServerRing t={t} ratio={ratio} color={ringC} size={48}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: t.fontLabel, fontSize: 13, fontWeight: 700,
                               color: t.text, letterSpacing: 0.1 }}>{s.name}</span>
                <span style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft,
                               letterSpacing: 0.15, textTransform: 'uppercase' }}>{d.note}</span>
              </div>
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4,
                fontFamily: t.fontLabel, fontSize: 10, color: t.textMid, letterSpacing: 0.05,
              }}>
                <DeskInline label="Draw" value={`${(d.drawW/1000).toFixed(2)} kW`} c={t.text}/>
                <DeskInline label="GPU°" value={`${d.tempC} °C`} c={t.text}/>
                <DeskInline label="ECC"  value={String(d.ecc)}     c={d.ecc > 0 ? t.statusWarn : t.textMid}/>
                <DeskInline label="BMC"  value={d.bmc}            c={d.bmc === 'OK' ? t.statusOk : t.statusWarn}/>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
function DeskInline({ label, value, c }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
      <span style={{ opacity: 0.7, fontWeight: 600, fontSize: 9, letterSpacing: 0.18, textTransform: 'uppercase' }}>{label}</span>
      <span style={{ color: c, fontWeight: 600 }}>{value}</span>
    </span>
  );
}
function DeskServerRing({ t, ratio, color, size }) {
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
            fontFamily={t.fontLabel} fontSize="12" fontWeight="600"
            fill={t.text} letterSpacing="-0.2">{Math.round(ratio * 100)}</text>
      <text x={c} y={c + 12} textAnchor="middle"
            fontFamily={t.fontLabel} fontSize="6.5" fontWeight="600"
            letterSpacing="0.2" fill={t.textSoft}>%CAP</text>
    </svg>
  );
}

// ─── Right rail: Throttle 24h timeline ────────────────────────────
function ThrottleTimelineDesk({ t }) {
  const W = 308, H = 80, padL = 8, padR = 8, padT = 12, padB = 24;
  const trackY = H - padB - 8;
  return (
    <div style={{
      background: t.panel, border: `1px solid ${t.border}`,
      borderRadius: RADIUS[3], padding: SPACE[4],
      display: 'flex', flexDirection: 'column', gap: SPACE[3],
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700,
                      letterSpacing: 0.2, color: t.textSoft, textTransform: 'uppercase' }}>
          Throttle events · 24h
        </div>
        <div style={{ fontFamily: t.fontLabel, fontSize: 10,
                      color: CEVT.length > 0 ? t.statusAlarm : t.textSoft, letterSpacing: 0.1, fontWeight: 700 }}>
          {CEVT.length} event{CEVT.length === 1 ? '' : 's'}
        </div>
      </div>
      <div style={{ fontFamily: t.fontLabel, fontSize: 10, color: t.textSoft, letterSpacing: 0.05,
                    lineHeight: 1.5 }}>
        <strong style={{ color: t.text }}>Throttled</strong> = firmware reduced clock.
        <strong style={{ color: t.text, marginLeft: 4 }}>Capped</strong> = at EMS draw cap.
        2 at cap now · 1 throttled (22 s, 1.4 h ago).
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        <line x1={padL} y1={trackY} x2={W - padR} y2={trackY}
              stroke={t.borderSoft} strokeWidth={1.5} strokeLinecap="round"/>
        {[0, 6, 12, 18, 24].map(h => {
          const x = padL + ((24 - h) / 24) * (W - padL - padR);
          return (
            <g key={h}>
              <line x1={x} y1={trackY - 3} x2={x} y2={trackY + 3} stroke={t.textSoft} strokeWidth={1}/>
              <text x={x} y={H - 4} textAnchor="middle"
                    fontFamily={t.fontLabel} fontSize="9" fill={t.textSoft}>
                {h === 0 ? 'NOW' : `${h}h`}
              </text>
            </g>
          );
        })}
        {CEVT.map((e, i) => {
          const x = padL + ((24 - e.hoursAgo) / 24) * (W - padL - padR);
          return (
            <g key={i}>
              <line x1={x} y1={padT + 8} x2={x} y2={trackY} stroke={t.statusAlarm}
                    strokeWidth={1} strokeDasharray="2 2" opacity={0.6}/>
              <circle cx={x} cy={trackY} r={4.5} fill={t.statusAlarm}/>
              <text x={x} y={padT + 8} textAnchor="middle"
                    fontFamily={t.fontLabel} fontSize="9" fontWeight="700"
                    letterSpacing="0.15" fill={t.statusAlarm}>
                {e.server} · {e.durationS}s
              </text>
              <text x={x} y={padT + 18} textAnchor="middle"
                    fontFamily={t.fontLabel} fontSize="8"
                    fill={t.textMid}>{e.trigger}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Bottom: Controls (LOTO, run mode, PowerLimit, reset) ─────────
function ComputeControlsDesk({ t }) {
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
        <CtlChip t={t} label="Run mode"     sub="AUTO / MANUAL"/>
        <CtlChip t={t} label="PowerLimit"   sub="728 W per GPU · MANUAL only"/>
        <CtlChip t={t} label="Reset server" sub="Per-server cycle · BMC-gated"/>
        <CtlChip t={t} label="Reset BMC"    sub="LOTO + 2-person concurrence"/>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: RADIUS.full,
          background: t.bg, border: `1px solid ${t.border}`,
          fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700, letterSpacing: 0.18,
          color: t.textMid, textTransform: 'uppercase',
        }}>
          🔒 LOTO required for BMC reset
        </div>
        <div style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft, letterSpacing: 0.1 }}>
          Last cmd: 2026-04-28 by ops-sup
        </div>
      </div>
    </div>
  );
}
function CtlChip({ t, label, sub }) {
  return (
    <div style={{
      flex: '1 0 180px',
      padding: `${SPACE[2]}px ${SPACE[3]}px`,
      border: `1px solid ${t.border}`,
      borderRadius: RADIUS[2],
      background: t.bg,
      opacity: 0.55,
      cursor: 'not-allowed',
    }}>
      <div style={{ fontFamily: t.fontBody, fontSize: 13, color: t.text, fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: t.fontLabel, fontSize: 10, color: t.textSoft, letterSpacing: 0.05, marginTop: 2 }}>{sub}</div>
    </div>
  );
}

// ─── Body assembly ────────────────────────────────────────────────
function ComputeDeskBody({ t, density }) {
  const PAD = density === 'dense' ? SPACE[4] : SPACE[5];
  const GAP = density === 'dense' ? SPACE[3] : SPACE[4];
  return (
    <div style={{
      flex: 1, overflow: 'auto', minHeight: 0,
      padding: PAD, background: t.bg,
      display: 'grid', gridTemplateColumns: '320px 1fr 340px',
      gridTemplateRows: 'auto auto auto',
      gridTemplateAreas: `
        "left center right"
        "heatmap heatmap heatmap"
        "controls controls controls"
      `,
      gap: GAP,
      alignItems: 'start',
    }}>
      <div style={{ gridArea: 'left', display: 'flex', flexDirection: 'column', gap: GAP }}>
        <ComputeHeroDesk t={t}/>
        <CapPolicyCard t={t}/>
      </div>
      <div style={{ gridArea: 'center', display: 'flex', flexDirection: 'column', gap: GAP }}>
        <div style={{
          background: t.panel, border: `1px solid ${t.border}`,
          borderRadius: RADIUS[3], padding: SPACE[4],
        }}>
          <DrawCapHistDesk t={t}/>
        </div>
      </div>
      <div style={{ gridArea: 'right', display: 'flex', flexDirection: 'column', gap: GAP }}>
        <ComputeAlarmsDesk t={t}/>
        <TopServersDesk t={t}/>
        <ThrottleTimelineDesk t={t}/>
      </div>
      <div style={{ gridArea: 'heatmap' }}>
        <div style={{
          background: t.panel, border: `1px solid ${t.border}`,
          borderRadius: RADIUS[3], padding: SPACE[4],
        }}>
          <GpuHeatmapDesk t={t}/>
        </div>
      </div>
      <div style={{ gridArea: 'controls' }}>
        <ComputeControlsDesk t={t}/>
      </div>
    </div>
  );
}

// ─── Public entry ─────────────────────────────────────────────────
function ComputeDetailDesktopBody({ t, density }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
      <ComputeDeskHeader t={t} density={density}/>
      <ComputeDeskBody t={t} density={density}/>
    </div>
  );
}

window.ComputeDetailDesktopBody = ComputeDetailDesktopBody;
