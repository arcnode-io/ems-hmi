// gallery-utility-feeds.jsx — DOE Headroom row + SLD top-of-diagram
// Composable visuals for the three surfaces utility-side feeds appear on,
// plus the revenue meter + DLR mid-conductor badge layout.

// =====================================================================
//  DOEHeadroomRow — composable row used in 3 surfaces
//  Variants: 'strip' | 'stranded' | 'controls'
//  States:   'ok' | 'warn' | 'alarm' | 'island' | 'stale' | 'comm-fail'
// =====================================================================

function DOEHeadroomRow({ t, variant = 'controls', state = 'ok', direction = 'IMP', headroom = '3.2 MW', counterDirection = 'EXP', counterHeadroom = '0.0 MW', limit }) {
  const isIsland = state === 'island';
  const isFault  = state === 'stale' || state === 'alarm' || state === 'comm-fail';
  const stateLabel =
    state === 'ok' ? 'OK' :
    state === 'stale' ? 'STALE' :
    state === 'alarm' ? 'INVALID' :
    state === 'comm-fail' ? 'COMM FAIL' :
    state === 'island' ? 'ISLAND' :
    state.toUpperCase();
  const stateColor =
    state === 'ok' ? t.textSoft :
    state === 'stale' ? t.statusWarn :
    state === 'alarm' || state === 'comm-fail' ? t.statusAlarm :
    state === 'island' ? t.textSoft :
    t.textMid;

  if (variant === 'strip') {
    // Strip GRID segment — ultra compact
    return (
      <div style={{
        height: 38, padding: '0 12px', display: 'flex',
        alignItems: 'center', justifyContent: 'center', gap: 8,
        background: t.panel, border: `1px solid ${t.border}`,
        borderRadius: RADIUS[2], minWidth: 220,
      }}>
        <span style={{
          fontFamily: t.fontLabel, fontSize: 9, fontWeight: 600,
          letterSpacing: 0.18, color: t.textSoft, textTransform: 'uppercase',
        }}>GRID</span>
        {isIsland ? (
          <span style={{
            fontFamily: t.fontLabel, fontSize: 12, fontWeight: 700,
            letterSpacing: 0.18, color: t.text, textTransform: 'uppercase',
          }}>ISLAND</span>
        ) : (
          <>
            <span style={{
              fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700,
              letterSpacing: 0.18, color: t.textMid, textTransform: 'uppercase',
            }}>{direction}</span>
            <span style={{
              fontFamily: t.fontLabel, fontSize: 13, fontWeight: 600,
              color: t.text, fontVariantNumeric: 'tabular-nums',
              letterSpacing: -0.2,
            }}>{direction === 'IMP' ? '+' : '−'}{headroom}</span>
          </>
        )}
      </div>
    );
  }

  if (variant === 'stranded') {
    // Stranded Capacity Grid row
    const usedPct = isIsland || isFault ? 0 : 64;
    return (
      <div style={{ width: '100%' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontFamily: t.fontLabel, fontSize: 11, color: t.textMid,
          marginBottom: 4,
        }}>
          <span>Grid</span>
          <span style={{ color: isIsland ? t.textSoft : t.text, fontWeight: 600 }}>
            {isIsland ? 'ISLAND · n/a' : isFault ? '—' : `${headroom} ${direction} free`}
          </span>
        </div>
        <div style={{
          height: 5, borderRadius: 2.5,
          background: t.borderSoft, position: 'relative', overflow: 'hidden',
        }}>
          {!isIsland && !isFault && (
            <div style={{
              position: 'absolute', inset: 0,
              width: `${usedPct}%`, background: t.colorGrid, borderRadius: 2.5,
            }}/>
          )}
          {(isFault || isIsland) && (
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `repeating-linear-gradient(45deg, transparent 0 4px, ${t.borderSoft} 4px 6px)`,
            }}/>
          )}
        </div>
      </div>
    );
  }

  // variant === 'controls' — BESS Controls panel
  return (
    <div style={{
      padding: `${SPACE[3]}px ${SPACE[3]}px`,
      background: isFault ? t.statusWarn + '10' : t.panel,
      border: `1px solid ${isFault ? t.statusWarn + '55' : t.borderSoft}`,
      borderRadius: RADIUS[2],
    }}>
      {isIsland ? (
        <>
          <div style={{
            fontFamily: t.fontLabel, fontSize: 9, fontWeight: 600,
            letterSpacing: 0.18, color: t.textSoft, textTransform: 'uppercase',
          }}>DOE HEADROOM</div>
          <div style={{
            fontFamily: t.fontLabel, fontSize: 13, fontWeight: 600,
            color: t.text, marginTop: 4,
          }}>ISLAND MODE · no utility coordination</div>
        </>
      ) : isFault ? (
        <>
          <div style={{
            fontFamily: t.fontLabel, fontSize: 9, fontWeight: 600,
            letterSpacing: 0.18, color: stateColor, textTransform: 'uppercase',
          }}>DOE HEADROOM · UTILITY FEED {stateLabel}</div>
          <div style={{
            fontFamily: t.fontBody, fontSize: 11, color: t.textMid, marginTop: 4,
          }}>Limits unknown · operating on fallback</div>
        </>
      ) : (
        <>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          }}>
            <span style={{
              fontFamily: t.fontLabel, fontSize: 9, fontWeight: 600,
              letterSpacing: 0.18, color: t.textSoft, textTransform: 'uppercase',
            }}>DOE HEADROOM</span>
            <span style={{
              fontFamily: t.fontLabel, fontSize: 9, fontWeight: 600,
              letterSpacing: 0.18, color: stateColor, textTransform: 'uppercase',
            }}>{stateLabel}</span>
          </div>
          <div style={{
            display: 'flex', gap: SPACE[4], marginTop: 6,
            alignItems: 'baseline',
          }}>
            <div>
              <span style={{
                fontFamily: t.fontLabel, fontSize: 10, color: t.textMid,
                letterSpacing: 0.15, marginRight: 4,
              }}>IMP</span>
              <span style={{
                fontFamily: t.fontLabel, fontSize: 16, color: t.text, fontWeight: 500,
                fontVariantNumeric: 'tabular-nums', letterSpacing: -0.3,
              }}>3.2 MW</span>
            </div>
            <div>
              <span style={{
                fontFamily: t.fontLabel, fontSize: 10, color: t.textMid,
                letterSpacing: 0.15, marginRight: 4,
              }}>EXP</span>
              <span style={{
                fontFamily: t.fontLabel, fontSize: 16, color: t.textMid, fontWeight: 500,
                fontVariantNumeric: 'tabular-nums', letterSpacing: -0.3,
              }}>0.0 MW</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DOEHeadroomShowcase({ t }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: SPACE[3] }}>
      {/* Strip variant */}
      <StateCell t={t} label="strip · ok · importing">
        <DOEHeadroomRow t={t} variant="strip" state="ok" direction="IMP" headroom="3.2 MW"/>
      </StateCell>
      <StateCell t={t} label="strip · ok · exporting">
        <DOEHeadroomRow t={t} variant="strip" state="ok" direction="EXP" headroom="1.8 MW"/>
      </StateCell>
      <StateCell t={t} label="strip · ISLAND">
        <DOEHeadroomRow t={t} variant="strip" state="island"/>
      </StateCell>
      <StateCell t={t} label="strip · STALE (fallback to last)">
        <DOEHeadroomRow t={t} variant="strip" state="ok" direction="IMP" headroom="3.2 MW"/>
      </StateCell>

      {/* Stranded variant */}
      <StateCell t={t} label="stranded · ok" w={260}>
        <div style={{ width: '100%' }}>
          <DOEHeadroomRow t={t} variant="stranded" state="ok" direction="IMP" headroom="3.2 MW"/>
        </div>
      </StateCell>
      <StateCell t={t} label="stranded · ISLAND" w={260}>
        <div style={{ width: '100%' }}>
          <DOEHeadroomRow t={t} variant="stranded" state="island"/>
        </div>
      </StateCell>
      <StateCell t={t} label="stranded · STALE" w={260}>
        <div style={{ width: '100%' }}>
          <DOEHeadroomRow t={t} variant="stranded" state="stale"/>
        </div>
      </StateCell>
      <StateCell t={t} label="stranded · COMM_FAIL" w={260}>
        <div style={{ width: '100%' }}>
          <DOEHeadroomRow t={t} variant="stranded" state="comm-fail"/>
        </div>
      </StateCell>

      {/* Controls variant */}
      <StateCell t={t} label="controls · ok (both directions always)" w={320}>
        <div style={{ width: '100%' }}>
          <DOEHeadroomRow t={t} variant="controls" state="ok"/>
        </div>
      </StateCell>
      <StateCell t={t} label="controls · STALE banner" w={320}>
        <div style={{ width: '100%' }}>
          <DOEHeadroomRow t={t} variant="controls" state="stale"/>
        </div>
      </StateCell>
      <StateCell t={t} label="controls · COMM_FAIL banner" w={320}>
        <div style={{ width: '100%' }}>
          <DOEHeadroomRow t={t} variant="controls" state="comm-fail"/>
        </div>
      </StateCell>
      <StateCell t={t} label="controls · ISLAND" w={320}>
        <div style={{ width: '100%' }}>
          <DOEHeadroomRow t={t} variant="controls" state="island"/>
        </div>
      </StateCell>
    </div>
  );
}

