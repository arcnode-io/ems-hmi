// gallery-primitives.jsx — Tier 0 display primitives
// Reading · Indicator · Mode · Gauge · RangeIndicator
//
// These five components map 1:1 to the AsyncAPI measurement types:
//   float        → Reading
//   bool         → Indicator
//   enum         → Mode
//   bounded float → Gauge (radial) or RangeIndicator (linear)
//
// Every measurement the HMI displays composes one of these five.

const { useMemo: useMemoP } = React;

// ── Common showcase helpers (used by every gallery file) ─────────────────

function StateCell({ t, label, children, w = 180, h = 'auto' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch',
    }}>
      <div style={{
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: RADIUS[3],
        padding: SPACE[3],
        minWidth: w,
        minHeight: typeof h === 'number' ? h : 'auto',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: t.name === 'sovereign'
          ? 'inset 0 1px 0 rgba(255,255,255,0.03)'
          : 'inset 0 1px 0 rgba(255,255,255,0.4), 0 1px 0 rgba(0,0,0,0.03)',
      }}>{children}</div>
      <div style={{
        fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft,
        letterSpacing: 0.15, textTransform: 'uppercase', textAlign: 'center',
        fontWeight: 600,
      }}>{label}</div>
    </div>
  );
}

function ThemePair({ children, label }) {
  // children is a (theme) => ReactNode function
  return (
    <div className="theme-pair">
      <div className="theme-pair-label">{label}</div>
      <div className="theme-pair-grid">
        <div className="theme-stage" data-theme="sovereign" style={{ background: SOVEREIGN.bg, borderColor: SOVEREIGN.border }}>
          <div className="theme-stage-name" style={{ color: SOVEREIGN.textSoft, fontFamily: SOVEREIGN.fontLabel }}>Sovereign · Dark</div>
          <div className="theme-stage-content">{children(SOVEREIGN)}</div>
        </div>
        <div className="theme-stage" data-theme="solarpunk" style={{ background: SOLARPUNK.bg, borderColor: SOLARPUNK.border }}>
          <div className="theme-stage-name" style={{ color: SOLARPUNK.textSoft, fontFamily: SOLARPUNK.fontLabel }}>Solarpunk · Light</div>
          <div className="theme-stage-content">{children(SOLARPUNK)}</div>
        </div>
      </div>
    </div>
  );
}

// Anatomy callout — labels which token drives which sub-region of a component
function Anatomy({ rows }) {
  return (
    <div className="anatomy">
      <div className="anatomy-label">Tokens used</div>
      <div className="anatomy-rows">
        {rows.map((r, i) => (
          <div key={i} className="anatomy-row">
            <span className="anatomy-region">{r.region}</span>
            <span className="anatomy-token">{r.token}</span>
            {r.note && <span className="anatomy-note">{r.note}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Reading ────────────────────────────────────────────────────────────
// type: float | renders: `{value} {unit}` or "—"

function Reading({ t, value, unit, variant = 'body', tone = 'normal' }) {
  const isMissing = value == null;
  const sizes = {
    body:   { num: 13, unit: 11 },
    dense:  { num: 12, unit: 10 },
    kpi:    { num: 32, unit: 12 },
    hero:   { num: 48, unit: 16 },
    table:  { num: 13, unit: 11 },
  };
  const s = sizes[variant] || sizes.body;
  const color = isMissing ? t.textMid :
                tone === 'warn' ? t.statusWarn :
                tone === 'alarm' ? t.statusAlarm :
                t.text;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
      <span style={{
        fontFamily: t.fontLabel, fontSize: s.num,
        fontWeight: variant === 'kpi' || variant === 'hero' ? 400 : 500,
        color, letterSpacing: variant === 'kpi' || variant === 'hero' ? -0.4 : 0,
        lineHeight: 1.0, fontVariantNumeric: 'tabular-nums',
      }}>{isMissing ? '—' : value}</span>
      {!isMissing && (
        <span style={{
          fontFamily: t.fontLabel, fontSize: s.unit, color: t.textMid,
        }}>{unit}</span>
      )}
    </span>
  );
}

function ReadingShowcase({ t }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: SPACE[3] }}>
      <StateCell t={t} label="kpi · normal">
        <Reading t={t} value="74.2" unit="kW" variant="kpi"/>
      </StateCell>
      <StateCell t={t} label="kpi · warn">
        <Reading t={t} value="38.4" unit="°C" variant="kpi" tone="warn"/>
      </StateCell>
      <StateCell t={t} label="kpi · alarm">
        <Reading t={t} value="0.142" unit="V" variant="kpi" tone="alarm"/>
      </StateCell>
      <StateCell t={t} label="body · normal">
        <Reading t={t} value="842.3" unit="kW"/>
      </StateCell>
      <StateCell t={t} label="body · no data">
        <Reading t={t} value={null} unit="kW"/>
      </StateCell>
      <StateCell t={t} label="hero (NOC TV)">
        <Reading t={t} value="184.2" unit="kW" variant="hero"/>
      </StateCell>
    </div>
  );
}

// ─── Indicator ───────────────────────────────────────────────────────────
// type: bool | renders: a colored dot. Color IS the entire signal.

function Indicator({ t, state, size = 'md' }) {
  const sizes = { sm: 8, md: 10, lg: 14 };
  const px = sizes[size] || 10;
  const color = state === true  ? t.statusOk
              : state === false ? t.statusAlarm
              :                   t.textSoft;
  return (
    <span style={{
      display: 'inline-block', width: px, height: px,
      borderRadius: '50%', background: color,
      boxShadow: state != null ? `0 0 0 ${Math.max(2, px/3)}px ${color}25` : 'none',
    }}/>
  );
}

function IndicatorShowcase({ t }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: SPACE[3] }}>
      <StateCell t={t} label="true · ok"><Indicator t={t} state={true}/></StateCell>
      <StateCell t={t} label="false · fault"><Indicator t={t} state={false}/></StateCell>
      <StateCell t={t} label="null · no data"><Indicator t={t} state={null}/></StateCell>
      <StateCell t={t} label="sm · 8px"><Indicator t={t} state={true} size="sm"/></StateCell>
      <StateCell t={t} label="md · 10px"><Indicator t={t} state={true} size="md"/></StateCell>
      <StateCell t={t} label="lg · 14px"><Indicator t={t} state={true} size="lg"/></StateCell>
    </div>
  );
}

