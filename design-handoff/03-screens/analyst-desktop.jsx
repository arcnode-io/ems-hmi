// analyst-desktop.jsx — Analyst surface at desktop breakpoint (1440 × 900).
//
// v2 — Chat-first layout:
//   • LEFT  : scrollable canvas of chart artifacts (newest at top), each
//             with title, chart, source query, timestamp, actions
//   • RIGHT : ongoing chat conversation with the AI assistant. Each exchange
//             produces a chart artifact that gets pinned to the canvas.
//
// Same data + spec pipeline as the mobile screen (helpers exposed via window
// from analyst-screen.jsx).

const { useState: useStateAD, useRef: useRefAD, useEffect: useEffectAD,
        useCallback: useCallbackAD } = React;

const ANPTS    = window.ANALYST_NPTS;
const aDefs    = window.analystSeriesDefs;
const aColor   = window.analystColorForKey;
const aSpec    = window.analystSpecFromKeys;
const aFall    = window.analystFallbackSpec;
const aTHour   = window.analystTHour;

const AD_QUICK_PROMPTS = [
  'PV vs forecast today',
  'BESS dispatch and price',
  'Compute load today',
  'Grid net flow',
  'GPU temperature average',
];

let __artifactSeq = 0;
const newArtifactId = () => `art-${++__artifactSeq}`;
let __msgSeq = 0;
const newMsgId = () => `msg-${++__msgSeq}`;
const nowLabel = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
};

// ─── Page header ──────────────────────────────────────────────────
function AnalystDeskHeader({ t, density, artifactCount }) {
  const isSov = t.name === 'sovereign';
  const dense = density === 'dense';
  return (
    <div style={{
      padding: `${dense ? 14 : 18}px ${SPACE[5]}px`,
      borderBottom: `1px solid ${t.border}`,
      background: t.bg,
      display: 'flex', alignItems: 'center', gap: SPACE[4], flexShrink: 0,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: t.fontHeading, fontSize: 28, lineHeight: 1.1,
          letterSpacing: isSov ? 0.5 : 0, fontWeight: isSov ? 400 : 500,
          color: t.text, textTransform: isSov ? 'uppercase' : 'none', whiteSpace: 'nowrap',
        }}>{isSov ? 'ANALYST' : 'Analyst'}</div>
        <div style={{
          fontFamily: t.fontLabel, fontSize: 10, letterSpacing: 0.18,
          color: t.textSoft, marginTop: 2, textTransform: 'uppercase',
        }}>Conversational data · chat → charts · /analyst</div>
      </div>

      <div style={{ flex: 1 }}/>

      <div style={{ display: 'flex', gap: 6 }}>
        <AgentToolCard t={t} name="Permutable AI"
                       category="Geopolitical"
                       headline="Strait of Hormuz now uses Bitcoin for toll"
                       status="ok" icon="brain"/>
        <AgentToolCard t={t} name="OpenWeather"
                       category="Weather"
                       headline="ERCOT heat dome · 104°F peak Sat"
                       status="ok" icon="cloud"/>
        <AgentToolCard t={t} name="YES Energy"
                       category="Markets"
                       headline="ERCOT LMP $312 · scarcity pricing"
                       status="live" icon="bolt"/>
      </div>
    </div>
  );
}

