/**
 * StrandedCapacity's Grid row — how much of the operating envelope's
 * import limit is in use at the POI. Constitution rules the pick follows:
 *   3.11 — ISLAND reads "n/a" (not "—") and never counts as GRID LIMITED.
 *   3.10 — a degraded source degrades the claim: non-OK envelope status
 *          drops the row out of the worst-constraint pick.
 */

import { isOverLimit, type OperatingEnvelope } from "../../../../data/grid/useOperatingEnvelope";

export interface GridHeadroomRow {
  /** Bar fill, [0..1]. */
  val: number;
  headline: string;
  /** Ratio for the worst-constraint pick; null = excluded. */
  forState: number | null;
}

function fmtPower(watts: number): string {
  const abs = Math.abs(watts);
  return abs >= 1_000_000 ? `${(abs / 1_000_000).toFixed(1)} MW` : `${(abs / 1000).toFixed(0)} kW`;
}

/**
 * @param envelope from useOperatingEnvelope
 * @param islanded site is in ISLAND mode
 * @returns bar value, headline text, and constraint ratio
 */
export function gridHeadroomRow(envelope: OperatingEnvelope, islanded: boolean): GridHeadroomRow {
  if (islanded) return { val: 0, headline: "ISLAND · n/a", forState: null };
  const { status, usedFraction, importHeadroomW } = envelope;
  // Reason: status is published on transitions only, so null means "no
  // fault known", not stale — only an explicit non-OK status degrades.
  const degraded = status !== null && status !== "ok";
  if (degraded || usedFraction === null || importHeadroomW === null) {
    return { val: 0, headline: "—", forState: null };
  }
  if (importHeadroomW < 0 && !isOverLimit(importHeadroomW)) {
    return { val: 1, headline: "At limit", forState: 1 };
  }
  if (importHeadroomW < 0) {
    return { val: 1, headline: `${fmtPower(importHeadroomW)} over limit`, forState: 1 };
  }
  return { val: usedFraction, headline: `${fmtPower(importHeadroomW)} import free`, forState: usedFraction };
}