// =====================================================================
//  SLDTopOfDiagram — revenue meter as POI + DLR mid-conductor + DOE badge
// =====================================================================

function SLDTopShowcase({ t }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: SPACE[3] }}>
      <StateCell t={t} label="nominal · DLR + DOE both OK" h={360}>
        <SLDTopRender t={t} dlrState="ok" doeState="ok"/>
      </StateCell>
      <StateCell t={t} label="DLR operational warning · 94%" h={360}>
        <SLDTopRender t={t} dlrState="warn" doeState="ok"/>
      </StateCell>
      <StateCell t={t} label="DOE STALE · DLR OK" h={360}>
        <SLDTopRender t={t} dlrState="ok" doeState="stale"/>
      </StateCell>
      <StateCell t={t} label="DLR sensor fault · STALE" h={360}>
        <SLDTopRender t={t} dlrState="stale" doeState="ok"/>
      </StateCell>
      <StateCell t={t} label="ISLAND mode · DOE n/a" h={360}>
        <SLDTopRender t={t} dlrState="ok" doeState="island"/>
      </StateCell>
      <StateCell t={t} label="DLR not configured · no badge" h={360}>
        <SLDTopRender t={t} dlrState="absent" doeState="ok"/>
      </StateCell>
    </div>
  );
}

