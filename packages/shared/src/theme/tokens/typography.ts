/**
 * Type ramp — semantic typography roles. Font *family* is resolved per-theme;
 * sizes/weights/line-heights are shared. Use `resolveTypeStyle(t, role)` in
 * components, never raw fontSize/fontWeight.
 */

import type { Theme } from "./theme.types";

/** Resolved at render via the theme's font tokens. */
export type TypeRole =
  | "display" // hero numbers (huge KPIs on NOC TV)
  | "screenTitle" // page titles
  | "cardHeading" // section / card headings
  | "kpiValue" // SoC %, kW values
  | "kpiLabel" // "BESS STATE OF CHARGE", uppercase
  | "body" // alarm descriptions, table rows
  | "bodyDense" // dense table rows, measurement rows
  | "label" // form labels, axis labels
  | "caption" // timestamps, secondary
  | "monoData" // tabular numeric data
  | "monoCode"; // IPs, device IDs, raw topics

export interface TypeStyle {
  /** Reference to theme.font{Heading,Label,Body,Mono} — resolved at runtime. */
  family: "heading" | "label" | "body" | "mono";
  size: number; // px
  weight: number; // 100–900
  lineHeight: number; // unitless multiplier
  letterSpacing: number; // em
  uppercase?: boolean;
  tabular?: boolean;
}

export const TYPE_RAMP: Record<TypeRole, TypeStyle> = {
  display: { family: "label", size: 56, weight: 300, lineHeight: 1.0, letterSpacing: -0.02, tabular: true },
  screenTitle: { family: "heading", size: 32, weight: 400, lineHeight: 1.1, letterSpacing: 0 },
  cardHeading: { family: "heading", size: 18, weight: 500, lineHeight: 1.2, letterSpacing: 0 },
  kpiValue: { family: "label", size: 32, weight: 400, lineHeight: 1.0, letterSpacing: -0.02, tabular: true },
  kpiLabel: { family: "label", size: 10, weight: 600, lineHeight: 1.2, letterSpacing: 0.15, uppercase: true },
  body: { family: "body", size: 13, weight: 400, lineHeight: 1.5, letterSpacing: 0 },
  bodyDense: { family: "body", size: 12, weight: 400, lineHeight: 1.35, letterSpacing: 0 },
  label: { family: "label", size: 11, weight: 500, lineHeight: 1.3, letterSpacing: 0.05 },
  caption: { family: "label", size: 10, weight: 500, lineHeight: 1.3, letterSpacing: 0.1 },
  monoData: { family: "mono", size: 13, weight: 400, lineHeight: 1.4, letterSpacing: 0, tabular: true },
  monoCode: { family: "mono", size: 12, weight: 400, lineHeight: 1.5, letterSpacing: 0 },
};

/**
 * Resolve a TypeStyle to a runtime style object using the active theme's font.
 * Returns a plain object usable as RN `<Text>` style or DOM `style` via RN-Web.
 * @param theme Active theme (Sovereign or Solarpunk)
 * @param role Semantic type role from TYPE_RAMP
 * @returns Style object with fontFamily / fontSize / fontWeight / lineHeight / letterSpacing
 * @example resolveTypeStyle(t, 'kpiValue') // → { fontFamily: '"DM Mono"...', fontSize: 32, ... }
 */
export function resolveTypeStyle(
  theme: Theme,
  role: TypeRole,
): Record<string, string | number> {
  const spec = TYPE_RAMP[role];
  const family =
    spec.family === "heading"
      ? theme.fontHeading
      : spec.family === "label"
        ? theme.fontLabel
        : spec.family === "mono"
          ? theme.fontMono
          : theme.fontBody;
  const out: Record<string, string | number> = {
    fontFamily: family,
    fontSize: spec.size,
    fontWeight: spec.weight,
    // Reason: RN-Web emits unitless lineHeight as literal `<n>px`, not a
    // font-size multiplier. Multiply here so the value is correct in px.
    lineHeight: Math.round(spec.size * spec.lineHeight),
    letterSpacing: `${spec.letterSpacing}em`,
  };
  if (spec.uppercase) out.textTransform = "uppercase";
  if (spec.tabular) out.fontVariantNumeric = "tabular-nums";
  return out;
}
