/**
 * Shared utilities for ChartRenderer + its sub-renderers (Line/Bar/Pie/Table).
 */

import type { Theme } from "../../../theme/tokens";

/**
 * Cycle through domain colors for a series index. Bar / Pie / Line all use
 * the same palette so multi-artifact responses read as one visual family.
 */
export function seriesColor(t: Theme, idx: number): string {
  const palette = [t.colorBess, t.colorCompute, t.colorGrid, t.colorThermal];
  return palette[idx % palette.length] ?? t.text;
}

/**
 * Backend stubs render demo-only artifacts (e.g. `query_markets`,
 * `query_energy_breakdown`) with "PLACEHOLDER" in the title until the real
 * data pipeline lands. ChartRenderer surfaces a DEMO DATA chip on those.
 */
export function detectPlaceholder(title: string): boolean {
  return title.toUpperCase().includes("PLACEHOLDER");
}
