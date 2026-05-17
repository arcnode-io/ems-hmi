// delivery-portal-compact.jsx — one-screen variant.
// Single 1280×~860 viewport. No scrolling. Tight 3-column layout.

const MANIFEST_BUILD_C = {
  release:  'arcnode-ems-1.0.0',
  channel:  'production · signed',
  builtAt:  '29 Apr 2026 · 18:42 UTC',
  signedBy: '0xA3F1…9C72',
  site:     'Brookside DC-1',
  rev:      'Rev 3 · supersedes Rev 2 (14 Mar 2026)',
};

const SECTIONS_C = [
  {
    id: 'system',
    title: 'System Images',
    items: [
      { id: 'iso', no: 'A1',
        title: 'EMS HMI',
        sub:   'Debian 12 · linux-rt 6.6',
        files: [
          { format: 'iso',    bytes: '2.41 GB', primary: true },
          { format: 'sig',    bytes: '566 B' },
          { format: 'sha256', bytes: '128 B' },
        ] },
      { id: 'apk', no: 'A2',
        title: 'EMS Field Client',
        sub:   'Android · arm64-v8a · minSdk 30',
        files: [
          { format: 'apk', bytes: '38.4 MB', primary: true },
          { format: 'aab', bytes: '34.1 MB' },
        ] },
    ],
  },
  {
    id: 'engineering',
    title: 'Engineering Drawings',
    items: [
      { id: 'plates', no: 'D1',
        title: 'Interface Plates',
        sub:   '4 plates · BESS, cooling, and comms',
        files: [
          { format: 'dxf',  bytes: '880 KB',  primary: true },
          { format: 'step', bytes: '12.7 MB' },
          { format: 'pdf',  bytes: '1.2 MB' },
        ] },
      { id: 'sld', no: 'D2',
        title: 'Single Line Diagram',
        sub:   'AC + DC distribution to module level',
        files: [
          { format: 'dxf', bytes: '1.4 MB', primary: true },
          { format: 'pdf', bytes: '420 KB' },
        ] },
      { id: 'pid', no: 'D3',
        title: 'P&ID — Cooling',
        sub:   'Glycol loop · pumps · valves',
        files: [
          { format: 'dxf', bytes: '1.1 MB', primary: true },
          { format: 'pdf', bytes: '380 KB' },
        ] },
      { id: 'comms', no: 'D4',
        title: 'Comms Network',
        sub:   'Modbus · CAN · Ethernet topology',
        files: [
          { format: 'dxf', bytes: '960 KB', primary: true },
          { format: 'pdf', bytes: '310 KB' },
        ] },
      { id: 'install', no: 'D5',
        title: 'Installation Graph',
        sub:   'Install order · torque specs',
        files: [
          { format: 'dxf', bytes: '2.1 MB', primary: true },
          { format: 'pdf', bytes: '740 KB' },
        ] },
    ],
  },
  {
    id: 'manifests',
    title: 'Manifests & Schedules',
    items: [
      { id: 'bom', no: 'M1',
        title: 'Bill of Materials',
        sub:   '1,284 items · 47 vendors',
        files: [
          { format: 'json', bytes: '612 KB', primary: true },
          { format: 'xlsx', bytes: '288 KB' },
        ] },
      { id: 'cable', no: 'M2',
        title: 'Cable & Hose Schedule',
        sub:   '318 runs · cu · fiber · glycol · CDA',
        files: [
          { format: 'json', bytes: '184 KB', primary: true },
          { format: 'xlsx', bytes: '96 KB' },
        ] },
      { id: 'dtm', no: 'M3',
        title: 'Device Topology Manifest',
        sub:   '142 devices · addressing + bus map',
        files: [
          { format: 'json', bytes: '94 KB', primary: true },
        ] },
    ],
  },
];

// ─── Inline icons (small) ────────────────────────────────────────────
function ArrowDownC({ color, size = 11 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
         strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5 L12 19 M6 13 L12 19 L18 13"/>
    </svg>
  );
}
function CopyIconC({ color, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
         strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="8" width="13" height="13" rx="2"/>
      <path d="M16 8 V5 a 2 2 0 0 0 -2 -2 H5 a 2 2 0 0 0 -2 2 v9 a 2 2 0 0 0 2 2 h3"/>
    </svg>
  );
}
function CheckShieldC({ color, size = 11 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 L4 6 V12 C4 17 8 20 12 21 C16 20 20 17 20 12 V6 Z"/>
      <path d="M9 12 L11 14 L15 10"/>
    </svg>
  );
}

