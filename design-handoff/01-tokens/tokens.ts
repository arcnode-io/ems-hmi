// =============================================================================
//  ARCNODE EMS HMI — Design Tokens
//  Source of truth for the entire design system. Web + mobile both consume this.
// =============================================================================
//
//  ARCHITECTURE
//  ────────────
//  - This file is the single source. tokens.dtcg.json and tokens.css are
//    GENERATED from it; never edit them by hand.
//  - Two themes: SOVEREIGN (dark) + SOLARPUNK (light). Both first-class.
//  - Primitive scales (space, radius, motion, z, breakpoints, type ramp) are
//    shared across themes.
//  - Components consume via useTheme() → returns the active theme object.
//
//  RULES (see handoff/00-constitution.md for the full list)
//  ────────────────────────────────────────────────────────
//  1. NEVER hardcode a hex value in component code. Always go through a token.
//  2. Status colors (warn/alarm/fire) are RESERVED — never use them
//     decoratively. Pre-attentive channel must stay clean (Hollifield §7.11).
//  3. When adding a new color need, prefer a semantic alias of an existing
//     token over inventing a new primitive value. The chroma+lightness
//     coherence of both themes is intentional.
//  4. RN gotcha: `flexDirection` defaults to `column` on RN, `row` on web.
//     Always specify it explicitly in components shared across platforms.
//
//  ADDING A TOKEN
//  ──────────────
//  1. Add the field to the Theme type below.
//  2. Add the value to BOTH SOVEREIGN and SOLARPUNK (no exceptions —
//     monochrome themes are not real themes).
//  3. Run `npm run tokens:generate` to refresh tokens.dtcg.json + tokens.css.
//  4. Update the relevant per-component .md if the new token is component-scoped.
//
//  REMOVING A TOKEN
//  ────────────────
//  Same dance, but check usage first: ripgrep `t\.<tokenName>` across packages.
//  TypeScript will catch the rest at build time.
//
// =============================================================================


// -----------------------------------------------------------------------------
//  PRIMITIVES — shared across themes
// -----------------------------------------------------------------------------

/** Spacing scale. Base unit 4px. Use `t.space[n]` everywhere — never raw px. */
export const SPACE = {
  0: 0,
  1: 4,    // tight internal (badge inner)
  2: 8,    // component-internal gaps
  3: 12,   // dense card padding
  4: 16,   // standard card padding, phone gutter
  5: 24,   // tablet gutter, section spacing
  6: 32,   // large section spacing
  7: 40,   // section dividers (desktop)
  8: 48,   // desktop page margin
  10: 64,  // hero spacing (NOC TV)
} as const;
export type SpaceKey = keyof typeof SPACE;

/** Corner radius scale. */
export const RADIUS = {
  0: 0,
  1: 2,     // tight chips, indicator dots
  2: 4,     // badges, pills, status chips
  3: 6,     // cards, panels (default)
  4: 8,     // modals, large panels
  5: 12,    // sheets, drawers
  full: 9999,
} as const;
export type RadiusKey = keyof typeof RADIUS;

/** Motion durations (ms) + named easings. */
export const MOTION = {
  duration: {
    instant: 0,         // discrete state changes (offline transition)
    fast: 100,          // counter morph, micro-feedback
    base: 200,          // hover, focus, state transitions
    slow: 350,          // panel open/close, alarm entry
    pulse: 800,         // fire alarm pulse cycle
  },
  easing: {
    standard: 'cubic-bezier(0.2, 0.0, 0.0, 1.0)',     // most things
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1.0)',   // entering
    accelerate: 'cubic-bezier(0.4, 0.0, 1.0, 1.0)',   // exiting
    pulse: 'ease-in-out',                              // alarm pulse
  },
} as const;

/** Layer stacking. Larger = higher. */
export const Z_INDEX = {
  base: 0,
  raised: 1,        // hover state lift
  overlay: 10,      // dropdowns, tooltips
  sidebar: 20,
  topbar: 30,
  modal: 40,
  alarm: 50,        // fire alarm full-screen overlay
  sim: 60,          // SIM banner above everything else
  toast: 70,
} as const;

/** Breakpoint min-widths (px). Mobile-first: every breakpoint adds density. */
export const BREAKPOINTS = {
  xs: 0,        // phone:    < 480px
  sm: 480,      // tablet:   480-1023px
  lg: 1024,     // desktop:  1024-1599px
  xl: 1600,     // NOC TV:   ≥ 1600px (future)
} as const;
export type BreakpointKey = keyof typeof BREAKPOINTS;

