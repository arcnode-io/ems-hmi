// gallery-tier1.jsx — Shell + composition components
// StatusBadge · KPITile · ModuleCard · AlarmRow · SectionHeader

// ─── StatusBadge ─────────────────────────────────────────────────────────
// The cornerstone alarm-visual primitive. Variants drive both color and icon.
// Two flavors: informational (default) and interactive (chevron + onPress).

function StatusBadge({ t, variant, label, size = 'md', acknowledged = true, interactive = false }) {
  const color = t.statusColors ? t.statusColors[variant] :
    variant === 'ok' ? t.statusOk :
    variant === 'warn' ? t.statusWarn :
    variant === 'alarm' ? t.statusAlarm :
    variant === 'fire' ? t.statusFire :
    variant === 'maintenance' ? t.statusMaintenance :
    variant === 'offline' ? t.statusOffline :
    variant === 'sim' ? t.statusSim :
    t.text;

  const sizes = {
    sm: { iconSize: 12, fontSize: 9,  padV: 2, padH: 6 },
    md: { iconSize: 14, fontSize: 10, padV: 3, padH: 8 },
    lg: { iconSize: 18, fontSize: 12, padV: 5, padH: 11 },
  };
  const s = sizes[size];

  const Icon =
    variant === 'warn' ? IconWarning :
    variant === 'alarm' ? IconAlarm :
    variant === 'fire' ? IconFire :
    variant === 'maintenance' ? IconWrench :
    variant === 'ok' ? IconCheck :
    null;

  // Fire pulse animation is handled by a CSS class for prefers-reduced-motion
  const pulse = variant === 'fire';
  const flash = !acknowledged && (variant === 'warn' || variant === 'alarm');

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: `${s.padV}px ${s.padH}px`,
      borderRadius: RADIUS[2],
      background: color + '18',
      border: `1px solid ${color}55`,
      animation: pulse ? 'firePulse 800ms ease-in-out infinite' :
                 flash ? 'badgeFlash 1.4s ease-in-out infinite' : undefined,
      cursor: interactive ? 'pointer' : 'default',
    }}>
      {Icon && <Icon size={s.iconSize} color={color}/>}
      {label && (
        <span style={{
          fontFamily: t.fontLabel, fontSize: s.fontSize, fontWeight: 700,
          letterSpacing: 0.18, textTransform: 'uppercase',
          color: color,
        }}>{label}</span>
      )}
      {interactive && (
        <span style={{ marginLeft: 2, color: color, opacity: 0.7, fontSize: s.fontSize + 1 }}>›</span>
      )}
    </span>
  );
}

function StatusBadgeShowcase({ t }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE[2] }}>
      {['ok', 'warn', 'alarm', 'fire', 'maintenance', 'offline', 'sim'].map(v => (
        <StateCell key={v} t={t} label={v} w={130}>
          <StatusBadge t={t} variant={v} label={v.toUpperCase()}/>
        </StateCell>
      ))}
      <StateCell t={t} label="unacknowledged" w={150}>
        <StatusBadge t={t} variant="alarm" label="ALARM" acknowledged={false}/>
      </StateCell>
      <StateCell t={t} label="interactive (→)" w={150}>
        <StatusBadge t={t} variant="warn" label="2 ACTIVE" interactive/>
      </StateCell>
      <StateCell t={t} label="sm · icon only" w={120}>
        <StatusBadge t={t} variant="alarm" size="sm"/>
      </StateCell>
      <StateCell t={t} label="lg" w={120}>
        <StatusBadge t={t} variant="ok" label="LIVE" size="lg"/>
      </StateCell>
    </div>
  );
}

// ─── KPITile ─────────────────────────────────────────────────────────────
// Compact metric — value + unit + label + optional trend + sublabel.
// Designed to fit 3 values in a 120px-wide card; never wider than 240px.