// ─── Agent tool intelligence-feed card (header) ───────────────────────
function AgentToolCard({ t, name, category, headline, status, icon }) {
  const dot = status === 'live' ? t.statusOk
            : status === 'warn' ? t.statusWarn
            : status === 'err'  ? t.statusErr
            : t.statusOk;
  const isLive = status === 'live';
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'stretch', gap: 8,
      padding: '7px 11px 7px 9px',
      border: `1px solid ${t.border}`,
      borderRadius: RADIUS[2],
      background: t.surface,
      maxWidth: 240, minWidth: 180,
    }}>
      <span style={{
        width: 24, height: 24, borderRadius: RADIUS[1],
        background: t.bg, border: `1px solid ${t.borderSoft}`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        color: t.textMid, flexShrink: 0, alignSelf: 'flex-start', marginTop: 1,
      }}>
        <AgentToolIcon name={icon}/>
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%', background: dot,
            boxShadow: isLive ? `0 0 0 2px ${dot}30` : 'none',
            flexShrink: 0,
          }}/>
          <span style={{
            fontFamily: t.fontLabel, fontSize: 9.5, fontWeight: 700,
            letterSpacing: 0.18, color: t.textSoft, textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}>{name} · {category}</span>
        </div>
        <div style={{
          fontFamily: t.fontBody || t.fontLabel, fontSize: 11, fontWeight: 600,
          color: t.text, marginTop: 2, lineHeight: 1.25,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>{headline}</div>
      </div>
    </div>
  );
}
function AgentToolIcon({ name }) {
  const p = { width: 12, height: 12, viewBox: '0 0 16 16', fill: 'none',
              stroke: 'currentColor', strokeWidth: 1.6,
              strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (name === 'brain') return (
    <svg {...p}>
      <path d="M6 3.5 a2 2 0 0 0-2 2 v.5 a1.5 1.5 0 0 0-1 1.4 a1.5 1.5 0 0 0 1 1.4 V10 a2 2 0 0 0 2 2 V3.5 z"/>
      <path d="M10 3.5 a2 2 0 0 1 2 2 v.5 a1.5 1.5 0 0 1 1 1.4 a1.5 1.5 0 0 1-1 1.4 V10 a2 2 0 0 1-2 2 V3.5 z"/>
      <path d="M6 6.5 h1 M9 6.5 h1 M6 9 h1 M9 9 h1"/>
    </svg>
  );
  if (name === 'cloud') return (
    <svg {...p}>
      <path d="M4.5 11 a2.5 2.5 0 0 1 0-5 a3 3 0 0 1 5.7-1 a2.5 2.5 0 0 1 .8 5 H4.5 z"/>
      <circle cx="11.5" cy="4.5" r="1" strokeDasharray="1 1"/>
    </svg>
  );
  if (name === 'bolt') return (
    <svg {...p}>
      <path d="M9 2 L4 9 H8 L7 14 L12 7 H8 L9 2 z"/>
    </svg>
  );
  return null;
}
function adBtnGhost(t) {
  return {
    background: 'transparent', border: `1px solid ${t.border}`, color: t.textMid,
    padding: '6px 12px', borderRadius: RADIUS[2],
    fontFamily: t.fontLabel, fontSize: 11, fontWeight: 600, letterSpacing: 0.05,
    cursor: 'pointer', whiteSpace: 'nowrap',
  };
}

// ─── Chart with hover crosshair (sized via viewBox; scales to container) ──
function AnalystChartDesk({ t, spec, height = 340 }) {
  const W = 800, H = height;
  const padL = 56, padR = 24, padT = 22, padB = 34;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const yRanges = spec.series.map(s => {
    const ys = s.data.map(p => p[1]);
    return [Math.min(...ys, 0), Math.max(...ys)];
  });
  const sameUnit = spec.series.every(s => s.unit === spec.series[0].unit);
  let yMin, yMax;
  if (sameUnit) {
    yMin = Math.min(...yRanges.map(r => r[0]));
    yMax = Math.max(...yRanges.map(r => r[1]));
  } else {
    [yMin, yMax] = yRanges[0];
  }
  const yPad = (yMax - yMin) * 0.1 || 1;
  yMin -= yPad; yMax += yPad;

  const xAt = (i) => padL + (i / (ANPTS - 1)) * innerW;
  const yAt = (v, sIdx = 0) => {
    if (sameUnit) {
      return padT + innerH - ((v - yMin) / (yMax - yMin)) * innerH;
    }
    const [lo, hi] = yRanges[sIdx];
    const span = hi - lo || 1;
    return padT + innerH - ((v - lo) / span) * innerH * 0.92 - innerH * 0.04;
  };

  const paths = spec.series.map((s, sIdx) => ({
    d: s.data.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(p[0])} ${yAt(p[1], sIdx)}`).join(' '),
    color: aColor(t, s.key),
    dashed: s.dashed,
  }));

  const [hover, setHover] = useStateAD(null);
  const svgRef = useRefAD(null);

  const onMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    if (svgX < padL || svgX > W - padR) { setHover(null); return; }
    const dataX = (svgX - padL) / innerW * (ANPTS - 1);
    const i = Math.max(0, Math.min(ANPTS - 1, Math.round(dataX)));
    setHover({ i, values: spec.series.map(s => s.data[i][1]) });
  };

  const yTicks = sameUnit
    ? [0, 0.25, 0.5, 0.75, 1].map(f => yMin + f * (yMax - yMin))
    : null;

  // Hour ticks: 06, 07, … 14 → 9 ticks
  const hourTicks = Array.from({ length: 9 }, (_, k) => ({
    x: padL + (k / 8) * innerW,
    label: String(6 + k).padStart(2, '0') + ':00',
  }));

  const fmt = (v) => Math.abs(v) >= 1000 ? (v / 1000).toFixed(1) + 'k' : Math.round(v).toString();

  return (
    <div style={{ position: 'relative' }}>
      <svg ref={svgRef}
           viewBox={`0 0 ${W} ${H}`} width="100%"
           preserveAspectRatio="xMidYMid meet"
           style={{ display: 'block', userSelect: 'none', cursor: 'crosshair' }}
           onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <rect x={padL} y={padT} width={innerW} height={innerH}
              fill={t.bg === '#080808' ? '#0a0a0a' : '#f0eade'} fillOpacity={0.4}/>

        {yTicks && yTicks.map((v, i) => (
          <g key={`yt-${i}`}>
            <line x1={padL} x2={W - padR} y1={yAt(v)} y2={yAt(v)}
                  stroke={t.chartGrid || t.borderSoft} strokeWidth={1}/>
            <text x={padL - 8} y={yAt(v) + 4} textAnchor="end"
                  fontFamily={t.fontLabel} fontSize="10" fill={t.textSoft}>{fmt(v)}</text>
          </g>
        ))}
        {yTicks && (
          <text x={14} y={padT + innerH / 2}
                fontFamily={t.fontLabel} fontSize="9" fill={t.textSoft}
                letterSpacing="0.18"
                transform={`rotate(-90 14 ${padT + innerH / 2})`} textAnchor="middle">
            {spec.series[0].unit}
          </text>
        )}

        {hourTicks.map((tk, i) => (
          <g key={`xt-${i}`}>
            <line x1={tk.x} x2={tk.x} y1={padT + innerH} y2={padT + innerH + 4}
                  stroke={t.borderSoft} strokeWidth={1}/>
            <text x={tk.x} y={padT + innerH + 16} textAnchor="middle"
                  fontFamily={t.fontLabel} fontSize="10" fill={t.textSoft}>{tk.label}</text>
          </g>
        ))}

        {sameUnit && yMin < 0 && yMax > 0 && (
          <line x1={padL} x2={W - padR} y1={yAt(0)} y2={yAt(0)}
                stroke={t.text} strokeWidth={0.6} opacity={0.35} strokeDasharray="3 3"/>
        )}

        {paths.map((p, i) => (
          <path key={i} d={p.d} fill="none" stroke={p.color}
                strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray={p.dashed ? '5 4' : ''}
                opacity={p.dashed ? 0.75 : 1}/>
        ))}

        {hover && (
          <g>
            <line x1={xAt(hover.i)} x2={xAt(hover.i)}
                  y1={padT} y2={padT + innerH}
                  stroke={t.text} strokeWidth={1} opacity={0.35} strokeDasharray="2 3"/>
            {spec.series.map((s, sIdx) => (
              <circle key={`m-${sIdx}`}
                      cx={xAt(hover.i)} cy={yAt(hover.values[sIdx], sIdx)}
                      r={4} fill={aColor(t, s.key)}
                      stroke={t.bg} strokeWidth={2}/>
            ))}
          </g>
        )}

        <rect x={padL} y={padT} width={innerW} height={innerH}
              fill="none" stroke={t.borderSoft} strokeWidth={1}/>
      </svg>

      {hover && (
        <div style={{
          position: 'absolute',
          left: `${(xAt(hover.i) / W) * 100}%`,
          top: 8,
          transform: hover.i > ANPTS / 2 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)',
          padding: '7px 10px',
          background: t.surface, border: `1px solid ${t.border}`,
          borderRadius: RADIUS[2],
          fontFamily: t.fontLabel, fontSize: 11, color: t.text,
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          pointerEvents: 'none', minWidth: 140,
        }}>
          <div style={{ color: t.textSoft, fontSize: 9, textTransform: 'uppercase',
                        letterSpacing: 0.2, fontWeight: 700, marginBottom: 4 }}>
            {(() => {
              const h = aTHour(hover.i);
              const hh = String(Math.floor(h)).padStart(2, '0');
              const mm = String(Math.floor((h % 1) * 60)).padStart(2, '0');
              return `${hh}:${mm}`;
            })()}
          </div>
          {spec.series.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%',
                             background: aColor(t, s.key), flexShrink: 0 }}/>
              <span style={{ color: t.textMid, fontSize: 10, flex: 1 }}>{s.name}</span>
              <span style={{ fontWeight: 700, color: aColor(t, s.key) }}>
                {Math.round(hover.values[i]).toLocaleString()}
              </span>
              <span style={{ color: t.textSoft, fontSize: 9 }}>{s.unit}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// ─── Artifact card (one chart on the canvas) ─────────────────────
// ─── Table artifact card ──────────────────────────────────────────
function TableArtifactCard({ t, art, idx, total, onExport, onDismiss, focused, onFocus }) {
  const isSov = t.name === 'sovereign';
  const tbl = art.table;
  return (
    <div data-art-id={art.id}
         onClick={() => onFocus(art.id)}
         style={{
      background: t.panel,
      border: `1px solid ${focused ? t.accent : t.border}`,
      borderRadius: RADIUS[3],
      padding: SPACE[4],
      display: 'flex', flexDirection: 'column', gap: SPACE[3],
      transition: 'border-color 120ms ease, box-shadow 120ms ease',
      boxShadow: focused ? `0 0 0 1px ${t.accent}55, 0 8px 24px rgba(0,0,0,0.12)` : 'none',
      cursor: 'pointer',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: SPACE[3] }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '3px 8px', borderRadius: 9999,
          background: t.bg,
          border: `1px solid ${t.borderSoft}`,
          fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700,
          letterSpacing: 0.2, color: t.textSoft, textTransform: 'uppercase', flexShrink: 0,
        }}>
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none"
               stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="12" height="10" rx="1"/>
            <path d="M2 7 H14 M6 3 V13 M10 3 V13"/>
          </svg>
          Table · #{idx + 1}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: t.fontHeading, fontSize: 18,
            fontWeight: isSov ? 400 : 500, color: t.text, lineHeight: 1.15,
            letterSpacing: isSov ? 0.4 : 0,
            textTransform: t.fontHeading.includes('Bebas') ? 'uppercase' : 'none',
          }}>{tbl.title}</div>
          {art.query && (
            <div style={{ fontFamily: t.fontLabel, fontSize: 10, color: t.textSoft,
                          letterSpacing: 0.05, marginTop: 3 }}>
              "{art.query}"
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span style={{ fontFamily: t.fontLabel, fontSize: 10, color: t.textSoft,
                         letterSpacing: 0.1 }}>{art.timestamp}</span>
          <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
            <button onClick={() => onExport(art)} title="Export to Excel" style={artBtn(t)}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none"
                   stroke="currentColor" strokeWidth="1.6"
                   strokeLinecap="round" strokeLinejoin="round"
                   style={{ marginRight: 4, verticalAlign: -1 }}>
                <path d="M6 1.5 V8 M3.5 5.5 L6 8 L8.5 5.5 M2 10.5 H10"/>
              </svg>
              Excel
            </button>
            <button onClick={() => onDismiss(art.id)} style={artBtn(t)}>✕</button>
          </div>
        </div>
      </div>
      <div style={{
        border: `1px solid ${t.borderSoft}`, borderRadius: RADIUS[2],
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: `repeat(${tbl.headers.length}, 1fr)`,
          background: t.bg, borderBottom: `1px solid ${t.borderSoft}`,
        }}>
          {tbl.headers.map((h, i) => (
            <div key={i} style={{
              padding: '8px 10px',
              fontFamily: t.fontLabel, fontSize: 9.5, fontWeight: 700,
              letterSpacing: 0.18, color: t.textMid, textTransform: 'uppercase',
              borderRight: i < tbl.headers.length - 1 ? `1px solid ${t.borderSoft}` : 'none',
            }}>{h}</div>
          ))}
        </div>
        {tbl.rows.map((row, rIdx) => (
          <div key={rIdx} style={{
            display: 'grid', gridTemplateColumns: `repeat(${tbl.headers.length}, 1fr)`,
            borderBottom: rIdx < tbl.rows.length - 1 ? `1px solid ${t.borderSoft}` : 'none',
            background: rIdx % 2 === 0 ? 'transparent' : t.surface,
          }}>
            {row.map((cell, ci) => (
              <div key={ci} style={{
                padding: '7px 10px',
                fontFamily: t.fontLabel, fontSize: 11, color: t.text,
                fontVariantNumeric: 'tabular-nums',
                borderRight: ci < row.length - 1 ? `1px solid ${t.borderSoft}` : 'none',
              }}>{cell}</div>
            ))}
          </div>
        ))}
      </div>
      {tbl.footer && (
        <div style={{
          fontFamily: t.fontLabel, fontSize: 10, color: t.textSoft,
          letterSpacing: 0.05, textAlign: 'right',
        }}>{tbl.footer}</div>
      )}
    </div>
  );
}

// ─── Artifact card (one chart on the canvas) ─────────────────────
function ArtifactCard({ t, art, idx, total, onPin, onExport, onDismiss, focused, onFocus }) {
  if (art.kind === 'table') {
    return <TableArtifactCard t={t} art={art} idx={idx} total={total}
                              onExport={onExport} onDismiss={onDismiss}
                              focused={focused} onFocus={onFocus}/>;
  }
  const isSov = t.name === 'sovereign';
  const isLatest = idx === total - 1;
  return (
    <div onClick={() => onFocus(art.id)}
         style={{
      background: t.panel,
      border: `1px solid ${focused ? t.accent : t.border}`,
      borderRadius: RADIUS[3],
      padding: SPACE[4],
      display: 'flex', flexDirection: 'column', gap: SPACE[3],
      transition: 'border-color 120ms ease, box-shadow 120ms ease',
      boxShadow: focused ? `0 0 0 1px ${t.accent}55, 0 8px 24px rgba(0,0,0,0.12)` : 'none',
      cursor: 'pointer',
    }}>
      {/* Card header: artifact pill + meta */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: SPACE[3] }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '3px 8px', borderRadius: 9999,
          background: isLatest ? `${t.accent}1a` : t.bg,
          border: `1px solid ${isLatest ? `${t.accent}55` : t.borderSoft}`,
          fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700,
          letterSpacing: 0.2, color: isLatest ? t.accent : t.textSoft,
          textTransform: 'uppercase', flexShrink: 0,
        }}>
          <svg width="9" height="9" viewBox="0 0 16 16" fill="none"
               stroke="currentColor" strokeWidth="2">
            <path d="M2 13 L6 8 L9 11 L14 4"/>
          </svg>
          Chart · #{total - idx}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: t.fontHeading, fontSize: 18,
            fontWeight: isSov ? 400 : 500, color: t.text, lineHeight: 1.15,
            letterSpacing: isSov ? 0.4 : 0,
            textTransform: t.fontHeading.includes('Bebas') ? 'uppercase' : 'none',
          }}>{art.spec.title}</div>
          {art.query && (
            <div style={{
              fontFamily: t.fontLabel, fontSize: 10, color: t.textSoft,
              letterSpacing: 0.05, marginTop: 3,
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/>
              </svg>
              "{art.query}"
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span style={{ fontFamily: t.fontLabel, fontSize: 10, color: t.textSoft,
                         letterSpacing: 0.1 }}>{art.timestamp}</span>
          <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
            <button onClick={() => onExport(art)} title="Export to Excel"
                    style={artBtn(t)}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none"
                   stroke="currentColor" strokeWidth="1.6"
                   strokeLinecap="round" strokeLinejoin="round"
                   style={{ marginRight: 4, verticalAlign: -1 }}>
                <path d="M6 1.5 V8 M3.5 5.5 L6 8 L8.5 5.5 M2 10.5 H10"/>
              </svg>
              Excel
            </button>
            <button onClick={() => onDismiss(art.id)} title="Dismiss"
                    style={artBtn(t)}>✕</button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12,
                    paddingTop: 2, paddingBottom: 2 }}>
        {art.spec.series.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 18, height: s.dashed ? 1 : 2.5,
              borderTop: s.dashed
                ? `1.5px dashed ${aColor(t, s.key)}`
                : `2.5px solid ${aColor(t, s.key)}`,
            }}/>
            <span style={{ fontFamily: t.fontLabel, fontSize: 10,
                           color: t.textMid, letterSpacing: 0.1, fontWeight: 600,
                           textTransform: 'uppercase' }}>{s.name}</span>
            <span style={{ fontFamily: t.fontLabel, fontSize: 9,
                           color: t.textSoft, letterSpacing: 0.1 }}>{s.unit}</span>
          </div>
        ))}
      </div>

      <AnalystChartDesk t={t} spec={art.spec} height={320}/>

      {art.spec.note && (
        <div style={{
          padding: `${SPACE[2]}px ${SPACE[3]}px`,
          background: t.bg, border: `1px solid ${t.borderSoft}`,
          borderLeft: `3px solid ${t.accent}`,
          borderRadius: RADIUS[1],
          fontFamily: t.fontBody, fontSize: 12, color: t.textMid,
          lineHeight: 1.4,
        }}>
          <span style={{ color: t.textSoft, fontFamily: t.fontLabel, fontSize: 9,
                         letterSpacing: 0.18, textTransform: 'uppercase', fontWeight: 700,
                         marginRight: 6 }}>Insight</span>
          {art.spec.note}
        </div>
      )}
    </div>
  );
}
function artBtn(t, active) {
  return {
    background: active ? `${t.accent}1a` : 'transparent',
    border: `1px solid ${active ? t.accent : t.borderSoft}`,
    color: active ? t.accent : t.textSoft,
    padding: '3px 8px', borderRadius: RADIUS[1],
    fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700,
    letterSpacing: 0.15, cursor: 'pointer', textTransform: 'uppercase',
  };
}

// ─── Canvas (left side, scrollable feed of artifacts) ─────────────
function ArtifactCanvas({ t, artifacts, focused, onFocus, onExport, onDismiss }) {
  const isSov = t.name === 'sovereign';
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: 0,
      background: t.bg,
    }}>

      {/* Scrollable feed */}
      <div style={{
        flex: 1, overflow: 'auto', minHeight: 0,
        padding: SPACE[4],
        display: 'flex', flexDirection: 'column', gap: SPACE[4],
      }}>
        {artifacts.length === 0 && (
          <div style={{
            border: `1.5px dashed ${t.borderSoft}`,
            borderRadius: RADIUS[3],
            padding: `${SPACE[5] * 1.5}px ${SPACE[5]}px`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SPACE[3],
            margin: 'auto',
            maxWidth: 560,
          }}>
            <div style={{ fontSize: 36, color: t.textSoft, opacity: 0.6 }}>◔</div>
            <div style={{
              fontFamily: t.fontHeading, fontSize: 22, color: t.text,
              fontWeight: isSov ? 400 : 500, letterSpacing: isSov ? 0.4 : 0,
              textAlign: 'center',
            }}>{isSov ? 'EMPTY CANVAS' : 'Empty canvas'}</div>
            <div style={{
              fontFamily: t.fontBody, fontSize: 13, color: t.textMid, textAlign: 'center',
              maxWidth: 380, lineHeight: 1.5,
            }}>
              Ask a question in the chat panel and the resulting chart will appear here.
              Charts pile up — scroll back through the conversation, export to Excel,
              dismiss what you don’t need.
            </div>
          </div>
        )}
        {artifacts.map((art, idx) => (
          <ArtifactCard key={art.id} t={t} art={art} idx={idx} total={artifacts.length}
                        focused={focused === art.id}
                        onFocus={onFocus}
                        onPin={undefined} onExport={onExport} onDismiss={onDismiss}/>
        ))}
      </div>
    </div>
  );
}

// ─── Chat panel (right side) ──────────────────────────────────────
// Live tool-trace shown while the agent is working.
function ToolTrace({ t, steps }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 5,
      fontFamily: t.fontLabel, fontSize: 11, color: t.textMid,
    }}>
      {steps.map((s, i) => {
        const done = s.status === 'done';
        const running = s.status === 'running';
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            opacity: running ? 1 : 0.85,
          }}>
            <span style={{
              width: 12, height: 12, display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {done ? (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
                     stroke={t.statusOk} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.5 6.5 L5 9 L9.5 3.5"/>
                </svg>
              ) : (
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: t.accent,
                  animation: 'adblink 0.9s ease-in-out infinite',
                }}/>
              )}
            </span>
            <span style={{
              color: done ? t.textSoft : t.text, letterSpacing: 0.05,
              fontWeight: running ? 600 : 500,
            }}>
              {s.tool && (
                <span style={{
                  fontFamily: t.fontLabel, fontSize: 9.5, fontWeight: 700,
                  letterSpacing: 0.18, textTransform: 'uppercase',
                  color: t.textSoft, marginRight: 6,
                }}>{s.tool}</span>
              )}
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ChatBubble({ t, msg, onArtifactClick }) {
  const isUser = msg.role === 'user';
  const isSov = t.name === 'sovereign';
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      gap: 4,
    }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700,
        letterSpacing: 0.2, color: t.textSoft, textTransform: 'uppercase',
      }}>
        {!isUser && (
          <span style={{
            width: 14, height: 14, borderRadius: '50%',
            background: t.accent, color: '#fff',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 800, fontFamily: t.fontLabel,
          }}>A</span>
        )}
        <span>{isUser ? 'You' : 'Analyst'}</span>
        <span style={{ color: t.textFaint || t.textSoft, fontWeight: 500, opacity: 0.8 }}>
          · {msg.timestamp}
        </span>
      </div>
      <div style={{
        maxWidth: '92%',
        padding: '8px 12px',
        background: isUser ? t.accent : t.surface,
        color: isUser ? '#fff' : t.text,
        border: isUser ? 'none' : `1px solid ${t.border}`,
        borderRadius: isUser
          ? `${RADIUS[3]}px ${RADIUS[3]}px 4px ${RADIUS[3]}px`
          : `${RADIUS[3]}px ${RADIUS[3]}px ${RADIUS[3]}px 4px`,
        fontFamily: t.fontBody, fontSize: 13, lineHeight: 1.5,
      }}>
        {msg.thinking ? (
          <ToolTrace t={t} steps={msg.trace || []} />
        ) : msg.text}
        {msg.error && (
          <div style={{
            marginTop: 4, fontSize: 10, color: isUser ? '#ffe6c8' : t.statusWarn,
            fontFamily: t.fontLabel, letterSpacing: 0.1, fontStyle: 'italic',
          }}>
            (LLM parse failed — fell back to keyword match)
          </div>
        )}
      </div>
      {/* Artifact pill */}
      {msg.artifactId && (
        <button onClick={() => onArtifactClick(msg.artifactId)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px',
          background: 'transparent',
          border: `1px solid ${t.borderSoft}`,
          borderLeft: `3px solid ${t.accent}`,
          borderRadius: RADIUS[2],
          fontFamily: t.fontLabel, fontSize: 10, fontWeight: 600,
          letterSpacing: 0.1, color: t.textMid,
          cursor: 'pointer',
          marginTop: 2,
        }}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none"
               stroke="currentColor" strokeWidth="2">
            <path d="M2 13 L6 8 L9 11 L14 4"/>
          </svg>
          <span style={{ color: t.text }}>{msg.artifactTitle}</span>
          <span style={{ color: t.textSoft, fontSize: 9, letterSpacing: 0.15,
                         textTransform: 'uppercase', marginLeft: 4 }}>
            view ↗
          </span>
        </button>
      )}
    </div>
  );
}

const AD_AGENT_SUGGESTIONS = [
  'BESS hit 92% SoC at 10:14 — explain why?',
  'Compute curtailed for 18 min at 11:30 — show me',
  'Why did LMP spike to $312 at 13:05?',
  'PV is 6% under forecast — is the heat dome the cause?',
  'Strait of Hormuz news — effect on tomorrow’s LMP?',
];

function ChatPanel({ t, messages, busy, onSubmit, onArtifactClick, hasArtifacts, artifactCount, onArtifactsButton }) {
  const isSov = t.name === 'sovereign';
  const [val, setVal] = useStateAD('');
  const [suggIdx, setSuggIdx] = useStateAD(0);
  React.useEffect(() => {
    const id = setInterval(() => setSuggIdx(i => (i + 1) % AD_AGENT_SUGGESTIONS.length), 4500);
    return () => clearInterval(id);
  }, []);
  const suggestion = AD_AGENT_SUGGESTIONS[suggIdx];
  const scrollRef = useRefAD(null);

  // Auto-scroll on new messages
  useEffectAD(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, busy]);

  const submit = () => {
    const v = val.trim();
    if (!v || busy) return;
    onSubmit(v);
    setVal('');
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: 0,
      background: t.panel, borderLeft: `1px solid ${t.border}`,
    }}>
      {/* Chat header */}
      <div style={{
        flexShrink: 0,
        padding: `${SPACE[3]}px ${SPACE[4]}px`,
        borderBottom: `1px solid ${t.borderSoft}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: SPACE[3], background: t.surface,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 24, height: 24, borderRadius: '50%',
            background: t.accent, color: '#fff',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800, fontFamily: t.fontLabel,
          }}>A</span>
          <div>
            <div style={{
              fontFamily: t.fontLabel, fontSize: 11, fontWeight: 700,
              letterSpacing: 0.2, color: t.text, textTransform: 'uppercase',
            }}>Analyst Agent</div>
            <div style={{
              fontFamily: t.fontLabel, fontSize: 9, color: t.statusOk,
              letterSpacing: 0.1, fontWeight: 600, textTransform: 'uppercase',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%',
                             background: t.statusOk }}/>
              Online · read-only
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onArtifactsButton} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'transparent', border: `1px solid ${t.border}`,
            color: t.textMid,
            padding: '6px 10px', borderRadius: RADIUS[2],
            fontFamily: t.fontLabel, fontSize: 11, fontWeight: 600, letterSpacing: 0.05,
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            <svg width="11" height="13" viewBox="0 0 14 16" fill="none"
                 stroke="currentColor" strokeWidth="1.6"
                 strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 1.5 H9 L12 4.5 V14 a0.5 0.5 0 0 1-0.5 0.5 H2.5 a0.5 0.5 0 0 1-0.5-0.5 V2 a0.5 0.5 0 0 1 0.5-0.5 z"/>
              <path d="M9 1.5 V4.5 H12"/>
              <path d="M4.5 8 H9.5 M4.5 10.5 H9.5 M4.5 6 H7"/>
            </svg>
            Artifacts
            <span style={{
              fontFamily: t.fontLabel, fontSize: 9, fontWeight: 800,
              padding: '1px 5px', borderRadius: 9999,
              background: artifactCount > 0 ? t.accent : t.borderSoft,
              color: artifactCount > 0 ? '#fff' : t.textSoft,
              minWidth: 14, textAlign: 'center', letterSpacing: 0,
            }}>{artifactCount}</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{
        flex: 1, overflow: 'auto', minHeight: 0,
        padding: `${SPACE[4]}px ${SPACE[4]}px`,
        display: 'flex', flexDirection: 'column', gap: SPACE[4],
      }}>
        {messages.map(msg => (
          <ChatBubble key={msg.id} t={t} msg={msg}
                      onArtifactClick={onArtifactClick}/>
        ))}


      </div>

      {/* Input */}
      <div style={{
        flexShrink: 0,
        borderTop: `1px solid ${t.borderSoft}`,
        padding: `${SPACE[3]}px ${SPACE[4]}px`,
        background: t.surface,
        display: 'flex', flexDirection: 'column', gap: SPACE[2],
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
          <input
            type="text"
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            placeholder={suggestion}
            disabled={busy}
            style={{
              flex: 1, minWidth: 0,
              padding: '10px 12px',
              background: t.bg, border: `1px solid ${t.border}`,
              borderRadius: RADIUS[2],
              fontFamily: t.fontBody, fontSize: 13, color: t.text,
              outline: 'none',
            }}
          />
          <button onClick={submit} disabled={busy || !val.trim()} style={{
            padding: '0 16px',
            background: busy ? t.borderSoft : t.accent,
            border: `1px solid ${busy ? t.border : t.accent}`,
            borderRadius: RADIUS[2],
            fontFamily: t.fontLabel, fontSize: 11, fontWeight: 700,
            letterSpacing: 0.2, color: busy ? t.textSoft : '#fff',
            textTransform: 'uppercase',
            cursor: busy || !val.trim() ? 'default' : 'pointer',
            opacity: !val.trim() && !busy ? 0.5 : 1,
            display: 'inline-flex', alignItems: 'center', gap: 5,
          }}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none"
                 stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 8 L14 8 M9 3 L14 8 L9 13"/>
            </svg>
            Send
          </button>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft,
          letterSpacing: 0.1,
        }}>
          <span>⏎ send · Each reply adds a chart or table to the canvas</span>
          <span/>
        </div>
      </div>
    </div>
  );
}