/** Size constants for fixed-size shell elements. */
export const SIZE = {
  topBar: 64,
  statusStrip: 32,
  sidebar: 220,
  sidebarCollapsed: 56,
  tableRow: 38,
  cardPaddingBase: 12,
  touchTarget: 44,     // WCAG minimum tap target — never below this
} as const;


// -----------------------------------------------------------------------------
//  TYPE RAMP — semantic typography roles
//  Font *family* is resolved per-theme; sizes/weights are shared.
//  Use `t.type[role]` in components, never raw fontSize/fontWeight.
// -----------------------------------------------------------------------------

/** Resolved at render via the theme's font tokens. */
export type TypeRole =
  | 'display'        // hero numbers (huge KPIs on NOC TV)
  | 'screenTitle'    // page titles
  | 'cardHeading'    // section / card headings (Bebas Neue / Cormorant)
  | 'kpiValue'       // SoC %, kW values
  | 'kpiLabel'       // "BESS STATE OF CHARGE", uppercase
  | 'body'           // alarm descriptions, table rows
  | 'bodyDense'      // dense table rows, measurement rows
  | 'label'          // form labels, axis labels
  | 'caption'        // timestamps, secondary
  | 'monoData'       // tabular numeric data (JetBrains Mono / Space Mono)
  | 'monoCode';      // IPs, device IDs, raw topics

export interface TypeStyle {
  /** Reference to theme.font{Heading,Label,Body,Mono} — resolved at runtime. */
  family: 'heading' | 'label' | 'body' | 'mono';
  size: number;          // px
  weight: number;        // 100–900
  lineHeight: number;    // unitless multiplier
  letterSpacing: number; // em
  /** Apply text-transform: uppercase. Used for kpiLabel, caption sometimes. */
  uppercase?: boolean;
  /** Use `font-feature-settings: "tnum"` for tabular numerics. */
  tabular?: boolean;
}

export const TYPE_RAMP: Record<TypeRole, TypeStyle> = {
  display:     { family: 'label',   size: 56, weight: 300, lineHeight: 1.0, letterSpacing: -0.02, tabular: true },
  screenTitle: { family: 'heading', size: 32, weight: 400, lineHeight: 1.1, letterSpacing: 0 },
  cardHeading: { family: 'heading', size: 18, weight: 500, lineHeight: 1.2, letterSpacing: 0 },
  kpiValue:    { family: 'label',   size: 32, weight: 400, lineHeight: 1.0, letterSpacing: -0.02, tabular: true },
  kpiLabel:    { family: 'label',   size: 10, weight: 600, lineHeight: 1.2, letterSpacing: 0.15, uppercase: true },
  body:        { family: 'body',    size: 13, weight: 400, lineHeight: 1.5, letterSpacing: 0 },
  bodyDense:   { family: 'body',    size: 12, weight: 400, lineHeight: 1.35, letterSpacing: 0 },
  label:       { family: 'label',   size: 11, weight: 500, lineHeight: 1.3, letterSpacing: 0.05 },
  caption:     { family: 'label',   size: 10, weight: 500, lineHeight: 1.3, letterSpacing: 0.1 },
  monoData:    { family: 'mono',    size: 13, weight: 400, lineHeight: 1.4, letterSpacing: 0, tabular: true },
  monoCode:    { family: 'mono',    size: 12, weight: 400, lineHeight: 1.5, letterSpacing: 0 },
};


// -----------------------------------------------------------------------------
//  ELEVATION — shared recipe; each theme provides the actual color values
//  This shape is *intentionally minimal* — depth is mostly tonal layering
//  (bg → surface → panel → raised), not big shadows. See constitution.
// -----------------------------------------------------------------------------

export type ElevationLevel = 0 | 1 | 2 | 3 | 4;

export interface ElevationRecipe {
  /** Background fill for this layer. */
  background: string;
  /** 1px inner-top hairline highlight (or empty). */
  highlight: string | null;
  /** 1px outer drop shadow (or empty). */
  shadow: string | null;
}


// -----------------------------------------------------------------------------
//  THEME TYPE — the contract every component consumes via useTheme()
// -----------------------------------------------------------------------------

export type ThemeName = 'sovereign' | 'solarpunk';

export type StatusVariant = 'ok' | 'warn' | 'alarm' | 'fire' | 'maintenance' | 'offline' | 'sim';
export type DomainKey = 'bess' | 'compute' | 'thermal' | 'grid' | 'pv' | 'revenue';

