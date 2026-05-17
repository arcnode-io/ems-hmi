// gallery-tier2-tier3.jsx — Detail-page + analyst components
// MeasurementRow · GPUHeatmapCell · CommandPanel · ConfirmationModal
// TimeseriesChart (with thresholds + NOW marker) · Histogram
// ChatBubble · PrebuiltQueryCard

// ─── MeasurementRow ──────────────────────────────────────────────────────
function MeasurementRow({ t, label, value, unit, sparkline, divider = true }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: SPACE[3], padding: `${SPACE[2]}px ${SPACE[3]}px`,
      borderBottom: divider ? `1px solid ${t.borderSoft}` : 'none',
      minHeight: 38,
    }}>
      <span style={{ fontFamily: t.fontBody, fontSize: 12, color: t.textMid }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2] }}>
        {sparkline && (
          <svg width="60" height="16" style={{ display: 'block' }}>
            <path d={sparkline} stroke={t.colorCompute} strokeWidth="1.2" fill="none"/>
          </svg>
        )}
        <Reading t={t} value={value} unit={unit} variant="dense"/>
      </div>
    </div>
  );
}

function MeasurementRowShowcase({ t }) {
  return (
    <div style={{
      width: '100%', maxWidth: 420,
      background: t.surface, border: `1px solid ${t.border}`,
      borderRadius: RADIUS[3], overflow: 'hidden',
    }}>
      <MeasurementRow t={t} label="Pack voltage (DC)" value="798.2" unit="V"/>
      <MeasurementRow t={t} label="Pack current" value="−54.1" unit="A"/>
      <MeasurementRow t={t} label="Cell spread" value="0.142" unit="V"/>
      <MeasurementRow t={t} label="Coolant inlet" value="24.8" unit="°C"
        sparkline="M0 8 L10 9 L20 7 L30 6 L40 8 L50 5 L60 4"/>
      <MeasurementRow t={t} label="Cycle count" value="1240" unit=""/>
      <MeasurementRow t={t} label="No data" value={null} unit="kW" divider={false}/>
    </div>
  );
}

