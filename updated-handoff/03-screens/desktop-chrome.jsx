// desktop-chrome.jsx — Desktop framing + persistent chrome.
// - Fake browser tab strip (route)
// - Sidebar (220px expanded / 56px collapsed)
// - Top bar (deployment, SIM/LIVE, alarm bell, user)
// - Persistent status strip (full width, below top bar)

const { useState: useStateChrome } = React;

// ─── Browser tab strip (the desktop "frame") ──────────────────────
function BrowserTabStrip({ t, route = '/', onNavigate }) {
  const isSov = t.name === 'sovereign';
  const chromeBg  = isSov ? '#1a1a1a' : '#d8d0bf';
  const tabBg     = t.bg;
  const tabFg     = t.text;
  const inactiveFg = t.textSoft;
  const dividerC  = isSov ? '#0a0a0a' : '#b5ad9c';

  // Single-tab chrome: ARCNODE EMS only. We don't ship a wiki or a separate
  // analyst server as products, so don't fake them in the chrome.
  const tabs = [
    { id: 'arc',  label: 'ARCNODE · Brookside DC-1', active: true,  url: `arcnode.customer-site.internal${route}` },
  ];

  return (
    <div style={{
      background: chromeBg,
      borderBottom: `1px solid ${dividerC}`,
      fontFamily: t.fontLabel,
      flexShrink: 0,
      userSelect: 'none',
    }}>
      {/* tab row */}
      <div style={{
        display: 'flex', alignItems: 'flex-end',
        height: 36, padding: '0 8px', gap: 2,
      }}>
        {/* traffic-light dots */}
        <div style={{ display: 'flex', gap: 6, padding: '0 10px 8px 4px' }}>
          {['#ff5f57', '#febc2e', '#28c840'].map(c => (
            <span key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c, opacity: isSov ? 0.85 : 1 }}/>
          ))}
        </div>
        {tabs.map(tab => (
          <div key={tab.id} style={{
            position: 'relative',
            background: tab.active ? tabBg : 'transparent',
            color: tab.active ? tabFg : inactiveFg,
            padding: '8px 14px 10px',
            fontSize: 11, letterSpacing: 0.05,
            borderRadius: '8px 8px 0 0',
            display: 'flex', alignItems: 'center', gap: 8,
            maxWidth: 280, minWidth: 0,
            cursor: 'pointer',
            borderTop: tab.active ? `1px solid ${dividerC}` : 'none',
            borderLeft: tab.active ? `1px solid ${dividerC}` : 'none',
            borderRight: tab.active ? `1px solid ${dividerC}` : 'none',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: tab.active ? t.statusOk : (isSov ? '#3a3a3a' : '#a89e8c'),
              flexShrink: 0,
            }}/>
            <span style={{
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              fontWeight: tab.active ? 600 : 400,
            }}>{tab.label}</span>
          </div>
        ))}
      </div>
      {/* address bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 12px',
        background: tabBg,
        borderTop: `1px solid ${dividerC}`,
      }}>
        {/* nav arrows */}
        <div style={{ display: 'flex', gap: 4, color: t.textSoft }}>
          <span style={{ fontSize: 14, padding: '2px 6px', cursor: 'pointer' }}>‹</span>
          <span style={{ fontSize: 14, padding: '2px 6px', cursor: 'pointer', opacity: 0.4 }}>›</span>
          <span style={{ fontSize: 12, padding: '2px 6px', cursor: 'pointer' }}>↻</span>
        </div>
        {/* url pill */}
        <div style={{
          flex: 1,
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: RADIUS.full,
          padding: '4px 12px',
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 11, color: t.text,
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={t.statusOk} strokeWidth="2.5">
            <path d="M8 11 V7 a4 4 0 0 1 8 0 V11"/>
            <rect x="5" y="11" width="14" height="10" rx="1.5" fill={t.statusOk} stroke="none"/>
          </svg>
          <span style={{ color: t.textSoft }}>https://</span>
          <span style={{ fontWeight: 500 }}>arcnode.customer-site.internal</span>
          <span style={{ color: t.textMid }}>{route}</span>
          <span style={{ flex: 1 }}/>
          <span style={{ color: t.textSoft, fontSize: 10 }}>SIM · sandbox</span>
        </div>
        <div style={{ display: 'flex', gap: 6, color: t.textSoft, fontSize: 10 }}>
          <span style={{ padding: '4px 6px' }}>★</span>
          <span style={{ padding: '4px 6px' }}>⋯</span>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', route: '/',          Icon: IconOverview },
  { id: 'modules',  label: 'Modules',  route: '/modules',   Icon: IconModules,  badge: 2 },
  { id: 'sld',      label: 'SLD',      route: '/modules/sld', Icon: IconGrid },
  { id: 'energy',   label: 'Energy',   route: '/energy',    Icon: IconEnergy },
  { id: 'compute',  label: 'Compute',  route: '/compute',   Icon: IconCompute },
  { id: 'analyst',  label: 'Analyst',  route: '/analyst',   Icon: IconAnalyst },
];

function Sidebar({ t, route, collapsed, onNavigate, density }) {
  const isSov = t.name === 'sovereign';
  const w = collapsed ? 56 : 220;
  const dense = density === 'dense';

  return (
    <div style={{
      width: w, flexShrink: 0,
      background: t.panel,
      borderRight: `1px solid ${t.border}`,
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.2s ease',
      overflow: 'hidden',
    }}>
      {/* logo lockup */}
      <div style={{
        height: 56, padding: collapsed ? '0' : `0 ${SPACE[4]}px`,
        display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 10,
        borderBottom: `1px solid ${t.border}`,
        flexShrink: 0,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: RADIUS[2],
          background: t.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <path d="M4 18 L12 4 L20 18 M7 14 H17"/>
          </svg>
        </div>
        {!collapsed && (
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: t.fontHeading, fontSize: 16,
              color: t.text, lineHeight: 1.1,
              textTransform: isSov ? 'uppercase' : 'none',
              letterSpacing: isSov ? 1.2 : 0,
              fontWeight: isSov ? 400 : 600,
            }}>ARCNODE</div>
            <div style={{
              fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft,
              letterSpacing: 0.18, textTransform: 'uppercase', marginTop: 1,
            }}>EMS · v0.7</div>
          </div>
        )}
      </div>

      {/* deployment identity (single-site per tab — not a switcher) */}
      {!collapsed && (
        <div style={{
          margin: `${SPACE[3]}px ${SPACE[3]}px 0`,
          padding: `${SPACE[2]}px ${SPACE[3]}px`,
          borderLeft: `2px solid ${t.accent}`,
        }}>
          <div style={{
            fontFamily: t.fontLabel, fontSize: 8, letterSpacing: 0.22,
            color: t.textSoft, textTransform: 'uppercase', fontWeight: 700,
          }}>Site</div>
          <div style={{
            fontFamily: t.fontBody, fontSize: 13, color: t.text, fontWeight: 600,
            marginTop: 2, lineHeight: 1.2,
          }}>Brookside DC-1</div>
          <div style={{
            fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft, letterSpacing: 0.1,
            marginTop: 2,
          }}>arcnode.customer-site.internal</div>
        </div>
      )}

      {/* nav items */}
      <div style={{
        padding: `${SPACE[3]}px ${collapsed ? 0 : SPACE[2]}px`,
        flex: 1, overflowY: 'auto',
      }}>
        {!collapsed && (
          <div style={{
            fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.2,
            color: t.textSoft, textTransform: 'uppercase', fontWeight: 600,
            padding: `${SPACE[2]}px ${SPACE[3]}px ${SPACE[1]}px`,
          }}>Operate</div>
        )}
        {NAV_ITEMS.map(it => {
          const active = it.route === route ||
            (it.id === 'modules' && route.startsWith('/modules') && it.id !== 'sld') ||
            (it.id === 'sld' && route === '/modules/sld');
          // tighten match: exact route or prefix for parent
          const isExact = it.route === route;
          const isParent = it.id !== 'sld' && route.startsWith(it.route) && it.route !== '/';
          const act = isExact || (isParent && it.route !== '/modules' || (it.id === 'modules' && route === '/modules'));
          // simpler:
          const a = it.route === route;
          return (
            <div key={it.id}
              onClick={() => onNavigate && onNavigate(it.route)}
              style={{
                display: 'flex', alignItems: 'center',
                gap: collapsed ? 0 : 10,
                padding: collapsed ? '10px 0' : `${dense ? 7 : 9}px ${SPACE[3]}px`,
                margin: collapsed ? '2px 8px' : '1px 0',
                borderRadius: RADIUS[2],
                background: a ? t.accentFaint : 'transparent',
                color: a ? t.accent : t.textMid,
                cursor: 'pointer', position: 'relative',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderLeft: a && !collapsed ? `2px solid ${t.accent}` : `2px solid transparent`,
                paddingLeft: collapsed ? 0 : (a ? SPACE[3] - 2 : SPACE[3]),
              }}>
              <it.Icon size={18} color={a ? t.accent : t.textMid}/>
              {!collapsed && (
                <>
                  <span style={{
                    fontFamily: t.fontBody, fontSize: 13,
                    fontWeight: a ? 600 : 500,
                    flex: 1,
                  }}>{it.label}</span>
                  {it.badge && (
                    <span style={{
                      minWidth: 18, height: 16, padding: '0 5px',
                      borderRadius: 8, background: t.statusAlarm,
                      color: '#fff', fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{it.badge}</span>
                  )}
                </>
              )}
              {collapsed && it.badge && (
                <span style={{
                  position: 'absolute', top: 6, right: 8,
                  width: 8, height: 8, borderRadius: '50%',
                  background: t.statusAlarm,
                  border: `1.5px solid ${t.panel}`,
                }}/>
              )}
            </div>
          );
        })}

        {!collapsed && (
          <>
            <div style={{
              fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.2,
              color: t.textSoft, textTransform: 'uppercase', fontWeight: 600,
              padding: `${SPACE[4]}px ${SPACE[3]}px ${SPACE[1]}px`,
            }}>Admin</div>
            {[
              { label: 'Settings',  Icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.textMid} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15 a1.7 1.7 0 0 0 .3 1.8 l.1.1 a2 2 0 1 1 -2.8 2.8 l-.1-.1 a1.7 1.7 0 0 0 -1.8-.3 1.7 1.7 0 0 0 -1 1.5 V21 a2 2 0 1 1 -4 0 v-.1 a1.7 1.7 0 0 0 -1.1-1.5 1.7 1.7 0 0 0 -1.8.3 l-.1.1 a2 2 0 1 1 -2.8 -2.8 l.1-.1 a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0 -1.5-1 H3 a2 2 0 1 1 0 -4 h.1 a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0 -.3-1.8 l-.1-.1 a2 2 0 1 1 2.8 -2.8 l.1.1 a1.7 1.7 0 0 0 1.8.3 H9 a1.7 1.7 0 0 0 1-1.5 V3 a2 2 0 1 1 4 0 v.1 a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3 l.1-.1 a2 2 0 1 1 2.8 2.8 l-.1.1 a1.7 1.7 0 0 0 -.3 1.8 V9 a1.7 1.7 0 0 0 1.5 1 H21 a2 2 0 1 1 0 4 h-.1 a1.7 1.7 0 0 0 -1.5 1 z"/></svg> },
              { label: 'Audit log', Icon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.textMid} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3 H6 a2 2 0 0 0 -2 2 v14 a2 2 0 0 0 2 2 h12 a2 2 0 0 0 2 -2 V9 z"/><path d="M14 3 v6 h6 M9 13 h6 M9 17 h6"/></svg> },
            ].map(it => (
              <div key={it.label} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: `${dense ? 7 : 9}px ${SPACE[3]}px`,
                color: t.textMid, cursor: 'pointer',
                borderRadius: RADIUS[2],
              }}>
                <it.Icon/>
                <span style={{ fontFamily: t.fontBody, fontSize: 13 }}>{it.label}</span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* user / collapse toggle */}
      <div style={{
        borderTop: `1px solid ${t.border}`,
        padding: collapsed ? '10px 0' : `${SPACE[3]}px`,
        display: 'flex', alignItems: 'center', gap: 10,
        justifyContent: collapsed ? 'center' : 'flex-start',
        flexShrink: 0,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: t.accent, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: t.fontLabel, fontSize: 11, fontWeight: 700,
          flexShrink: 0,
        }}>RM</div>
        {!collapsed && (
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: t.fontBody, fontSize: 12, color: t.text, fontWeight: 600 }}>R. Marquez</div>
            <div style={{ fontFamily: t.fontLabel, fontSize: 9, color: t.textSoft, letterSpacing: 0.15, textTransform: 'uppercase' }}>Lead operator</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Top bar ──────────────────────────────────────────────────────
function DesktopTopBar({ t, route, density }) {
  const isSov = t.name === 'sovereign';
  // breadcrumb from route
  const crumbs = (() => {
    if (route === '/') return ['Brookside DC-1', 'Overview'];
    if (route.startsWith('/modules/sld')) return ['Brookside DC-1', 'Modules', 'SLD'];
    if (route.startsWith('/modules')) return ['Brookside DC-1', 'Modules'];
    if (route.startsWith('/energy')) return ['Brookside DC-1', 'Energy'];
    if (route.startsWith('/compute')) return ['Brookside DC-1', 'Compute'];
    if (route.startsWith('/analyst')) return ['Brookside DC-1', 'Analyst'];
    return ['Brookside DC-1'];
  })();
  return (
    <div style={{
      height: density === 'dense' ? 48 : 56,
      padding: `0 ${SPACE[5]}px`,
      borderBottom: `1px solid ${t.border}`,
      background: t.bg,
      display: 'flex', alignItems: 'center', gap: SPACE[4],
      flexShrink: 0,
    }}>
      {/* breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span style={{ color: t.textFaint, fontSize: 11 }}>›</span>}
            <span style={{
              fontFamily: i === crumbs.length - 1 ? t.fontHeading : t.fontLabel,
              fontSize: i === crumbs.length - 1 ? 16 : 11,
              fontWeight: i === crumbs.length - 1 ? (isSov ? 400 : 600) : 600,
              letterSpacing: i === crumbs.length - 1 && isSov ? 0.5 : 0.15,
              textTransform: i === crumbs.length - 1 ? (isSov ? 'uppercase' : 'none') : 'uppercase',
              color: i === crumbs.length - 1 ? t.text : t.textSoft,
              whiteSpace: 'nowrap',
            }}>{c}</span>
          </React.Fragment>
        ))}
      </div>

      {/* global search */}
      <div style={{
        width: 280,
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: RADIUS[2],
        padding: '5px 10px',
        display: 'flex', alignItems: 'center', gap: 8,
        color: t.textSoft, fontSize: 11,
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={t.textSoft} strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21 L16 16"/></svg>
        <span style={{ flex: 1, fontFamily: t.fontBody }}>Search modules, alarms, points…</span>
        <span style={{
          fontFamily: t.fontLabel, fontSize: 9, letterSpacing: 0.1,
          background: t.bg, border: `1px solid ${t.border}`,
          padding: '1px 5px', borderRadius: RADIUS[1],
        }}>⌘K</span>
      </div>

      {/* time/clock */}
      <div style={{
        fontFamily: t.fontLabel, fontSize: 11, color: t.textMid, letterSpacing: 0.1,
        whiteSpace: 'nowrap',
      }}>
        14:32:08 <span style={{ color: t.textSoft }}>UTC−07</span>
      </div>

      {/* SIM/LIVE pill — bigger on desktop */}
      <div style={{
        padding: '4px 10px',
        borderRadius: RADIUS[2],
        background: t.statusOk + '20',
        border: `1px solid ${t.statusOk}`,
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700, letterSpacing: 0.18,
        color: t.statusOk, textTransform: 'uppercase',
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.statusOk, boxShadow: `0 0 0 3px ${t.statusOk}30` }}/>
        Live
      </div>

      {/* alarm bell */}
      <div style={{ position: 'relative', cursor: 'pointer', padding: 4 }}>
        <IconBell size={18} color={t.textMid}/>
        <div style={{
          position: 'absolute', top: 0, right: 0,
          minWidth: 14, height: 14, padding: '0 4px',
          borderRadius: 7, background: t.statusAlarm,
          color: '#fff', fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1.5px solid ${t.bg}`,
        }}>2</div>
      </div>
    </div>
  );
}

// ─── Status strip (desktop variant — 6 segments instead of 4) ─────
function DesktopStatusStrip({ t }) {
  const items = [
    { label: 'SITE',      value: 'Nominal',  color: t.statusOk, dot: true },
    { label: 'FLEET SoC', value: '74%',      color: t.colorBess, sub: '6.2 h runway' },
    { label: 'GPU UTIL',  value: '79%',      color: t.colorCompute, sub: '830 kW draw · fleet' },
    { label: 'GRID',      value: 'Import',   color: t.colorGrid, sub: '142 kW · 60.00 Hz' },
    { label: 'PUE · 24h', value: '1.14',     color: t.colorThermal, sub: '↓ 0.03' },
    { label: 'CLOCK',     value: 'T+04:18',  color: t.textMid, sub: 'since last incident' },
  ];
  return (
    <div style={{
      height: 44, display: 'flex',
      borderBottom: `1px solid ${t.border}`,
      background: t.panel,
      flexShrink: 0,
    }}>
      {items.map((it, i) => (
        <div key={it.label} style={{
          flex: 1,
          borderRight: i < items.length - 1 ? `1px solid ${t.border}` : 'none',
          display: 'flex', alignItems: 'center',
          gap: 10, padding: `0 ${SPACE[4]}px`, minWidth: 0,
        }}>
          {it.dot && (
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: it.color,
              boxShadow: `0 0 0 3px ${it.color}25`,
              flexShrink: 0,
            }}/>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontFamily: t.fontLabel, fontSize: 9, fontWeight: 600, letterSpacing: 0.18,
              color: t.textSoft, textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}>{it.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{
                fontFamily: t.fontLabel, fontSize: 14, fontWeight: 600,
                color: i === 0 ? it.color : t.text,
                whiteSpace: 'nowrap', letterSpacing: -0.2,
              }}>{it.value}</span>
              {it.sub && (
                <span style={{
                  fontFamily: t.fontLabel, fontSize: 10, color: t.textSoft,
                  whiteSpace: 'nowrap',
                }}>{it.sub}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

window.BrowserTabStrip = BrowserTabStrip;
window.Sidebar = Sidebar;
window.DesktopTopBar = DesktopTopBar;
window.DesktopStatusStrip = DesktopStatusStrip;
