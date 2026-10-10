/**
 * Curtailment banner text: the envelope import limit (CSIP-AUS opModImpLimW —
 * the utility's actual ask) next to what the POI meter reads. Never claims
 * compliance: part of the site load can't be capped, so the two can disagree.
 */

import { match } from "ts-pattern";
import type { CurtailmentPhase } from "../../../../data/grid/curtailmentPhase";
import type { CurtailmentProgram } from "../../../../data/grid/useGridState";

const DASH = "—";

function fmtPower(watts: number): string {
  const abs = Math.abs(watts);
  if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(2)} MW`;
  if (abs >= 1000) return `${(abs / 1000).toFixed(0)} kW`;
  return `${abs.toFixed(0)} W`;
}

/** @example curtailmentLine(0, 1_120_000) // "Utility limit: 0 W import · site importing 1.12 MW" */
export function curtailmentLine(importLimitW: number | null, netW: number | null): string {
  const limit = importLimitW === null ? DASH : `${fmtPower(importLimitW)} import`;
  const site =
    netW === null ? DASH : `${netW < 0 ? "exporting" : "importing"} ${fmtPower(netW)}`;
  return `Utility limit: ${limit} · site ${site}`;
}

/** Banner title for any constrained phase (null phase = no banner, never asked). */
export function bannerTitle(phase: Exclude<CurtailmentPhase, null>, program: CurtailmentProgram | null): string {
  return match(phase)
    .with("curtailment", () => curtailmentTitle(program))
    .with("gridLimit", () => "Grid limit reached")
    .with("curtailmentReleasing", () => "Curtailment ended · GPU caps releasing")
    .with("gridLimitReleasing", () => "Grid limit cleared · GPU caps releasing")
    .with("gpusThrottled", () => "GPUs throttled · cause not reported")
    .exhaustive();
}

/** Banner title: which DERProgram the curtailment came through, when known. */
export function curtailmentTitle(program: CurtailmentProgram | null): string {
  return `Curtailment active${programSuffix(program)}`;
}

/** " · <program>" for a known program, "" otherwise. Shared by the banner and event history. */
export function programSuffix(program: CurtailmentProgram | null): string {
  // Reason: label the program, not the physics — the site only ever sees a
  // limit from a program; it can't know a dynamic line rating is behind it.
  return match(program)
    .with("ERCOT_FLEX", () => " · ERCOT flex call")
    .with("DLR_LINE_CONSTRAINT", () => " · Line constraint")
    .with("NONE", null, () => "")
    .exhaustive();
}