export interface Theme {
  name: ThemeName;

  // ── Primitive scales (same on every theme; mirrored here for ergonomics) ─
  /** Spacing scale 0..10. Use `t.space[3]` instead of raw px. */
  space: typeof SPACE;
  /** Radius scale 0..5 + `full`. */
  radius: typeof RADIUS;
  /** Motion durations + easings. */
  motion: typeof MOTION;
  /** Z-index stack. */
  zIndex: typeof Z_INDEX;
  /** Type ramp (size/weight/family role mapping). */
  type: typeof TYPE_RAMP;

  // ── Surface (tonal layering) ────────────────────────────────────────────
  /** Page background — the deepest layer. */
  bg: string;
  /** Card / panel background. */
  surface: string;
  /** Inner panel, sidebar, drawer. */
  panel: string;
  /** Raised element (modal, hover-lifted card). */
  raised: string;
  /** Sunken element (input field, recessed well). */
  sunken: string;

  // ── Border + divider ────────────────────────────────────────────────────
  border: string;
  borderSoft: string;
  /** Used for focus rings — high contrast against bg. */
  borderFocus: string;

  // ── Text ────────────────────────────────────────────────────────────────
  text: string;        // primary
  textMid: string;     // secondary
  textSoft: string;    // tertiary, placeholders, axis labels
  textFaint: string;   // disabled
  /** Text on colored backgrounds (accent button, alarm badge fill, etc). */
  textInverse: string;

  // ── Accent — CTAs, focus, active nav. NOT alarm. ────────────────────────
  accent: string;
  accentDim: string;       // hover
  accentFaint: string;     // accent background wash
  accentBorder: string;    // accent-tinted border for active states

  // ── Status — RESERVED. Never use decoratively (DS-001, Hollifield §7.11) ─
  statusOk: string;
  statusWarn: string;
  statusAlarm: string;
  statusFire: string;
  statusMaintenance: string;
  statusOffline: string;
  statusSim: string;

  // ── Domain measurement colors — non-alarm, for charts + KPI hue coding ──
  colorBess: string;
  colorCompute: string;
  colorThermal: string;
  colorGrid: string;
  colorPv: string;
  colorRevenue: string;

  // ── Chart-specific ──────────────────────────────────────────────────────
  chartGrid: string;
  chartAxis: string;
  /** Multiplier applied to series alpha for forecast (dashed) renders. */
  chartForecastAlpha: number;

  // ── State overlays — used by hover, pressed, focus, disabled ────────────
  /** rgba overlay laid over a surface on hover. */
  hoverOverlay: string;
  /** rgba overlay laid over a surface on press. */
  pressedOverlay: string;
  /** Opacity multiplier for disabled elements. */
  disabledOpacity: number;
  /** Focus ring color (matches accent or borderFocus depending on bg). */
  focusRing: string;

  // ── Elevation levels ────────────────────────────────────────────────────
  /** Level 0 = flat on bg; level 4 = modal-tier raised. */
  elevation: Record<ElevationLevel, ElevationRecipe>;

  // ── Font families ───────────────────────────────────────────────────────
  fontHeading: string;
  fontLabel: string;
  fontBody: string;
  fontMono: string;

  // ── Device chrome (status bar + bezel rendering) ────────────────────────
  deviceFrame: string;
  statusBarFg: string;

  // ── Reusable derived helpers ────────────────────────────────────────────
  /** Maps StatusVariant → its color. */
  statusColors: Record<StatusVariant, string>;
  /** Maps DomainKey → its color. */
  domainColors: Record<DomainKey, string>;
}


// -----------------------------------------------------------------------------
//  withAlpha — small helper for token-derived opacity variants
//  Used in components like: `t.statusAlarm + withAlpha(0.12)` won't work,
//  so use: backgroundColor: withAlpha(t.statusAlarm, 0.12)
// -----------------------------------------------------------------------------
export function withAlpha(hex: string, alpha: number): string {
  // hex: #rrggbb (no shorthand support — keep it strict)
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}


