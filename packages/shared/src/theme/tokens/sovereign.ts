/**
 * SOVEREIGN — dark theme. Default for NOC operator context.
 * Status colors RESERVED per constitution §1 (Hollifield §7.11).
 */

import type { Theme } from "./theme.types";
import { SPACE, RADIUS, MOTION, Z_INDEX } from "./primitives";
import { TYPE_RAMP } from "./typography";

export const SOVEREIGN: Theme = {
  name: "sovereign",

  // Primitives mirrored for ergonomic access via useTheme()
  space: SPACE,
  radius: RADIUS,
  motion: MOTION,
  zIndex: Z_INDEX,
  type: TYPE_RAMP,

  // Surface
  bg: "#080808",
  surface: "#0e0e0e",
  panel: "#131313",
  raised: "#1a1a1a",
  sunken: "#050505",

  // Border
  border: "#1f1f1f",
  borderSoft: "#2a2a2a",
  borderFocus: "#4a7aaa",

  // Text
  text: "#d4d0c8",
  textMid: "#8a8680",
  textSoft: "#6b6860",
  textFaint: "#3a3835",
  textInverse: "#0a0a0a",

  // Accent — slate-blue. Replaces amber per DS-001 (alarm exclusivity).
  accent: "#4a7aaa",
  accentDim: "#3a6090",
  accentFaint: "#0a1520",
  accentBorder: "#2a4866",

  // Status (RESERVED)
  statusOk: "#4a7c5f",
  statusWarn: "#f5a623",
  statusAlarm: "#e84040",
  statusFire: "#ff2020",
  statusMaintenance: "#7a6aaa",
  statusOffline: "#3a3835",
  statusSim: "#4a7aaa", // intentionally = accent (SIM is not an alarm)

  // Domain
  colorBess: "#4a7c5f",
  colorCompute: "#4a7aaa",
  colorThermal: "#4a9a9a",
  colorGrid: "#7a9e87",
  colorPv: "#d4a849",
  colorRevenue: "#b89a5e",

  // Chart
  chartGrid: "rgba(255, 255, 255, 0.06)",
  chartAxis: "rgba(255, 255, 255, 0.12)",
  chartForecastAlpha: 0.7,

  // State overlays
  hoverOverlay: "rgba(255, 255, 255, 0.04)",
  pressedOverlay: "rgba(255, 255, 255, 0.08)",
  disabledOpacity: 0.4,
  focusRing: "#4a7aaa",

  // Elevation — strictly tonal + hairline; no big drop shadows
  elevation: {
    0: { background: "#080808", highlight: null, shadow: null },
    1: { background: "#0e0e0e", highlight: "inset 0 1px 0 rgba(255,255,255,0.025)", shadow: null },
    2: { background: "#131313", highlight: "inset 0 1px 0 rgba(255,255,255,0.03)", shadow: "0 1px 0 rgba(0,0,0,0.4)" },
    3: { background: "#1a1a1a", highlight: "inset 0 1px 0 rgba(255,255,255,0.04)", shadow: "0 2px 8px rgba(0,0,0,0.5)" },
    4: { background: "#1f1f1f", highlight: "inset 0 1px 0 rgba(255,255,255,0.05)", shadow: "0 8px 24px rgba(0,0,0,0.6)" },
  },

  // Type
  fontHeading: '"Bebas Neue", "Arial Narrow", sans-serif',
  fontLabel: '"DM Mono", ui-monospace, monospace',
  fontBody: '"DM Mono", ui-monospace, monospace',
  fontMono: '"DM Mono", ui-monospace, monospace',

  // Device
  deviceFrame: "#000000",
  statusBarFg: "#d4d0c8",

  // Derived maps — keep in sync with the fields above
  statusColors: {
    ok: "#4a7c5f",
    warn: "#f5a623",
    alarm: "#e84040",
    fire: "#ff2020",
    maintenance: "#7a6aaa",
    offline: "#3a3835",
    sim: "#4a7aaa",
  },
  domainColors: {
    bess: "#4a7c5f",
    compute: "#4a7aaa",
    thermal: "#4a9a9a",
    grid: "#7a9e87",
    pv: "#d4a849",
    revenue: "#b89a5e",
  },
};
