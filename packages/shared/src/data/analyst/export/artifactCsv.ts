/**
 * artifactToCsv — flatten an analyst artifact to CSV text. Pure; the
 * platform-split exportCsv handles delivery (web download / native share).
 * Error artifacts have no tabular data and yield null.
 */

import { match } from "ts-pattern";
import type { AnalystArtifact } from "../types";

export interface CsvExport {
  filename: string;
  csv: string;
}

/** Quote a CSV cell when it contains a comma, quote, or newline. */
function cell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Slugify a title into a safe filename stem. */
function slug(title: string): string {
  const s = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return s === "" ? "artifact" : s;
}

export function artifactToCsv(artifact: AnalystArtifact): CsvExport | null {
  return match(artifact)
    .with({ kind: "line" }, ({ spec }) => {
      const header = ["x", ...spec.series.map((s) => s.label)];
      const rowCount = Math.max(0, ...spec.series.map((s) => s.points.length));
      const rows = [header.map(cell).join(",")];
      for (let i = 0; i < rowCount; i++) {
        const x = spec.series[0]?.points[i]?.x ?? "";
        const cells = [x, ...spec.series.map((s) => s.points[i]?.y ?? "")];
        rows.push(cells.map(cell).join(","));
      }
      return { filename: `${slug(spec.title)}.csv`, csv: rows.join("\n") };
    })
    .with({ kind: "bar" }, ({ spec }) => {
      const header = [spec.xAxis.label, ...spec.series.map((s) => s.label)];
      const rows = [header.map(cell).join(",")];
      spec.xAxis.categories.forEach((category, i) => {
        const cells = [category, ...spec.series.map((s) => s.values[i] ?? "")];
        rows.push(cells.map(cell).join(","));
      });
      return { filename: `${slug(spec.title)}.csv`, csv: rows.join("\n") };
    })
    .with({ kind: "pie" }, ({ spec }) => {
      const rows = [
        "label,value",
        ...spec.slices.map((s) => [s.label, s.value].map(cell).join(",")),
      ];
      return { filename: `${slug(spec.title)}.csv`, csv: rows.join("\n") };
    })
    .with({ kind: "table" }, ({ spec }) => {
      const rows = [spec.columns.map((c) => cell(c.label)).join(",")];
      for (const row of spec.rows) {
        rows.push(spec.columns.map((c) => cell(row[c.key])).join(","));
      }
      return { filename: `${slug(spec.title)}.csv`, csv: rows.join("\n") };
    })
    .with({ kind: "error" }, () => null)
    .exhaustive();
}