// =============================================================================
//  SOVEREIGN — dark theme (default for NOC operator context)
// =============================================================================
export const SOVEREIGN: Theme = {
  name: 'sovereign',

  // Primitives (mirrored for ergonomic access via useTheme())
  space: SPACE,
  radius: RADIUS,
  motion: MOTION,
  zIndex: Z_INDEX,
  type: TYPE_RAMP,

  // Surface
  bg:      '#080808',
  surface: '#0e0e0e',
  panel:   '#131313',
  raised:  '#1a1a1a',
  sunken:  '#050505',

  // Border
  border:       '#1f1f1f',
  borderSoft:   '#2a2a2a',
  borderFocus:  '#4a7aaa',

  // Text
  text:         '#d4d0c8',
  textMid:      '#8a8680',
  textSoft:     '#6b6860',
  textFaint:    '#3a3835',
  textInverse:  '#0a0a0a',

  // Accent — slate-blue. Replaces amber per DS-001 (alarm exclusivity).
  accent:        '#4a7aaa',
  accentDim:     '#3a6090',
  accentFaint:   '#0a1520',
  accentBorder:  '#2a4866',

  // Status (RESERVED)
  statusOk:           '#4a7c5f',
  statusWarn:         '#f5a623',
  statusAlarm:        '#e84040',
  statusFire:         '#ff2020',
  statusMaintenance:  '#7a6aaa',
  statusOffline:      '#3a3835',
  statusSim:          '#4a7aaa',  // intentionally = accent (SIM is not an alarm)

  // Domain
  colorBess:    '#4a7c5f',
  colorCompute: '#4a7aaa',
  colorThermal: '#4a9a9a',
  colorGrid:    '#7a9e87',
  colorPv:      '#d4a849',
  colorRevenue: '#b89a5e',

  // Chart
  chartGrid:           'rgba(255, 255, 255, 0.06)',
  chartAxis:           'rgba(255, 255, 255, 0.12)',
  chartForecastAlpha:  0.7,

  // State overlays
  hoverOverlay:    'rgba(255, 255, 255, 0.04)',
  pressedOverlay:  'rgba(255, 255, 255, 0.08)',
  disabledOpacity: 0.4,
  focusRing:       '#4a7aaa',

  // Elevation — strictly tonal + hairline; no big drop shadows
  elevation: {
    0: { background: '#080808', highlight: null,                                shadow: null },
    1: { background: '#0e0e0e', highlight: 'inset 0 1px 0 rgba(255,255,255,0.025)', shadow: null },
    2: { background: '#131313', highlight: 'inset 0 1px 0 rgba(255,255,255,0.03)',  shadow: '0 1px 0 rgba(0,0,0,0.4)' },
    3: { background: '#1a1a1a', highlight: 'inset 0 1px 0 rgba(255,255,255,0.04)',  shadow: '0 2px 8px rgba(0,0,0,0.5)' },
    4: { background: '#1f1f1f', highlight: 'inset 0 1px 0 rgba(255,255,255,0.05)',  shadow: '0 8px 24px rgba(0,0,0,0.6)' },
  },

  // Type
  fontHeading: '"Bebas Neue", "Arial Narrow", sans-serif',
  fontLabel:   '"DM Mono", ui-monospace, monospace',
  fontBody:    '"DM Mono", ui-monospace, monospace',
  fontMono:    '"DM Mono", ui-monospace, monospace',

  // Device
  deviceFrame: '#000000',
  statusBarFg: '#d4d0c8',

  // Derived maps — keep in sync with the fields above
  statusColors: {
    ok: '#4a7c5f', warn: '#f5a623', alarm: '#e84040', fire: '#ff2020',
    maintenance: '#7a6aaa', offline: '#3a3835', sim: '#4a7aaa',
  },
  domainColors: {
    bess: '#4a7c5f', compute: '#4a7aaa', thermal: '#4a9a9a',
    grid: '#7a9e87', pv: '#d4a849', revenue: '#b89a5e',
  },
};


