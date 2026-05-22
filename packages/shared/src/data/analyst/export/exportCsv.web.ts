/** Web CSV export — triggers a file download via a Blob + anchor click. */

import type { AnalystArtifact } from "../types";
import { artifactToCsv } from "./artifactCsv";

export function exportCsv(artifact: AnalystArtifact): void {
  const out = artifactToCsv(artifact);
  if (!out) return;
  const blob = new Blob([out.csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = out.filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
