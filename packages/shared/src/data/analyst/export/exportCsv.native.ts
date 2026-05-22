/**
 * Native CSV export — hands the CSV text to the OS Share sheet. Sharing the
 * text directly avoids a filesystem dependency; a true file export can swap
 * in expo-file-system later if needed.
 */

import { Share } from "react-native";
import type { AnalystArtifact } from "../types";
import { artifactToCsv } from "./artifactCsv";

export function exportCsv(artifact: AnalystArtifact): void {
  const out = artifactToCsv(artifact);
  if (!out) return;
  void Share.share({ title: out.filename, message: out.csv });
}
