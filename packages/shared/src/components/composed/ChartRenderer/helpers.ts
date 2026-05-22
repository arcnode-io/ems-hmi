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

/** ISO-8601 date-time at the start of a string (the form the server emits). */
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/**
 * Render a table cell. ISO timestamps collapse to a readable
 * `YYYY-MM-DD HH:MM` (local time); everything else stringifies as-is.
 */
export function formatTableCell(
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string" && ISO_DATETIME.test(value)) {
    const ms = Date.parse(value);
    if (Number.isFinite(ms)) {
      const d = new Date(ms);
      const pad = (n: number): string => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
  }
  return String(value);
}