// ─── Compact format chip ─────────────────────────────────────────────
function FormatChipC({ t, format, primary, bytes }) {
  const colorByFormat = {
    iso: t.statusOk, apk: t.colorBess, aab: t.colorBess,
    json: t.accent, dxf: t.colorThermal, step: t.colorThermal,
    pdf: t.colorGrid, xlsx: t.colorRevenue,
    sig: t.textMid, sha256: t.textMid,
  };
  const c = colorByFormat[format] || t.textMid;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      height: 22, padding: '0 8px',
      borderRadius: RADIUS[1],
      background: primary ? c + '22' : 'transparent',
      border: `1px solid ${primary ? c + '60' : t.border}`,
      fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700, letterSpacing: 0.18,
      color: primary ? c : t.textMid, textTransform: 'uppercase',
      cursor: 'pointer',
    }}>
      <ArrowDownC color={primary ? c : t.textSoft} size={9}/>
      <span>{format}</span>
      <span style={{
        color: primary ? c + 'cc' : t.textSoft,
        fontWeight: 500, letterSpacing: 0.05, textTransform: 'none',
      }}>{bytes}</span>
    </span>
  );
}

// ─── Compact artifact row ────────────────────────────────────────────
function ArtifactRowC({ t, item, isLast }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '28px 1fr',
      gap: 10,
      padding: '10px 0',
      borderBottom: isLast ? 'none' : `1px solid ${t.border}`,
    }}>
      <div style={{
        fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700,
        color: t.textFaint, letterSpacing: 0.18,
        paddingTop: 2,
      }}>{item.no}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: t.fontBody, fontSize: 13, fontWeight: 600,
          color: t.text, lineHeight: 1.2,
        }}>{item.title}</div>
        <div style={{
          fontFamily: t.fontLabel, fontSize: 10,
          color: t.textSoft, marginTop: 2, lineHeight: 1.3,
          letterSpacing: 0.05,
        }}>{item.sub}</div>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 5,
          marginTop: 7,
        }}>
          {item.files.map((f, i) => (
            <FormatChipC key={f.format + i} t={t} format={f.format}
                         primary={f.primary} bytes={f.bytes}/>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Compact section column ──────────────────────────────────────────
function SectionColumnC({ t, section, idx }) {
  const isSov = t.name === 'sovereign';
  return (
    <div style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: RADIUS[3],
      padding: '14px 16px 6px',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 8,
        paddingBottom: 10,
        borderBottom: `1px solid ${t.border}`,
      }}>
        <div style={{
          fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700,
          color: t.textFaint, letterSpacing: 0.22,
        }}>§ {String(idx).padStart(2, '0')}</div>
        <div style={{
          flex: 1,
          fontFamily: t.fontHeading, fontSize: 17,
          fontWeight: isSov ? 400 : 600,
          letterSpacing: isSov ? 0.6 : 0,
          textTransform: isSov ? 'uppercase' : 'none',
          color: t.text, lineHeight: 1,
        }}>{section.title}</div>
        <div style={{
          fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700,
          color: t.textSoft, letterSpacing: 0.18, textTransform: 'uppercase',
        }}>{section.items.length} items</div>
      </div>
      <div>
        {section.items.map((item, i) => (
          <ArtifactRowC key={item.id} t={t} item={item}
                        isLast={i === section.items.length - 1}/>
        ))}
      </div>
    </div>
  );
}

// ─── Compact hero / bundle bar (single horizontal row) ───────────────
function HeroBarC({ t }) {
  const isSov = t.name === 'sovereign';
  const fileTotal = SECTIONS_C.reduce(
    (n, s) => n + s.items.reduce((m, it) => m + it.files.length, 0), 0);
  const itemTotal = SECTIONS_C.reduce((n, s) => n + s.items.length, 0);

  return (
    <div style={{
      padding: '20px 28px',
      borderBottom: `1px solid ${t.border}`,
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto auto',
      gap: 24, alignItems: 'center',
      background: t.surface,
    }}>
      {/* brand mark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: RADIUS[2],
          background: t.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
            <path d="M4 18 L12 4 L20 18 M7 14 H17"/>
          </svg>
        </div>
        <div>
          <div style={{
            fontFamily: t.fontHeading, fontSize: 18,
            fontWeight: isSov ? 400 : 600,
            letterSpacing: isSov ? 1.4 : 0,
            textTransform: isSov ? 'uppercase' : 'none',
            color: t.text, lineHeight: 1,
          }}>ARCNODE</div>
          <div style={{
            fontFamily: t.fontLabel, fontSize: 9,
            letterSpacing: 0.22, textTransform: 'uppercase',
            color: t.textSoft, marginTop: 3,
          }}>Delivery Portal</div>
        </div>
      </div>

      {/* title + meta */}
      <div style={{ minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap',
        }}>
          <div style={{
            fontFamily: t.fontHeading, fontSize: 26,
            fontWeight: isSov ? 400 : 600,
            letterSpacing: isSov ? 1 : -0.2,
            textTransform: isSov ? 'uppercase' : 'none',
            color: t.text, lineHeight: 1,
          }}>{MANIFEST_BUILD_C.site}</div>
          <span style={{
            fontFamily: t.fontLabel, fontSize: 11, fontWeight: 700,
            color: t.accent, letterSpacing: 0.18, textTransform: 'uppercase',
          }}>{MANIFEST_BUILD_C.release}</span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '2px 7px',
            background: t.statusOk + '20',
            border: `1px solid ${t.statusOk}50`,
            borderRadius: RADIUS[1],
            fontFamily: t.fontLabel, fontSize: 9, fontWeight: 700,
            letterSpacing: 0.18, color: t.statusOk, textTransform: 'uppercase',
          }}>
            <CheckShieldC color={t.statusOk} size={10}/>
            signed
          </span>
        </div>
        <div style={{
          fontFamily: t.fontLabel, fontSize: 10, color: t.textSoft,
          marginTop: 6, letterSpacing: 0.05,
        }}>
          {MANIFEST_BUILD_C.rev}  ·  Built {MANIFEST_BUILD_C.builtAt}  ·
          Key {MANIFEST_BUILD_C.signedBy}  ·  {itemTotal} artifacts · {fileTotal} files · 2.46 GB
        </div>
      </div>

      {/* manifest secondary */}
      <button style={{
        appearance: 'none', cursor: 'pointer',
        padding: '10px 14px',
        border: `1px solid ${t.border}`,
        background: 'transparent',
        color: t.text,
        borderRadius: RADIUS[2],
        fontFamily: t.fontLabel, fontSize: 10, fontWeight: 700, letterSpacing: 0.18,
        textTransform: 'uppercase',
      }}>Manifest.json</button>

      {/* download bundle primary */}
      <button style={{
        appearance: 'none', cursor: 'pointer',
        padding: '10px 18px',
        border: `1px solid ${t.accent}`,
        background: t.accent,
        color: '#fff',
        borderRadius: RADIUS[2],
        display: 'inline-flex', alignItems: 'center', gap: 8,
        fontFamily: t.fontLabel, fontSize: 11, fontWeight: 700, letterSpacing: 0.18,
        textTransform: 'uppercase',
      }}>
        <ArrowDownC color="#fff" size={12}/>
        Download bundle · 2.46 GB
      </button>
    </div>
  );
}