// =============================================================================
//  SOLARPUNK — light theme (default for field + bright office contexts)
// =============================================================================
export const SOLARPUNK: Theme = {
  name: 'solarpunk',

  // Primitives
  space: SPACE,
  radius: RADIUS,
  motion: MOTION,
  zIndex: Z_INDEX,
  type: TYPE_RAMP,

  // Surface — warm cream foundation
  bg:      '#f5f0e8',
  surface: '#ede7d9',
  panel:   '#e8e2d4',
  raised:  '#f9f5ec',
  sunken:  '#e0d8c8',

  // Border
  border:       '#d0c8b8',
  borderSoft:   '#e0d8c8',
  borderFocus:  '#1e3a2f',

  // Text
  text:         '#2a2218',
  textMid:      '#5a5248',
  textSoft:     '#8a8278',
  textFaint:    '#b0a898',
  textInverse:  '#f5f0e8',

  // Accent — forest green
  accent:        '#1e3a2f',
  accentDim:     '#2d5a44',
  accentFaint:   '#e0f0e8',
  accentBorder:  '#88a89a',

  // Status (RESERVED)
  statusOk:           '#2d5a44',
  statusWarn:         '#c8820a',
  statusAlarm:        '#cc2929',
  statusFire:         '#cc0000',
  statusMaintenance:  '#5a4a8a',
  statusOffline:      '#b0a898',
  statusSim:          '#3a5a8a',

  // Domain
  colorBess:    '#2d5a44',
  colorCompute: '#3a5a8a',
  colorThermal: '#2d7a7a',
  colorGrid:    '#4a7c5f',
  colorPv:      '#a87818',
  colorRevenue: '#7a5e2a',

  // Chart
  chartGrid:           'rgba(0, 0, 0, 0.08)',
  chartAxis:           'rgba(0, 0, 0, 0.18)',
  chartForecastAlpha:  0.65,

  // State overlays
  hoverOverlay:    'rgba(0, 0, 0, 0.03)',
  pressedOverlay:  'rgba(0, 0, 0, 0.06)',
  disabledOpacity: 0.45,
  focusRing:       '#1e3a2f',

  // Elevation — light theme uses subtle bottom shadows + hairline-only
  elevation: {
    0: { background: '#f5f0e8', highlight: null,                                shadow: null },
    1: { background: '#ede7d9', highlight: 'inset 0 1px 0 rgba(255,255,255,0.4)', shadow: null },
    2: { background: '#e8e2d4', highlight: 'inset 0 1px 0 rgba(255,255,255,0.5)', shadow: '0 1px 0 rgba(0,0,0,0.04)' },
    3: { background: '#f9f5ec', highlight: 'inset 0 1px 0 rgba(255,255,255,0.6)', shadow: '0 2px 8px rgba(0,0,0,0.08)' },
    4: { background: '#ffffff', highlight: 'inset 0 1px 0 rgba(255,255,255,0.7)', shadow: '0 8px 24px rgba(0,0,0,0.12)' },
  },

  // Type — editorial pairing
  fontHeading: '"Cormorant Garamond", "Georgia", serif',
  fontLabel:   '"Space Mono", ui-monospace, monospace',
  fontBody:    '"Plus Jakarta Sans", system-ui, sans-serif',
  fontMono:    '"Space Mono", ui-monospace, monospace',

  // Device
  deviceFrame: '#3a3835',
  statusBarFg: '#2a2218',

  // Derived maps
  statusColors: {
    ok: '#2d5a44', warn: '#c8820a', alarm: '#cc2929', fire: '#cc0000',
    maintenance: '#5a4a8a', offline: '#b0a898', sim: '#3a5a8a',
  },
  domainColors: {
    bess: '#2d5a44', compute: '#3a5a8a', thermal: '#2d7a7a',
    grid: '#4a7c5f', pv: '#a87818', revenue: '#7a5e2a',
  },
};


// =============================================================================
//  EXPORTS
// =============================================================================

/** All themes, keyed by name — useful for picker UIs and tests. */
export const THEMES: Record<ThemeName, Theme> = {
  sovereign: SOVEREIGN,
  solarpunk: SOLARPUNK,
};

/** Default theme — Sovereign for NOC operator context (see IA brief §3). */
export const DEFAULT_THEME: ThemeName = 'sovereign';

/**
 * Resolve a TypeStyle to a runtime style object, with the active theme's font.
 *
 * Usage:
 *   const styles = resolveTypeStyle(t, 'kpiValue');
 *   <Text style={styles}>74%</Text>
 */
export function resolveTypeStyle(
  theme: Theme,
  role: TypeRole,
): Record<string, string | number> {
  const spec = TYPE_RAMP[role];
  const family =
    spec.family === 'heading' ? theme.fontHeading :
    spec.family === 'label'   ? theme.fontLabel   :
    spec.family === 'mono'    ? theme.fontMono    :
                                theme.fontBody;
  const out: Record<string, string | number> = {
    fontFamily: family,
    fontSize: spec.size,
    fontWeight: spec.weight,
    lineHeight: spec.lineHeight,
    letterSpacing: `${spec.letterSpacing}em`,
  };
  if (spec.uppercase) out.textTransform = 'uppercase';
  if (spec.tabular)   out.fontVariantNumeric = 'tabular-nums';
  return out;
}