function KPITile({ t, label, value, unit, sublabel, trend, trendValue, colorToken = 'colorCompute', icon: IconComp }) {
  const tcolor = trend === 'up'   ? t.statusOk
               : trend === 'down' ? t.statusWarn
               : t.textMid;
  return (
    <div style={{
      width: 200,
      padding: SPACE[3],
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: RADIUS[3],
      boxShadow: t.name === 'sovereign'
        ? 'inset 0 1px 0 rgba(255,255,255,0.03)'
        : 'inset 0 1px 0 rgba(255,255,255,0.4)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.18,
          color: t.textSoft, textTransform: 'uppercase', fontWeight: 600,
          whiteSpace: 'nowrap',
        }}>{label}</span>
        {IconComp && <IconComp size={13} color={t.textSoft}/>}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: SPACE[3] }}>
        <span style={{
          fontFamily: t.fontLabel, fontSize: 26, fontWeight: 400,
          color: t[colorToken] || t.text, letterSpacing: -0.5, lineHeight: 1.0,
          fontVariantNumeric: 'tabular-nums',
        }}>{value}</span>
        {unit && (
          <span style={{ fontFamily: t.fontLabel, fontSize: 11, color: t.textMid }}>{unit}</span>
        )}
        {trend && trendValue && (
          <span style={{
            fontFamily: t.fontLabel, fontSize: 11, color: tcolor, marginLeft: 4,
          }}>{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}</span>
        )}
      </div>
      {sublabel && (
        <div style={{
          fontFamily: t.fontBody, fontSize: 11, color: t.textMid, marginTop: 6,
        }}>{sublabel}</div>
      )}
    </div>
  );
}

function KPITileShowcase({ t }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE[3] }}>
      <KPITile t={t} label="BESS SoC" value="74" unit="%" sublabel="~6.2h runway" colorToken="colorBess" icon={IconBess}/>
      <KPITile t={t} label="Net power" value="184.2" unit="kW" sublabel="Consuming" colorToken="colorCompute" icon={IconBolt}/>
      <KPITile t={t} label="PUE · 24h" value="1.14" trend="down" trendValue="0.03" sublabel="< 1.20 target" colorToken="colorThermal"/>
      <KPITile t={t} label="GPU util" value="88" unit="%" trend="up" trendValue="3" sublabel="32 servers" colorToken="colorCompute" icon={IconCompute}/>
      <KPITile t={t} label="Grid mode" value="IMPORT" sublabel="142 kW from grid" colorToken="colorGrid" icon={IconGrid}/>
      <KPITile t={t} label="No data" value="—" sublabel="awaiting telemetry"/>
    </div>
  );
}

// ─── SectionHeader ───────────────────────────────────────────────────────
function SectionHeader({ t, label, heading, sub, action }) {
  const isSov = t.name === 'sovereign';
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: SPACE[3], width: '100%' }}>
      <div style={{
        padding: '2px 8px', borderRadius: RADIUS[2],
        background: t.accentFaint, border: `1px solid ${t.accent}55`,
        fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700, letterSpacing: 0.2,
        color: t.accent, textTransform: 'uppercase',
        flexShrink: 0,
      }}>{label}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: t.fontHeading, fontSize: 18, lineHeight: 1.2,
          color: t.text, fontWeight: isSov ? 400 : 500,
          letterSpacing: isSov ? 0.5 : 0,
          textTransform: isSov ? 'uppercase' : 'none',
        }}>{heading}</div>
        {sub && <div style={{
          fontFamily: t.fontBody, fontSize: 11, color: t.textMid, marginTop: 2,
        }}>{sub}</div>}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}

function SectionHeaderShowcase({ t }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[3], width: '100%' }}>
      <div style={{ padding: SPACE[3], background: t.surface, border: `1px solid ${t.border}`, borderRadius: RADIUS[3] }}>
        <SectionHeader t={t} label="Energy" heading="Power balance" sub="Last 24 hours · 1h resolution"/>
      </div>
      <div style={{ padding: SPACE[3], background: t.surface, border: `1px solid ${t.border}`, borderRadius: RADIUS[3] }}>
        <SectionHeader t={t} label="Operations" heading="Active alarms"
          sub="2 unacknowledged · sorted by severity"
          action={<span style={{ fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700, color: t.accent, letterSpacing: 0.15, textTransform: 'uppercase' }}>History →</span>}/>
      </div>
    </div>
  );
}

// ─── ModuleCard ──────────────────────────────────────────────────────────
// Composes ModuleType icon + display name + StatusBadge + measurement rows.
// Maintenance overlay is the trickiest state.