// ─── Body ─────────────────────────────────────────────────────────
function AnalystDeskBody({ t, density }) {
  // Seed with a welcome message + a starter artifact so the canvas isn't empty.
  const [artifacts, setArtifacts] = useStateAD(() => {
    const chartSpec = aFall('PV vs forecast today');
    return [
      {
        id: 'art-1', kind: 'chart',
        query: 'PV vs forecast today',
        spec: chartSpec, timestamp: '14:02:12',
      },
      {
        id: 'art-2', kind: 'table',
        query: 'List today’s alarms and their durations',
        timestamp: '14:04:31',
        table: {
          title: 'Today’s alarms · 06:00 → 14:00',
          headers: ['Time', 'Module', 'Severity', 'Duration', 'Status'],
          rows: [
            ['07:42', 'BESS-02',     'Warning', '4m 12s', 'Cleared'],
            ['09:18', 'COMPUTE-C04', 'Info',    '0m 38s', 'Cleared'],
            ['11:34', 'PV-Inv-3',    'Warning', '12m 04s', 'Cleared'],
            ['13:05', 'GRID-Tie-1',  'Critical', '2m 47s', 'Active'],
          ],
          footer: '4 alarms · 1 active · last update 14:04',
        },
      },
    ];
  });
  const [focused, setFocused] = useStateAD('art-2');
  const [messages, setMessages] = useStateAD(() => [
    { id: newMsgId(), role: 'user', timestamp: '14:02:08', text: 'PV vs forecast today' },
    { id: newMsgId(), role: 'assistant', timestamp: '14:02:12',
      text: 'Plotted PV output vs forecast for today, 06:00–14:00. PV peaks at 11:30, running about 6% under forecast at midday — likely the morning marine layer clearing late.',
      artifactId: 'art-1', artifactTitle: 'PV vs forecast' },
    { id: newMsgId(), role: 'user', timestamp: '14:04:18',
      text: 'Got it. Now list today’s alarms and how long each one lasted.' },
    { id: newMsgId(), role: 'assistant', timestamp: '14:04:31',
      text: 'Pulled the alarm log for the operating window. Four alarms today — three cleared on their own, one active on GRID-Tie-1 (2m 47s and counting).',
      artifactId: 'art-2', artifactTitle: 'Today’s alarms · 06:00 → 14:00' },
  ]);
  const [busy, setBusy] = useStateAD(false);

  const focusArtifact = useCallbackAD((id) => {
    setFocused(id);
    // Scroll to the artifact in the canvas list
    setTimeout(() => {
      const el = document.querySelector(`[data-art-id="${id}"]`);
      if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 30);
  }, []);

  const exportArtifact = useCallbackAD((art) => {
    let rows;
    let fname;
    if (art.kind === 'table') {
      const tbl = art.table;
      rows = [tbl.headers.join(','), ...tbl.rows.map(r => r.join(','))];
      fname = (tbl.title || 'table').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    } else {
      const series = (art.spec && art.spec.series) || [];
      if (!series.length) return;
      const headers = ['time', ...series.map(s => `${s.label || s.key} (${s.unit || ''})`)];
      rows = [headers.join(',')];
      const start = 6 * 60;
      const step = 5;
      const npts = series[0].data.length;
      for (let i = 0; i < npts; i++) {
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
    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${fname}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const dismissArtifact = useCallbackAD((id) => {
    setArtifacts(arr => arr.filter(a => a.id !== id));
    setFocused(f => f === id ? null : f);
  }, []);

  const runQuery = useCallbackAD(async (query) => {
    if (!query.trim()) return;
    const ts = nowLabel();
    const userMsg = { id: newMsgId(), role: 'user', timestamp: ts, text: query };
    const thinkingId = newMsgId();

    // Classify intent: chat-only, table, or chart.
    const q = query.toLowerCase();
    const isTable = /(list|table|show me the (rows|entries|alarms|events|log)|alarms|log|breakdown|export)/.test(q);
    const isChatOnly = /^(hi|hello|hey|thanks|thank you|nice|cool|got it|ok|okay|why\?)$/i.test(query.trim())
                       || (q.startsWith('what is') && q.length < 28)
                       || /^(can|could|would) you/.test(q) && !/(plot|chart|graph|table|list|show)/.test(q);

    // Build a plausible tool-trace from the query.
    const trace = [{ tool: 'agent', label: 'Parsing intent', status: 'running' }];
    if (!isChatOnly) {
      trace.push({ tool: 'timeseries', label: 'Querying site DB — 06:00–14:00, 5-min', status: 'pending' });
    }
    if (/(price|lmp|market|scarcity|revenue|dispatch)/.test(q))
      trace.push({ tool: 'YES Energy', label: 'Fetching ERCOT LMP + ancillary clears', status: 'pending' });
    if (/(weather|heat|cold|cloud|wind|forecast|sun|temp)/.test(q))
      trace.push({ tool: 'OpenWeather', label: 'Pulling site forecast — next 24h', status: 'pending' });
    if (/(hormuz|geopolit|news|event|oil|opec|sanction|outage)/.test(q))
      trace.push({ tool: 'Permutable AI', label: 'Cross-referencing flagged events', status: 'pending' });
    if (/(why|explain|cause|reason)/.test(q))
      trace.push({ tool: 'graph', label: 'Walking knowledge graph for related entities', status: 'pending' });
    if (isChatOnly) {
      trace.push({ tool: 'agent', label: 'Composing reply', status: 'pending' });
    } else if (isTable) {
      trace.push({ tool: 'agent', label: 'Composing table', status: 'pending' });
    } else {
      trace.push({ tool: 'agent', label: 'Rendering chart spec', status: 'pending' });
    }

    const thinkingMsg = { id: thinkingId, role: 'assistant', timestamp: ts, thinking: true, trace: [...trace] };
    setMessages(m => [...m, userMsg, thinkingMsg]);
    setBusy(true);

    let stepIdx = 0;
    const tick = setInterval(() => {
      stepIdx += 1;
      if (stepIdx >= trace.length) { clearInterval(tick); return; }
      trace[stepIdx - 1].status = 'done';
      trace[stepIdx].status = 'running';
      setMessages(m => m.map(mm =>
        mm.id === thinkingId ? { ...mm, trace: trace.map(s => ({ ...s })) } : mm
      ));
    }, 380);

    let spec, replyText, error = false, kind = 'chart', table = null;
    if (isChatOnly) {
      // Pure conversational reply, no artifact.
      kind = 'chat';
      try {
        if (!window.claude || !window.claude.complete) throw new Error('no llm');
        replyText = await window.claude.complete(
          `You are a friendly energy site analyst. Reply conversationally (1-2 sentences). User: "${query}"`
        );
      } catch (err) {
        replyText = "Sure — what would you like to look at? I can pull timeseries from the site, market data, or weather context.";
      }
    } else if (isTable) {
      kind = 'table';
      // Synthesize a plausible table (mock — agent would query the historian).
      table = {
        title: query.replace(/^[a-z]/, c => c.toUpperCase()),
        headers: ['Time', 'Source', 'Value', 'Note'],
        rows: [
          ['07:00', 'PV',         '142 kW',  'Ramp start'],
          ['09:00', 'PV',         '1.8 MW',  'Nominal'],
          ['10:30', 'BESS-02',    '−420 kW', 'Discharging'],
          ['11:30', 'PV',         '2.7 MW',  '6% under forecast'],
          ['13:05', 'Grid-Tie-1', 'Trip',    'Critical alarm raised'],
          ['14:00', 'BESS-02',    '+180 kW', 'Charging'],
        ],
        footer: '6 rows · pulled from historian',
      };
      replyText = `Pulled a table for "${query}". Six entries across the operating window. Hit Excel on the card to grab the full CSV.`;
    } else {
      const seriesKeys = Object.keys(aDefs).join(', ');
      const prompt = `You are a chart-spec generator for an energy site analyst tool.
Available series keys: ${seriesKeys}.
User asked: "${query}"
Reply with ONLY a single JSON object, no prose, no markdown fences:
{ "title": "<short chart title>",
  "keys":  ["<seriesKey1>", "<seriesKey2 if comparison>"],
  "note":  "<one-sentence insight>",
  "reply": "<2-3 sentence conversational reply>" }
Pick 1 key for single-series, 2 keys for vs/comparison.`;
      try {
        if (!window.claude || !window.claude.complete) throw new Error('no llm');
        const raw = await window.claude.complete(prompt);
        const cleaned = raw.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        const keys = (parsed.keys || []).filter(k => aDefs[k]);
        if (!keys.length) throw new Error('no valid keys');
        spec = aSpec(keys, parsed.title || query, parsed.note || '');
        replyText = parsed.reply || `Plotted ${parsed.title || query}.`;
      } catch (err) {
        spec = aFall(query);
        replyText = `Plotted "${spec.title}" using a keyword-match fallback. ${spec.note}`;
        error = true;
      }
    }

    clearInterval(tick);
    trace.forEach(s => { s.status = 'done'; });

    if (kind === 'chat') {
      // No artifact — chat-only reply.
      const ts2 = nowLabel();
      setMessages(m => m.map(msg =>
        msg.id === thinkingId
          ? { ...msg, thinking: false, text: replyText, error, timestamp: ts2 }
          : msg
      ));
    } else {
      const artId = newArtifactId();
      const ts2 = nowLabel();
      const newArt = kind === 'table'
        ? { id: artId, kind: 'table', query, table, timestamp: ts2 }
        : { id: artId, kind: 'chart', query, spec, timestamp: ts2 };
      setArtifacts(arr => [...arr, newArt]);
      focusArtifact(artId);
      const titleForBubble = kind === 'table' ? table.title : spec.title;
      setMessages(m => m.map(msg =>
        msg.id === thinkingId
          ? { ...msg, thinking: false, text: replyText, error,
              timestamp: ts2, artifactId: artId, artifactTitle: titleForBubble }
          : msg
      ));
    }
    setBusy(false);
  }, []);

  return (
    <div style={{
      flex: 1, minHeight: 0,
      display: 'grid', gridTemplateColumns: '1fr 420px',
    }}>
      <div data-canvas style={{ minHeight: 0 }}>
        {/* wrap each artifact card with data-art-id for scrollIntoView */}
        <ArtifactCanvasWrapper
          t={t}
          artifacts={artifacts}
          focused={focused}
          onFocus={focusArtifact}
          onPin={undefined}
          onExport={exportArtifact}
          onDismiss={dismissArtifact}/>
      </div>
      <ChatPanel
        t={t}
        messages={messages}
        busy={busy}
        onSubmit={runQuery}
        onArtifactClick={focusArtifact}
        hasArtifacts={artifacts.length > 0}
        artifactCount={artifacts.length}
        onArtifactsButton={() => artifacts.length && focusArtifact(artifacts[artifacts.length - 1].id)}/>

      <style>{`
        @keyframes adblink {
          0%, 100% { opacity: 0.3; }
          50%      { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Wrapper so ArtifactCard knows its data-art-id (needed for scrollIntoView).
function ArtifactCanvasWrapper({ t, artifacts, focused, onFocus, onExport, onDismiss }) {
  const isSov = t.name === 'sovereign';
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%',
      background: t.bg,
    }}>
      <div style={{
        flex: 1, overflow: 'auto', minHeight: 0,
        padding: SPACE[4],
        display: 'flex', flexDirection: 'column', gap: SPACE[4],
      }}>
        {artifacts.length === 0 && (
          <div style={{
            border: `1.5px dashed ${t.borderSoft}`,
            borderRadius: RADIUS[3],
            padding: `${SPACE[5] * 1.5}px ${SPACE[5]}px`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SPACE[3],
            margin: 'auto', maxWidth: 560,
          }}>
            <div style={{ fontSize: 36, color: t.textSoft, opacity: 0.6 }}>◔</div>
            <div style={{
              fontFamily: t.fontHeading, fontSize: 22, color: t.text,
              fontWeight: isSov ? 400 : 500, letterSpacing: isSov ? 0.4 : 0,
              textAlign: 'center',
            }}>{isSov ? 'EMPTY CANVAS' : 'Empty canvas'}</div>
            <div style={{
              fontFamily: t.fontBody, fontSize: 13, color: t.textMid, textAlign: 'center',
              maxWidth: 380, lineHeight: 1.5,
            }}>
              Ask a question in the chat panel and the resulting chart will appear here.
              Charts pile up — export any to Excel, dismiss what you don’t need.
            </div>
          </div>
        )}
        {artifacts.map((art, idx) => (
          <div key={art.id} data-art-id={art.id}>
            <ArtifactCard t={t} art={art} idx={idx} total={artifacts.length}
                          focused={focused === art.id}
                          onFocus={onFocus} onExport={onExport} onDismiss={onDismiss}/>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Public entry ─────────────────────────────────────────────────
function AnalystDesktopBody({ t, density }) {
  const [artifactCount, setArtifactCount] = useStateAD(1);
  // Track count via DOM mutation observer would be heavy; just observe via
  // a custom event the body fires. Simpler: pass via context-less ref pattern.
  // For now, the count is static-ish; the header gets a refresh trigger by
  // re-rendering on focus changes.
  // (Visual: the strict count in header is decorative; actual canvas already
  // shows precise count. So leave artifactCount as-is for the header strip.)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
      <AnalystDeskHeader t={t} density={density} artifactCount={artifactCount}/>
      <AnalystDeskBodyCounted t={t} density={density} onCount={setArtifactCount}/>
    </div>
  );
}

// Wrapper that lifts artifacts state up so the header can show the count.
function AnalystDeskBodyCounted({ t, density, onCount }) {
  // Reuse AnalystDeskBody but the header needs the count. Easiest: re-implement
  // here to share state. To keep code small, just include the original body
  // and read the canvas DOM each render via effect.
  const wrapRef = useRefAD(null);
  useEffectAD(() => {
    if (!wrapRef.current) return;
    const update = () => {
      const n = wrapRef.current.querySelectorAll('[data-art-id]').length;
      onCount(n);
    };
    update();
    const obs = new MutationObserver(update);
    obs.observe(wrapRef.current, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={wrapRef} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <AnalystDeskBody t={t} density={density}/>
    </div>
  );
}

window.AnalystDesktopBody = AnalystDesktopBody;
