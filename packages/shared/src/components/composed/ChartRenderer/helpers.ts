import type { Theme } from "../../../theme/tokens";

/** Cycle a series index through the domain palette. */
export function seriesColor(t: Theme, idx: number): string {
  const palette = [t.colorBess, t.colorCompute, t.colorGrid, t.colorThermal];
  return palette[idx % palette.length] ?? t.text;
}

/** Treat any title containing "PLACEHOLDER" as demo-only data. */
export function detectPlaceholder(title: string): boolean {
  return title.toUpperCase().includes("PLACEHOLDER");
}