function ModuleCard({ t, moduleType, displayName, status = 'ok', acknowledged = true, alarmCount = 0, maintenance = false, measurements = [] }) {
  const ModIcon = moduleType === 'bess' ? IconBess
               : moduleType === 'compute' ? IconCompute
               : moduleType === 'thermal' ? IconThermal
               : moduleType === 'grid' ? IconGrid
               : IconBess;
  const domainColor = t.domainColors
    ? t.domainColors[moduleType]
    : t['color' + moduleType.charAt(0).toUpperCase() + moduleType.slice(1)] || t.text;
  const isSov = t.name === 'sovereign';
  const statusVariant = maintenance ? 'maintenance' : status;

  return (
    <div style={{
      width: 320,
      background: t.surface,
      border: `1px solid ${maintenance ? t.statusMaintenance : t.border}`,
      borderRadius: RADIUS[3],
      padding: SPACE[3],
      opacity: maintenance ? 0.85 : 1,
      boxShadow: t.name === 'sovereign'
        ? 'inset 0 1px 0 rgba(255,255,255,0.03)'
        : 'inset 0 1px 0 rgba(255,255,255,0.4)',
    }}>
      {/* header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE[2] }}>
        <div style={{
          width: 28, height: 28, borderRadius: RADIUS[2],
          background: domainColor + '20', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <ModIcon size={16} color={domainColor}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: t.fontLabel, fontSize: 12, fontWeight: 700, color: t.text,
            letterSpacing: 0.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{displayName}</div>
          <div style={{
            fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft,
            letterSpacing: 0.18, textTransform: 'uppercase', fontWeight: 600,
            marginTop: 1,
          }}>{moduleType} module</div>
        </div>
        {alarmCount > 0 && !maintenance && (
          <div style={{
            minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9,
            background: status === 'alarm' ? t.statusAlarm : t.statusWarn,
            color: '#fff', fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>{alarmCount}</div>
        )}
        <StatusBadge t={t} variant={statusVariant} size="sm" acknowledged={acknowledged}/>
      </div>

      {/* measurement rows */}
      {measurements.length > 0 && (
        <div style={{
          marginTop: SPACE[3], paddingTop: SPACE[2],
          borderTop: `1px solid ${t.borderSoft}`,
          display: 'flex', flexDirection: 'column', gap: SPACE[2],
        }}>
          {measurements.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SPACE[2] }}>
              <span style={{
                fontFamily: t.fontBody, fontSize: 11,
                color: maintenance ? t.textSoft : t.textMid,
              }}>{m.label}</span>
              <span style={{
                fontFamily: t.fontLabel, fontSize: 12, fontWeight: 600,
                color: maintenance ? t.textSoft : t.text,
                fontVariantNumeric: 'tabular-nums',
              }}>{m.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* maintenance wrench corner */}
      {maintenance && (
        <div style={{
          position: 'relative', marginTop: SPACE[2],
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '4px 6px', borderRadius: RADIUS[2],
          background: t.statusMaintenance + '15',
        }}>
          <IconWrench size={10} color={t.statusMaintenance}/>
          <span style={{
            fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700,
            color: t.statusMaintenance, letterSpacing: 0.18, textTransform: 'uppercase',
          }}>Maintenance mode</span>
        </div>
      )}
    </div>
  );
}

function ModuleCardShowcase({ t }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE[3] }}>
      <ModuleCard t={t} moduleType="bess" displayName="BESS-01" status="ok"
        measurements={[
          { label: 'SoC', value: '74%' },
          { label: 'Power', value: '−42 kW' },
          { label: 'Pack temp', value: '24.8 °C' },
        ]}/>
      <ModuleCard t={t} moduleType="bess" displayName="BESS-02" status="alarm" acknowledged={false} alarmCount={1}
        measurements={[
          { label: 'SoC', value: '68%' },
          { label: 'Cell spread', value: '0.142 V' },
          { label: 'Pack temp', value: '28.4 °C' },
        ]}/>
      <ModuleCard t={t} moduleType="compute" displayName="COMPUTE-S04" status="warn" acknowledged={false}
        measurements={[
          { label: 'Avg util', value: '91%' },
          { label: 'Power', value: '942 / 1000 W' },
          { label: 'CDU outlet', value: '38.4 °C' },
        ]}/>
      <ModuleCard t={t} moduleType="thermal" displayName="CDU-01" maintenance
        measurements={[
          { label: 'Coolant in', value: '—' },
          { label: 'Coolant out', value: '—' },
        ]}/>
      <ModuleCard t={t} moduleType="grid" displayName="GRID-01" status="ok"
        measurements={[
          { label: 'Mode', value: 'IMPORT' },
          { label: 'Real power', value: '+142 kW' },
          { label: 'Frequency', value: '60.01 Hz' },
        ]}/>
      <ModuleCard t={t} moduleType="compute" displayName="COMPUTE-S99" status="offline"
        measurements={[
          { label: 'Last seen', value: '4m ago' },
        ]}/>
    </div>
  );
}