function SLDTopRender({ t, dlrState, doeState }) {
  const W = 200, H = 320;
  const meterY = 200, meterH = 70;
  // colors
  const dlrColor = dlrState === 'ok' ? t.statusOk
                 : dlrState === 'warn' ? t.statusWarn
                 : dlrState === 'stale' ? t.statusWarn
                 : null;
  const doeColor = doeState === 'ok' ? t.statusOk
                 : doeState === 'stale' ? t.statusWarn
                 : doeState === 'alarm' ? t.statusAlarm
                 : doeState === 'island' ? t.textSoft
                 : t.statusOk;
  const doeText = doeState === 'ok' ? 'OK'
                : doeState === 'stale' ? 'STALE'
                : doeState === 'alarm' ? 'INVALID'
                : doeState === 'island' ? 'ISLAND'
                : 'OK';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%', display: 'block' }}>
      {/* utility label */}
      <text x={W/2} y={20} textAnchor="middle"
            fontFamily={t.fontLabel} fontSize="10" fontWeight="700"
            letterSpacing="1.5" fill={t.textMid}>UTILITY · 13.2 kV</text>

      {/* conductor segment 1 (above DLR badge) */}
      <line x1={W/2} y1={32} x2={W/2} y2={100} stroke={t.colorGrid} strokeWidth="2"/>

      {/* DLR badge — three states */}
      {dlrState !== 'absent' && (
        <g transform={`translate(${W/2 + 8} 110)`}>
          {dlrState === 'ok' ? (
            // collapsed: tiny dot + label only
            <>
              <circle cx="0" cy="0" r="3" fill={dlrColor}/>
              <text x="8" y="3" fontFamily={t.fontLabel} fontSize="9" fontWeight="700"
                    letterSpacing="1.2" fill={t.textSoft}>DLR</text>
            </>
          ) : dlrState === 'warn' ? (
            // expanded: ratio
            <>
              <circle cx="0" cy="0" r="4" fill={dlrColor}>
                <animate attributeName="opacity" values="1;0.4;1" dur="1.4s" repeatCount="indefinite"/>
              </circle>
              <text x="9" y="3" fontFamily={t.fontLabel} fontSize="10" fontWeight="700"
                    letterSpacing="1" fill={dlrColor}>DLR 94%</text>
            </>
          ) : (
            // status fault: sensor glyph + STALE
            <>
              <circle cx="0" cy="0" r="4" fill={dlrColor}/>
              <text x="9" y="3" fontFamily={t.fontLabel} fontSize="10" fontWeight="700"
                    letterSpacing="1" fill={dlrColor}>DLR ⚠ STALE</text>
            </>
          )}
        </g>
      )}

      {/* conductor segment 2 (below DLR badge) */}
      <line x1={W/2} y1={120} x2={W/2} y2={meterY} stroke={t.colorGrid} strokeWidth="2"/>

      {/* particle flow on the conductor (decorative — would animate in real SLD) */}
      <circle cx={W/2} cy={70} r="2" fill="#fff" opacity="0.7"/>
      <circle cx={W/2} cy={170} r="2" fill="#fff" opacity="0.7"/>

      {/* revenue meter node */}
      <g transform={`translate(${W/2 - 75} ${meterY})`}>
        <rect width="150" height={meterH} rx="4"
              fill={t.surface} stroke={doeState === 'ok' ? t.border : doeColor} strokeWidth="1"/>
        {/* domain accent strip */}
        <rect width="3" height={meterH} fill={t.colorGrid}/>
        {/* equipment id */}
        <text x="10" y="14" fontFamily={t.fontLabel} fontSize="9" fontWeight="700"
              letterSpacing="1" fill={t.textSoft}>GRD-RM-001</text>
        {/* settlement kW */}
        <text x="10" y="34" fontFamily={t.fontLabel} fontSize="15" fontWeight="500"
              fill={t.text} style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.4px' }}>
          +142 kW <tspan fontSize="10" fontWeight="600" letterSpacing="1" fill={t.textMid}>IMPORT</tspan>
        </text>
        {/* divider */}
        <line x1="8" x2="142" y1="44" y2="44" stroke={t.borderSoft} strokeWidth="1"/>
        {/* DOE state row */}
        <text x="10" y="58" fontFamily={t.fontLabel} fontSize="9" fontWeight="700"
              letterSpacing="1" fill={t.textSoft}>DOE</text>
        <text x="42" y="58" fontFamily={t.fontLabel} fontSize="9" fontWeight="700"
              letterSpacing="1" fill={doeColor}>{doeText}</text>
      </g>

      {/* conductor segment 3 (below meter, to transformer) */}
      <line x1={W/2} y1={meterY + meterH} x2={W/2} y2={H - 20} stroke={t.colorGrid} strokeWidth="2"/>
      <text x={W/2} y={H - 6} textAnchor="middle"
            fontFamily={t.fontLabel} fontSize="9" letterSpacing="1"
            fill={t.textSoft}>500 kVA xfmr ↓</text>
    </svg>
  );
}

Object.assign(window, {
  DOEHeadroomRow, DOEHeadroomShowcase,
  SLDTopRender, SLDTopShowcase,
});