// ─── GPUHeatmapCell ──────────────────────────────────────────────────────
function GPUHeatmapCell({ t, util, selected }) {
  let opacity = 0.4;
  if (util < 5) opacity = 0;
  else if (util < 30) opacity = 0.45;
  else if (util < 70) opacity = 0.7;
  else if (util < 90) opacity = 0.88;
  else opacity = 1.0;

  return (
    <div style={{
      width: 32, height: 32, borderRadius: RADIUS[2],
      background: util < 5 ? t.borderSoft : t.colorCompute,
      opacity: util < 5 ? 1 : opacity,
      border: selected ? `2px solid ${t.accent}` : `1px solid ${util < 5 ? t.border : 'transparent'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700,
      color: util < 5 ? t.textSoft : '#fff', letterSpacing: 0,
    }}>{util < 5 ? '—' : util}</div>
  );
}

function GPUHeatmapShowcase({ t }) {
  const rows = [
    [92, 94, 91, 89, 95, 93, 92, 88],
    [90, 87, 91, 93, 96, 94, 89, 92],
    [88, 91, 86, 90,  0,  0,  4, 12],
    [85, 88, 87, 91, 72, 68, 71, 74],
  ];
  return (
    <div style={{
      padding: SPACE[3],
      background: t.surface, border: `1px solid ${t.border}`,
      borderRadius: RADIUS[3],
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {rows.map((row, i) => (
          <div key={i} style={{ display: 'flex', gap: 4 }}>
            {row.map((u, j) => (
              <GPUHeatmapCell key={j} t={t} util={u} selected={i === 0 && j === 4}/>
            ))}
          </div>
        ))}
      </div>
      <div style={{ marginTop: SPACE[3], display: 'flex', gap: SPACE[3], alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft, textTransform: 'uppercase', letterSpacing: 0.15 }}>Util</span>
        {[10, 40, 70, 90, 100].map(u => (
          <div key={u} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <GPUHeatmapCell t={t} util={u}/>
            <span style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft }}>{u}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CommandPanel ────────────────────────────────────────────────────────
function CommandPanel({ t, deviceName, currentMode = 'AUTO', sim = false }) {
  return (
    <div style={{
      width: 360, background: t.surface, border: `1px solid ${t.border}`,
      borderRadius: RADIUS[3], overflow: 'hidden',
    }}>
      <div style={{ padding: SPACE[3], borderBottom: `1px solid ${t.borderSoft}`, background: t.panel }}>
        <div style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft, textTransform: 'uppercase', letterSpacing: 0.18, fontWeight: 600 }}>Controls · {deviceName}</div>
        <div style={{ fontFamily: t.fontLabel, fontSize: 14, color: t.text, marginTop: 3, fontWeight: 600 }}>Run mode</div>
      </div>
      <div style={{ padding: SPACE[3], display: 'flex', flexDirection: 'column', gap: SPACE[3] }}>
        <div style={{ display: 'flex', gap: 0, border: `1px solid ${t.border}`, borderRadius: RADIUS[2], overflow: 'hidden' }}>
          {['AUTO', 'MANUAL', 'TARGET SOC'].map((m, i) => (
            <button key={m} style={{
              flex: 1, padding: '8px 6px',
              background: m === currentMode ? t.accent : 'transparent',
              color: m === currentMode ? '#fff' : t.textMid,
              border: 'none', borderRight: i < 2 ? `1px solid ${t.border}` : 'none',
              fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700,
              letterSpacing: 0.18, cursor: 'pointer',
            }}>{m}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: SPACE[2] }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft, letterSpacing: 0.18, textTransform: 'uppercase', fontWeight: 600 }}>P setpoint</div>
            <div style={{
              marginTop: 4, padding: '8px 10px',
              background: t.sunken || t.bg, border: `1px solid ${t.border}`,
              borderRadius: RADIUS[2],
              fontFamily: t.fontLabel, fontSize: 14, color: t.text, fontVariantNumeric: 'tabular-nums',
            }}>−200 kW</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft, letterSpacing: 0.18, textTransform: 'uppercase', fontWeight: 600 }}>Q setpoint</div>
            <div style={{
              marginTop: 4, padding: '8px 10px',
              background: t.sunken || t.bg, border: `1px solid ${t.border}`,
              borderRadius: RADIUS[2],
              fontFamily: t.fontLabel, fontSize: 14, color: t.textMid, fontVariantNumeric: 'tabular-nums',
            }}>0 kVAR</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: SPACE[2] }}>
          <button style={{
            flex: 1, padding: '10px',
            background: sim ? t.statusSim : t.accent,
            color: '#fff', border: 'none', borderRadius: RADIUS[2],
            fontFamily: t.fontLabel, fontSize: 11, fontWeight: 700, letterSpacing: 0.18, textTransform: 'uppercase', cursor: 'pointer',
          }}>{sim ? 'Apply (SIM)' : 'Apply'}</button>
          <button style={{
            padding: '10px 14px',
            background: 'transparent', color: t.textMid,
            border: `1px solid ${t.border}`, borderRadius: RADIUS[2],
            fontFamily: t.fontLabel, fontSize: 11, fontWeight: 700, letterSpacing: 0.18, textTransform: 'uppercase', cursor: 'pointer',
          }}>Reset</button>
        </div>
        <div style={{
          paddingTop: SPACE[3], borderTop: `1px solid ${t.borderSoft}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: t.fontLabel, fontSize: 11, fontWeight: 600, color: t.text }}>Maintenance mode</div>
            <div style={{ fontFamily: t.fontBody, fontSize: 11, color: t.textSoft, marginTop: 2 }}>Disables commands · wrench on SLD</div>
          </div>
          <div style={{ width: 38, height: 22, borderRadius: 11, background: t.borderSoft, position: 'relative', cursor: 'pointer' }}>
            <div style={{ position: 'absolute', top: 2, left: 2, width: 18, height: 18, borderRadius: '50%', background: t.text }}/>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ConfirmationModal ──────────────────────────────────────────────────
function ConfirmationModal({ t, command, target, sim = false }) {
  return (
    <div style={{
      width: 380, background: t.raised || t.surface,
      border: `1px solid ${t.border}`, borderRadius: RADIUS[4],
      overflow: 'hidden',
      boxShadow: t.name === 'sovereign'
        ? '0 8px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)'
        : '0 8px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.7)',
    }}>
      <div style={{
        padding: SPACE[3], borderBottom: `1px solid ${t.borderSoft}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        cursor: 'grab',
      }}>
        <div style={{
          fontFamily: t.fontHeading, fontSize: 16, fontWeight: 500, color: t.text,
          letterSpacing: t.name === 'sovereign' ? 0.5 : 0,
          textTransform: t.name === 'sovereign' ? 'uppercase' : 'none',
        }}>Confirm command</div>
        <span style={{ color: t.textSoft, fontSize: 14 }}>⋮⋮</span>
      </div>
      <div style={{ padding: SPACE[4] }}>
        <div style={{ fontFamily: t.fontBody, fontSize: 13, fontWeight: 600, color: t.text, lineHeight: 1.5, marginBottom: SPACE[3] }}>{command}</div>
        <div style={{
          padding: SPACE[3], background: t.bg, border: `1px solid ${t.border}`,
          borderRadius: RADIUS[2],
        }}>
          <div style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft, letterSpacing: 0.18, textTransform: 'uppercase', fontWeight: 600 }}>Affected device</div>
          <div style={{ fontFamily: t.fontLabel, fontSize: 13, color: t.text, marginTop: 4, fontWeight: 700 }}>{target.name}</div>
          <div style={{ fontFamily: t.fontBody, fontSize: 11, color: t.textMid, marginTop: 2 }}>Current: {target.currentState}</div>
        </div>
        {sim && (
          <div style={{
            marginTop: SPACE[3], padding: SPACE[2],
            background: t.statusSim + '15', border: `1px solid ${t.statusSim}55`,
            borderRadius: RADIUS[2],
            fontFamily: t.fontLabel, fontSize: 11, color: t.statusSim,
          }}>SIM mode — no hardware dispatch</div>
        )}
      </div>
      <div style={{
        padding: SPACE[3], borderTop: `1px solid ${t.borderSoft}`,
        display: 'flex', gap: SPACE[2], justifyContent: 'flex-end',
      }}>
        <button style={{
          padding: '9px 16px', background: 'transparent', color: t.textMid,
          border: `1px solid ${t.border}`, borderRadius: RADIUS[2],
          fontFamily: t.fontLabel, fontSize: 11, fontWeight: 700, letterSpacing: 0.18,
          textTransform: 'uppercase', cursor: 'pointer',
        }}>Cancel</button>
        <button style={{
          padding: '9px 16px', background: sim ? t.statusSim : t.accent,
          color: '#fff', border: 'none', borderRadius: RADIUS[2],
          fontFamily: t.fontLabel, fontSize: 11, fontWeight: 700, letterSpacing: 0.18,
          textTransform: 'uppercase', cursor: 'pointer',
        }}>{sim ? 'Send (SIM)' : 'Confirm'}</button>
      </div>
    </div>
  );
}

function CommandShowcase({ t }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE[4], alignItems: 'flex-start' }}>
      <CommandPanel t={t} deviceName="BESS-01" sim={false}/>
      <ConfirmationModal t={t}
        command="Set BESS-01 active power to −200 kW"
        target={{ name: 'BESS-01', currentState: 'AUTO · idling at −15 kW' }}/>
      <ConfirmationModal t={t}
        command="Set BESS-01 active power to −200 kW"
        target={{ name: 'BESS-01', currentState: 'AUTO · idling at −15 kW' }}
        sim/>
    </div>
  );
}

// ─── TimeseriesChart with thresholds + NOW marker (DS-008) ───────────────
function TimeseriesChart({ t, width = 480, height = 220 }) {
  const padL = 36, padB = 24, padT = 12, padR = 32;
  const W = width - padL - padR, H = height - padT - padB;
  const min = 3.15, max = 3.45;
  const thMin = 3.20, thMax = 3.40;
  const samples = [3.32,3.33,3.31,3.30,3.32,3.34,3.33,3.32,3.31,3.30,3.29,3.28,3.27,3.26,3.25,3.24,3.23,3.22,3.21,3.22,3.23,3.24];
  const forecast = [3.24,3.23,3.22,3.21,3.20,3.19];
  const total = samples.length + forecast.length;
  const xy = (i, v) => [padL + (i / (total - 1)) * W, padT + (1 - (v - min) / (max - min)) * H];
  const sPath = samples.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xy(i, v).join(' ')}`).join(' ');
  const fPath = forecast.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xy(samples.length - 1 + i, v).join(' ')}`).join(' ');
  const nowX  = xy(samples.length - 1, samples[samples.length - 1])[0];

  return (
    <svg width={width} height={height} style={{ display: 'block', background: t.surface, border: `1px solid ${t.border}`, borderRadius: RADIUS[3] }}>
      {[0.25, 0.5, 0.75].map(g => (
        <line key={g} x1={padL} x2={width - padR} y1={padT + H * g} y2={padT + H * g} stroke={t.chartGrid} strokeWidth="1"/>
      ))}
      {[[thMin, 'MIN'], [thMax, 'MAX']].map(([v, lbl]) => {
        const y = padT + (1 - (v - min) / (max - min)) * H;
        return (
          <g key={lbl}>
            <line x1={padL} x2={width - padR} y1={y} y2={y} stroke={t.statusAlarm} strokeWidth="1" strokeDasharray="4 3" opacity="0.7"/>
            <text x={padL - 5} y={y + 3} fill={t.statusAlarm} fontSize="10" fontFamily={t.fontLabel} textAnchor="end" fontWeight="600">{lbl}</text>
            <text x={width - padR + 4} y={y + 3} fill={t.statusAlarm} fontSize="10" fontFamily={t.fontLabel} fontWeight="600">{v.toFixed(2)}V</text>
          </g>
        );
      })}
      <path d={sPath} stroke={t.colorBess} strokeWidth="1.75" fill="none"/>
      <path d={fPath} stroke={t.colorBess} strokeWidth="1.75" fill="none" strokeDasharray="5 3" opacity="0.7"/>
      <line x1={nowX} x2={nowX} y1={padT} y2={padT + H} stroke={t.textMid} strokeWidth="1" strokeDasharray="2 2"/>
      <text x={nowX} y={padT - 3} fill={t.textMid} fontSize="10" fontFamily={t.fontLabel} fontWeight="600" letterSpacing="1" textAnchor="middle">NOW</text>
      {[min, (min+max)/2, max].map(v => {
        const y = padT + (1 - (v - min) / (max - min)) * H;
        return <text key={v} x={padL - 5} y={y + 3} fill={t.textSoft} fontSize="9" fontFamily={t.fontLabel} textAnchor="end">{v.toFixed(2)}</text>;
      })}
    </svg>
  );
}

// ─── Histogram with threshold lines ──────────────────────────────────────
function Histogram({ t, width = 480, height = 180 }) {
  const padL = 36, padB = 24, padT = 16, padR = 16;
  const W = width - padL - padR, H = height - padT - padB;
  const min = 3.15, max = 3.45;
  const thMin = 3.20, thMax = 3.40;
  const bins = [
    [3.15, 3.18, 2], [3.18, 3.20, 6], [3.20, 3.22, 18], [3.22, 3.24, 42],
    [3.24, 3.26, 58], [3.26, 3.28, 64], [3.28, 3.30, 52], [3.30, 3.32, 38],
    [3.32, 3.34, 16], [3.34, 3.36, 6], [3.36, 3.38, 3], [3.38, 3.40, 4], [3.40, 3.42, 3], [3.42, 3.45, 1],
  ];
  const maxCount = Math.max(...bins.map(b => b[2]));

  return (
    <svg width={width} height={height} style={{ display: 'block', background: t.surface, border: `1px solid ${t.border}`, borderRadius: RADIUS[3] }}>
      {[[thMin, 'MIN'], [thMax, 'MAX']].map(([v, lbl]) => {
        const x = padL + ((v - min) / (max - min)) * W;
        return (
          <g key={lbl}>
            <line x1={x} x2={x} y1={padT} y2={padT + H} stroke={t.statusAlarm} strokeWidth="1" strokeDasharray="4 3" opacity="0.7"/>
            <text x={x} y={padT - 3} fill={t.statusAlarm} fontSize="10" fontFamily={t.fontLabel} fontWeight="600" letterSpacing="1" textAnchor="middle">{lbl}</text>
          </g>
        );
      })}
      {bins.map(([b0, b1, count], i) => {
        const x = padL + ((b0 - min) / (max - min)) * W;
        const w = ((b1 - b0) / (max - min)) * W - 1;
        const h = (count / maxCount) * H;
        const isOutlier = b0 < thMin || b1 > thMax;
        return <rect key={i} x={x} y={padT + H - h} width={w} height={h} fill={isOutlier ? t.statusAlarm : t.colorBess} rx="1"/>;
      })}
      {[min, thMin, thMax, max].map(v => {
        const x = padL + ((v - min) / (max - min)) * W;
        return <text key={v} x={x} y={height - 6} fill={t.textSoft} fontSize="9" fontFamily={t.fontLabel} textAnchor="middle">{v.toFixed(2)}V</text>;
      })}
    </svg>
  );
}

function ChartsShowcase({ t }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE[3] }}>
      <div>
        <div style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft, textTransform: 'uppercase', letterSpacing: 0.18, fontWeight: 600, marginBottom: 6 }}>Timeseries · forecast + NOW + thresholds</div>
        <TimeseriesChart t={t}/>
      </div>
      <div>
        <div style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft, textTransform: 'uppercase', letterSpacing: 0.18, fontWeight: 600, marginBottom: 6 }}>Histogram · cell voltage spread + thresholds</div>
        <Histogram t={t}/>
      </div>
    </div>
  );
}

// ─── ChatBubble + PrebuiltQueryCard (Analyst) ────────────────────────────
function ChatBubble({ t, role, text, time }) {
  const isUser = role === 'user';
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      gap: 2, width: '100%',
    }}>
      {!isUser && (
        <div style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft, letterSpacing: 0.18, textTransform: 'uppercase', fontWeight: 600 }}>Arc Node</div>
      )}
      <div style={{
        maxWidth: '78%',
        padding: `${SPACE[2]}px ${SPACE[3]}px`,
        background: isUser ? t.accentFaint : t.panel,
        border: `1px solid ${isUser ? (t.accentBorder || t.accent) : t.borderSoft}`,
        borderRadius: RADIUS[3],
        fontFamily: t.fontBody, fontSize: 13, color: t.text, lineHeight: 1.5,
      }}>{text}</div>
      <div style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft, opacity: 0.6 }}>{time}</div>
    </div>
  );
}

function PrebuiltQueryCard({ t, label }) {
  return (
    <div style={{
      padding: SPACE[3],
      background: t.surface, border: `1px solid ${t.border}`,
      borderLeft: `3px solid ${t.accent}`,
      borderRadius: RADIUS[3],
      cursor: 'pointer', minWidth: 200, maxWidth: 280,
    }}>
      <div style={{
        fontFamily: t.fontLabel, fontSize: 9, color: t.accent,
        letterSpacing: 0.18, textTransform: 'uppercase', fontWeight: 700,
        marginBottom: 4,
      }}>Prebuilt</div>
      <div style={{ fontFamily: t.fontBody, fontSize: 12, color: t.text, lineHeight: 1.5 }}>{label}</div>
    </div>
  );
}

function AnalystShowcase({ t }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[3], maxWidth: 520, width: '100%' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE[2] }}>
        <PrebuiltQueryCard t={t} label="Why did BESS-02 alarm last night?"/>
        <PrebuiltQueryCard t={t} label="How much energy did I consume this week vs. last week?"/>
        <PrebuiltQueryCard t={t} label="Is my BESS degrading? Show cell voltage spread over time"/>
      </div>
      <div style={{
        background: t.surface, border: `1px solid ${t.border}`,
        borderRadius: RADIUS[3], padding: SPACE[3],
        display: 'flex', flexDirection: 'column', gap: SPACE[3],
      }}>
        <ChatBubble t={t} role="user" text="Why did BESS-02 alarm last night?" time="2:14 PM"/>
        <ChatBubble t={t} role="agent" text="BESS-02 raised a cell voltage spread alarm at 22:47 UTC. The pack's cell voltage distribution widened to 142 mV — above the 100 mV threshold. I've added the cell voltage distribution and pack current to your chart. The widening began during a 38 kW discharge into the cluster around 22:30." time="2:14 PM"/>
      </div>
    </div>
  );
}

Object.assign(window, {
  MeasurementRow, MeasurementRowShowcase,
  GPUHeatmapCell, GPUHeatmapShowcase,
  CommandPanel, ConfirmationModal, CommandShowcase,
  TimeseriesChart, Histogram, ChartsShowcase,
  ChatBubble, PrebuiltQueryCard, AnalystShowcase,
});