// ─── Mode ────────────────────────────────────────────────────────────────
// type: enum | renders: colored dot + humanized string label

function Mode({ t, value, severity }) {
  const isMissing = value == null;
  const sevColor = severity == null ? t.textSoft
                 : severity === 'ok' ? t.statusOk
                 : severity === 'warn' ? t.statusWarn
                 : severity === 'alarm' ? t.statusAlarm
                 : t.textSoft;
  if (isMissing) {
    return <span style={{ fontFamily: t.fontLabel, fontSize: 12, color: t.textMid }}>—</span>;
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%', background: sevColor,
      }}/>
      <span style={{
        fontFamily: t.fontLabel, fontSize: 11, fontWeight: 600,
        color: t.text, letterSpacing: 0.18, textTransform: 'uppercase',
      }}>{value}</span>
    </span>
  );
}

function ModeShowcase({ t }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: SPACE[3] }}>
      <StateCell t={t} label="severity: ok"><Mode t={t} value="RUNPQ" severity="ok"/></StateCell>
      <StateCell t={t} label="severity: warn"><Mode t={t} value="DERATE" severity="warn"/></StateCell>
      <StateCell t={t} label="severity: alarm"><Mode t={t} value="FAULT" severity="alarm"/></StateCell>
      <StateCell t={t} label="no severity"><Mode t={t} value="MANUAL"/></StateCell>
      <StateCell t={t} label="no data"><Mode t={t} value={null}/></StateCell>
      <StateCell t={t} label="ok · grid-following"><Mode t={t} value="GRID-FOLLOW" severity="ok"/></StateCell>
    </div>
  );
}

// ─── Gauge (radial) ──────────────────────────────────────────────────────

