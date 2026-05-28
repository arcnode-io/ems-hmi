/**
 * Primitive scales — shared across themes. Spacing, radius, motion, z-index,
 * breakpoints, fixed-size shell elements. See design-handoff/01-tokens for design intent.
 *
 * Components consume via `t.space[n]`, `t.radius[n]`, `MOTION.duration.fast`, etc.
 * Never use raw px values in component code.
 */

/** Spacing scale. Base unit 4px. Use `t.space[n]` everywhere — never raw px. */
export const SPACE = {
  0: 0,
  1: 4, // tight internal (badge inner)
  2: 8, // component-internal gaps
  3: 12, // dense card padding
  4: 16, // standard card padding, phone gutter
  5: 24, // tablet gutter, section spacing
  6: 32, // large section spacing
  7: 40, // section dividers (desktop)
  8: 48, // desktop page margin
  10: 64, // hero spacing (NOC TV)
} as const;
export type SpaceKey = keyof typeof SPACE;

/** Corner radius scale. */
export const RADIUS = {
  0: 0,
  1: 2, // tight chips, indicator dots
  2: 4, // badges, pills, status chips
  3: 6, // cards, panels (default)
  4: 8, // modals, large panels
  5: 12, // sheets, drawers
  full: 9999,
} as const;
export type RadiusKey = keyof typeof RADIUS;

/** Motion durations (ms) + named easings. */
export const MOTION = {
  duration: {
    instant: 0, // discrete state changes (offline transition)
    fast: 100, // counter morph, micro-feedback
    base: 200, // hover, focus, state transitions
    slow: 350, // panel open/close, alarm entry
    pulse: 800, // fire alarm pulse cycle
  },
  easing: {
    standard: "cubic-bezier(0.2, 0.0, 0.0, 1.0)", // most things
    decelerate: "cubic-bezier(0.0, 0.0, 0.2, 1.0)", // entering
    accelerate: "cubic-bezier(0.4, 0.0, 1.0, 1.0)", // exiting
    pulse: "ease-in-out", // alarm pulse
  },
} as const;

/** Layer stacking. Larger = higher. */
export const Z_INDEX = {
  base: 0,
  raised: 1, // hover state lift
  overlay: 10, // dropdowns, tooltips
  sidebar: 20,
  topbar: 30,
  modal: 40,
  alarm: 50, // fire alarm full-screen overlay
  sim: 60, // SIM banner above everything else
  toast: 70,
} as const;

/** Breakpoint min-widths (px). Mobile-first: every breakpoint adds density. */
export const BREAKPOINTS = {
  xs: 0, // phone:    < 480px
  sm: 480, // tablet:   480-1023px
  lg: 1024, // desktop:  1024-1599px
  xl: 1600, // NOC TV:   ≥ 1600px (future)
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
  touchTarget: 44, // WCAG minimum tap target — never below this
} as const;
