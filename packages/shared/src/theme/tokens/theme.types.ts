/**
 * Theme type contract — the Theme interface every component consumes via
 * useTheme(). Defines the SHAPE; SOVEREIGN + SOLARPUNK provide values.
 *
 * Naming follows handoff/00-constitution.md §1: status colors RESERVED,
 * domain colors for measurement display only, accent for interactivity.
 */

import type { SPACE, RADIUS, MOTION, Z_INDEX } from "./primitives";
import type { TYPE_RAMP } from "./typography";

export type ThemeName = "sovereign" | "solarpunk";

export type StatusVariant =
  | "ok"
  | "warn"
  | "alarm"
  | "fire"
  | "maintenance"
  | "offline"
  | "sim";

export type DomainKey =
  | "bess"
  | "compute"
  | "thermal"
  | "grid"
  | "pv"
  | "revenue";

export type ElevationLevel = 0 | 1 | 2 | 3 | 4;

/** Elevation recipe — tonal background + optional hairline highlight + optional drop shadow. */
export interface ElevationRecipe {
  background: string;
  highlight: string | null;
  shadow: string | null;
}

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
  bg: string;
  surface: string;
  panel: string;
  raised: string;
  sunken: string;

  // ── Border + divider ────────────────────────────────────────────────────
  border: string;
  borderSoft: string;
  borderFocus: string;

  // ── Text ────────────────────────────────────────────────────────────────
  text: string;
  textMid: string;
  textSoft: string;
  textFaint: string;
  textInverse: string;

  // ── Accent — CTAs, focus, active nav. NOT alarm. ────────────────────────
  accent: string;
  accentDim: string;
  accentFaint: string;
  accentBorder: string;

  // ── Status — RESERVED. Never decorative (DS-001, Hollifield §7.11) ──────
  statusOk: string;
  statusWarn: string;
  statusAlarm: string;
  statusFire: string;
  statusMaintenance: string;
  statusOffline: string;
  statusSim: string;

  // ── Domain measurement colors ───────────────────────────────────────────
  colorBess: string;
  colorCompute: string;
  colorThermal: string;
  colorGrid: string;
  colorPv: string;
  colorRevenue: string;

  // ── Chart-specific ──────────────────────────────────────────────────────
  chartGrid: string;
  chartAxis: string;
  chartForecastAlpha: number;

  // ── State overlays ──────────────────────────────────────────────────────
  hoverOverlay: string;
  pressedOverlay: string;
  disabledOpacity: number;
  focusRing: string;

  // ── Elevation levels ────────────────────────────────────────────────────
  elevation: Record<ElevationLevel, ElevationRecipe>;

  // ── Font families ───────────────────────────────────────────────────────
  fontHeading: string;
  fontLabel: string;
  fontBody: string;
  fontMono: string;

  // ── Device chrome ───────────────────────────────────────────────────────
  deviceFrame: string;
  statusBarFg: string;

  // ── Derived maps ────────────────────────────────────────────────────────
  statusColors: Record<StatusVariant, string>;
  domainColors: Record<DomainKey, string>;
}