function Gauge({ t, value, min = 0, max = 100, unit = '%', label, colorToken = 'colorBess', size = 80 }) {
  const isMissing = value == null;
  const pct = isMissing ? 0 : Math.max(0, Math.min(1, (value - min) / (max - min)));
  const r = size / 2 - 6;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const color = t[colorToken] || t.text;
  const offset = circ - pct * circ;
  return (
    <div style={{ width: size, position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size} style={{ display: 'block' }}>
        <circle cx={c} cy={c} r={r} stroke={t.borderSoft} strokeWidth="4" fill="none"/>
        {!isMissing && (
          <circle cx={c} cy={c} r={r} stroke={color} strokeWidth="4" fill="none"
                  strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                  transform={`rotate(-90 ${c} ${c})`}/>
        )}
      </svg>
      <div style={{
        position: 'absolute', inset: 0, top: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 0,
      }}>
        <div style={{
          fontFamily: t.fontLabel, fontSize: size >= 100 ? 22 : 16,
          fontWeight: 400, color: isMissing ? t.textMid : t.text,
          lineHeight: 1.0, letterSpacing: -0.4, fontVariantNumeric: 'tabular-nums',
        }}>{isMissing ? '—' : `${Math.round(value)}${unit}`}</div>
        {label && (
          <div style={{
            fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft,
            letterSpacing: 0.15, marginTop: 2, textTransform: 'uppercase', fontWeight: 600,
          }}>{label}</div>
        )}
      </div>
    </div>
  );
}

function GaugeShowcase({ t }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: SPACE[3] }}>
      <StateCell t={t} label="bess · 74%" h={120}>
        <Gauge t={t} value={74} colorToken="colorBess"/>
      </StateCell>
      <StateCell t={t} label="compute · 88%" h={120}>
        <Gauge t={t} value={88} colorToken="colorCompute"/>
      </StateCell>
      <StateCell t={t} label="thermal · 78%" h={120}>
        <Gauge t={t} value={78} colorToken="colorThermal"/>
      </StateCell>
      <StateCell t={t} label="no data" h={120}>
        <Gauge t={t} value={null}/>
      </StateCell>
      <StateCell t={t} label="size: lg (120)" h={140}>
        <Gauge t={t} value={62} size={120} colorToken="colorBess"/>
      </StateCell>
      <StateCell t={t} label="with sublabel" h={120}>
        <Gauge t={t} value={74} label="6h runway" colorToken="colorBess"/>
      </StateCell>
    </div>
  );
}

// ─── RangeIndicator (linear) ─────────────────────────────────────────────

function RangeIndicator({ t, value, min = 0, max = 100, colorToken = 'colorBess', height = 6, thresholds }) {
  const isMissing = value == null;
  const pct = isMissing ? 0 : Math.max(0, Math.min(1, (value - min) / (max - min)));
  const color = t[colorToken] || t.text;
  return (
    <div style={{
      width: '100%', height,
      background: t.borderSoft, borderRadius: height / 2,
      position: 'relative', overflow: 'hidden',
    }}>
      {!isMissing && (
        <div style={{
          position: 'absolute', inset: 0,
          width: `${pct * 100}%`, background: color, borderRadius: height / 2,
        }}/>
      )}
      {thresholds && thresholds.map((th, i) => {
        const tpct = (th.value - min) / (max - min);
        return (
          <div key={i} style={{
            position: 'absolute', left: `${tpct * 100}%`, top: -2, bottom: -2,
            width: 1, background: t[th.token] || t.statusAlarm, opacity: 0.7,
          }}/>
        );
      })}
    </div>
  );
}

function RangeIndicatorShowcase({ t }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: SPACE[3] }}>
      <StateCell t={t} label="bess · 74%">
        <div style={{ width: '100%' }}><RangeIndicator t={t} value={74} colorToken="colorBess"/></div>
      </StateCell>
      <StateCell t={t} label="compute · 88%">
        <div style={{ width: '100%' }}><RangeIndicator t={t} value={88} colorToken="colorCompute"/></div>
      </StateCell>
      <StateCell t={t} label="with thresholds">
        <div style={{ width: '100%' }}>
          <RangeIndicator t={t} value={62} colorToken="colorBess"
                          thresholds={[{value: 20, token: 'statusAlarm'}, {value: 95, token: 'statusAlarm'}]}/>
        </div>
      </StateCell>
      <StateCell t={t} label="no data">
        <div style={{ width: '100%' }}><RangeIndicator t={t} value={null}/></div>
      </StateCell>
      <StateCell t={t} label="height: 10 (standalone)">
        <div style={{ width: '100%' }}><RangeIndicator t={t} value={45} height={10} colorToken="colorThermal"/></div>
      </StateCell>
      <StateCell t={t} label="height: 16 (feature)">
        <div style={{ width: '100%' }}><RangeIndicator t={t} value={91} height={16} colorToken="colorCompute"/></div>
      </StateCell>
    </div>
  );
}

// expose
Object.assign(window, {
  Reading, Indicator, Mode, Gauge, RangeIndicator,
  ReadingShowcase, IndicatorShowcase, ModeShowcase, GaugeShowcase, RangeIndicatorShowcase,
  StateCell, ThemePair, Anatomy,
});
