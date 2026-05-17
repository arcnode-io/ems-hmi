/**
 * SOLARPUNK — light theme. Default for field + bright office contexts.
 * Status colors RESERVED per constitution §1 (Hollifield §7.11).
 */

import type { Theme } from "./theme.types";
import { SPACE, RADIUS, MOTION, Z_INDEX } from "./primitives";
import { TYPE_RAMP } from "./typography";

export const SOLARPUNK: Theme = {
  name: "solarpunk",

  // Primitives mirrored for ergonomic access via useTheme()
  space: SPACE,
  radius: RADIUS,
  motion: MOTION,
  zIndex: Z_INDEX,
  type: TYPE_RAMP,

  // Surface — warm cream foundation
  bg: "#f5f0e8",
  surface: "#ede7d9",
  panel: "#e8e2d4",
  raised: "#f9f5ec",
  sunken: "#e0d8c8",

  // Border
  border: "#d0c8b8",
  borderSoft: "#e0d8c8",
  borderFocus: "#1e3a2f",

  // Text
  text: "#2a2218",
  textMid: "#5a5248",
  textSoft: "#8a8278",
  textFaint: "#b0a898",
  textInverse: "#f5f0e8",

  // Accent — forest green
  accent: "#1e3a2f",
  accentDim: "#2d5a44",
  accentFaint: "#e0f0e8",
  accentBorder: "#88a89a",

  // Status (RESERVED)
  statusOk: "#2d5a44",
  statusWarn: "#c8820a",
  statusAlarm: "#cc2929",
  statusFire: "#cc0000",
  statusMaintenance: "#5a4a8a",
  statusOffline: "#b0a898",
  statusSim: "#3a5a8a",

  // Domain
  colorBess: "#2d5a44",
  colorCompute: "#3a5a8a",
  colorThermal: "#2d7a7a",
  colorGrid: "#4a7c5f",
  colorPv: "#a87818",
  colorRevenue: "#7a5e2a",

  // Chart
  chartGrid: "rgba(0, 0, 0, 0.08)",
  chartAxis: "rgba(0, 0, 0, 0.18)",
  chartForecastAlpha: 0.65,

  // State overlays
  hoverOverlay: "rgba(0, 0, 0, 0.03)",
  pressedOverlay: "rgba(0, 0, 0, 0.06)",
  disabledOpacity: 0.45,
  focusRing: "#1e3a2f",

  // Elevation — light theme uses subtle bottom shadows + hairline-only
  elevation: {
    0: { background: "#f5f0e8", highlight: null, shadow: null },
    1: { background: "#ede7d9", highlight: "inset 0 1px 0 rgba(255,255,255,0.4)", shadow: null },
    2: { background: "#e8e2d4", highlight: "inset 0 1px 0 rgba(255,255,255,0.5)", shadow: "0 1px 0 rgba(0,0,0,0.04)" },
    3: { background: "#f9f5ec", highlight: "inset 0 1px 0 rgba(255,255,255,0.6)", shadow: "0 2px 8px rgba(0,0,0,0.08)" },
    4: { background: "#ffffff", highlight: "inset 0 1px 0 rgba(255,255,255,0.7)", shadow: "0 8px 24px rgba(0,0,0,0.12)" },
  },

  // Type — editorial pairing
  fontHeading: '"Cormorant Garamond", "Georgia", serif',
  fontLabel: '"Space Mono", ui-monospace, monospace',
  fontBody: '"Plus Jakarta Sans", system-ui, sans-serif',
  fontMono: '"Space Mono", ui-monospace, monospace',

  // Device
  deviceFrame: "#3a3835",
  statusBarFg: "#2a2218",

  // Derived maps
  statusColors: {
    ok: "#2d5a44",
    warn: "#c8820a",
    alarm: "#cc2929",
    fire: "#cc0000",
    maintenance: "#5a4a8a",
    offline: "#b0a898",
    sim: "#3a5a8a",
  },
  domainColors: {
    bess: "#2d5a44",
    compute: "#3a5a8a",
    thermal: "#2d7a7a",
    grid: "#4a7c5f",
    pv: "#a87818",
    revenue: "#7a5e2a",
  },
};