// ─── Compact terminal strip (block-level URL) ────────────────────────
function TerminalStripC({ t }) {
  return (
    <div style={{
      margin: '12px 28px 0',
      background: t.bg,
      border: `1px solid ${t.border}`,
      borderRadius: RADIUS[2],
      padding: '8px 14px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <pre style={{
        margin: 0, padding: 0, flex: 1, minWidth: 0,
        fontFamily: t.fontLabel, fontSize: 11, lineHeight: 1.4,
        color: t.textMid,
        whiteSpace: 'pre', overflow: 'hidden',
        userSelect: 'text',
      }}>
<span style={{ color: t.statusOk }}>$</span> <span style={{ color: t.text }}>curl -LO</span>  https://delivery.arcnode.io/brookside-dc-1/<span style={{ color: t.accent }}>arcnode.zip</span>
      </pre>
      <span style={{ cursor: 'pointer', padding: 4, flexShrink: 0 }}>
        <CopyIconC color={t.textSoft}/>
      </span>
    </div>
  );
}

// ─── Compact footer ──────────────────────────────────────────────────
function PortalFooterC({ t }) {
  return (
    <div style={{
      borderTop: `1px solid ${t.border}`,
      padding: '10px 28px',
      display: 'flex', alignItems: 'center', gap: 16,
      fontFamily: t.fontLabel, fontSize: 10,
      color: t.textSoft, letterSpacing: 0.1,
      background: t.panel,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <CheckShieldC color={t.statusOk} size={11}/>
        <span>Pre-signed URLs · expire 7 days from issue</span>
      </div>
    </div>
  );
}

// ─── Body (one-screen) ───────────────────────────────────────────────
function DeliveryPortalCompactBody({ t }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: t.bg,
      fontFamily: t.fontBody, color: t.text,
    }}>
      <HeroBarC t={t}/>
      <TerminalStripC t={t}/>

      <div style={{
        padding: '16px 28px 20px',
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr) minmax(0,1fr)',
        gap: 16,
        alignItems: 'start',
      }}>
        {SECTIONS_C.map((section, i) => (
          <SectionColumnC key={section.id} t={t} section={section} idx={i + 1}/>
        ))}
      </div>

      <PortalFooterC t={t}/>
    </div>
  );
}

window.DeliveryPortalCompactBody = DeliveryPortalCompactBody;
