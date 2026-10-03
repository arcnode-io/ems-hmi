/**
 * Curtailment banner text: the envelope import limit (CSIP-AUS opModImpLimW —
 * the utility's actual ask) next to what the POI meter reads. Never claims
 * compliance: part of the site load can't be capped, so the two can disagree.
 */

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
