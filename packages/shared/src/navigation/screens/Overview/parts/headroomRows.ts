/**
 * StrandedCapacity's Power / Runway rows — pure, from live data.
 * Same shape as gridHeadroomRow: bar fill, text, and the ratio fed to the
 * worst-constraint pick (null = excluded).
 */

import type { TopologyViewType } from "../../../../data/topology/topology.schema";

export interface HeadroomRow {
  /** Bar fill, [0..1]. */
  val: number;
  headline: string;
  /** Ratio for the worst-constraint pick; null = excluded. */
  forState: number | null;
}

const DASH: HeadroomRow = { val: 0, headline: "—", forState: null };
// Reason: same deadband as the BESS tile — idle-dither isn't a discharge.
const DISCHARGE_DEADBAND_W = 1000;

const clamp01 = (val: number): number => Math.min(1, Math.max(0, val));

/** Fleet draw vs design compute capacity (sizing P_compute_total_kW). */
export function powerRow(drawW: number | null, capacityKw: number): HeadroomRow {
  if (drawW === null || capacityKw <= 0) return DASH;
  const drawKw = drawW / 1000;
  const used = clamp01(drawKw / capacityKw);
  return {
    val: used,
    headline: `${drawKw.toFixed(0)} / ${capacityKw.toFixed(0)} kW`,
    forState: used,
  };
}

/**
 * Hours left above the reserve floor at the current discharge rate. Bar =
 * share of usable (above-floor) energy already spent. Only a live
 * constraint while discharging.
 */
export function runwayRow(
  bess: TopologyViewType["bess"],
  socPct: number | null,
  bessPowerW: number | null,
): HeadroomRow {
  if (bess === null || socPct === null) return DASH;
  const usableMwh = bess.pack_mwh - bess.reserve_floor_mwh;
  if (usableMwh <= 0) return DASH;
  const aboveFloorMwh = Math.max(0, (socPct / 100) * bess.pack_mwh - bess.reserve_floor_mwh);
  const spent = clamp01(1 - aboveFloorMwh / usableMwh);
  // Reason: at the floor the gateway stops discharge — that's the binding
  // constraint, not "idle", whatever the current power reads.
  if (aboveFloorMwh <= 0) return { val: 1, headline: "At reserve floor", forState: 1 };
  if (bessPowerW === null || bessPowerW <= DISCHARGE_DEADBAND_W) {
    return { val: spent, headline: "Idle", forState: null };
  }
  const hours = (aboveFloorMwh * 1_000_000) / bessPowerW;
  return { val: spent, headline: `${hours.toFixed(1)} h`, forState: spent };
}

export type Limit = "POWER LIMITED" | "RUNWAY LIMITED" | "GRID LIMITED";
export type CapacityState = "BALANCED" | Limit;

export interface Constraint {
  limit: Limit;
  label: string;
  /** null = excluded from the pick (no data, idle, islanded, degraded). */
  ratio: number | null;
}

const LIMITED_AT = 0.85; // below 85% = BALANCED

/** Panel badge + footer from the closest live constraint. */
export function constraintSummary(
  constraints: readonly Constraint[],
): { state: CapacityState; footer: string } {
  const live = constraints.filter((con): con is Constraint & { ratio: number } => con.ratio !== null);
  if (live.length === 0) return { state: "BALANCED", footer: "Waiting on live data." };
  const top = live.reduce((best, con) => (con.ratio > best.ratio ? con : best));
  return {
    state: top.ratio >= LIMITED_AT ? top.limit : "BALANCED",
    footer: `${top.label} is the closest constraint (${Math.round(top.ratio * 100)}% used).`,
  };
}