// ─── AlarmRow ────────────────────────────────────────────────────────────
function AlarmRow({ t, severity = 'alarm', acknowledged = false, device, name, value, age }) {
  const sevColor = severity === 'fire' ? t.statusFire
                : severity === 'alarm' ? t.statusAlarm
                : t.statusWarn;
  const SevIcon = severity === 'fire' ? IconFire
                : severity === 'alarm' ? IconAlarm
                : IconWarning;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: SPACE[3],
      padding: SPACE[3], background: t.surface,
      borderTop: `1px solid ${t.borderSoft}`,
      borderLeft: !acknowledged ? `3px solid ${sevColor}` : 'none',
      paddingLeft: !acknowledged ? SPACE[3] - 3 : SPACE[3],
    }}>
      {/* unack pulse dot */}
      <div style={{ width: 8, display: 'flex', justifyContent: 'center' }}>
        {!acknowledged && (
          <span style={{
            width: 7, height: 7, borderRadius: '50%', background: sevColor,
            boxShadow: `0 0 0 3px ${sevColor}30`,
            animation: 'ackPulse 1.4s ease-in-out infinite',
          }}/>
        )}
      </div>

      <SevIcon size={16} color={sevColor}/>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontFamily: t.fontLabel, fontSize: 11, fontWeight: 700, color: t.text, letterSpacing: 0.1 }}>{device}</span>
          <span style={{ fontFamily: t.fontLabel, fontSize: 10, color: t.textSoft }}>· {age}</span>
        </div>
        <div style={{
          fontFamily: t.fontBody, fontSize: 12, color: t.textMid,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {name} · <span style={{ color: t.text, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
        </div>
      </div>

      {!acknowledged ? (
        <button style={{
          background: 'transparent', border: `1px solid ${t.border}`,
          color: t.text, fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700,
          letterSpacing: 0.15, textTransform: 'uppercase',
          padding: '6px 10px', borderRadius: RADIUS[2], cursor: 'pointer',
        }}>Ack</button>
      ) : (
        <span style={{
          fontFamily: t.fontLabel, fontSize: 10, color: t.textSoft,
          textTransform: 'uppercase', letterSpacing: 0.15,
        }}>Ack'd</span>
      )}
    </div>
  );
}

function AlarmRowShowcase({ t }) {
  return (
    <div style={{
      width: '100%',
      background: t.surface, border: `1px solid ${t.border}`,
      borderRadius: RADIUS[3], overflow: 'hidden',
    }}>
      <AlarmRow t={t} severity="alarm" acknowledged={false}
        device="BESS-02" name="Cell voltage spread" value="0.142 V" age="4m ago"/>
      <AlarmRow t={t} severity="warn" acknowledged={false}
        device="COMPUTE-S04" name="CDU outlet rising" value="38.4 °C" age="17m ago"/>
      <AlarmRow t={t} severity="warn" acknowledged={true}
        device="COMPUTE-S14" name="Power approaching cap" value="942 / 1000 W" age="1h 04m ago"/>
      <AlarmRow t={t} severity="fire" acknowledged={false}
        device="BESS-03" name="Thermal runaway" value="78.2 °C" age="just now"/>
    </div>
  );
}

Object.assign(window, {
  StatusBadge, StatusBadgeShowcase,
  KPITile, KPITileShowcase,
  SectionHeader, SectionHeaderShowcase,
  ModuleCard, ModuleCardShowcase,
  AlarmRow, AlarmRowShowcase,
});
