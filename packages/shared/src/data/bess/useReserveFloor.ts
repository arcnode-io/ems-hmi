/**
 * useReserveFloor — reserve-floor config from Dtm.sizing_params
 * (ride_through_hours, bess_reserve_floor_mwh — engineering-set at order/
 * preview time, not telemetry; power-engineer landed these 2026-09-14).
 * pct and pack MWh are HMI-side derived, per power-engineer: no separate
 * fields for those two.
 */

import { useTopologyView } from "../topology/useTopologyView";

export interface ReserveFloor {
  hours: number | null;
  floorMwh: number | null;
  /** floorMwh as a fraction of the site's total BESS capacity, [0..100]. */
  pct: number | null;
  /** Total BESS pack capacity, MWh — for context next to the floor. */
  packMwh: number | null;
}

/**
 * Read the site's reserve-floor config from topology sizing_params.
 * @returns ReserveFloor — null fields while topology is loading
 */
export function useReserveFloor(): ReserveFloor {
  const { view } = useTopologyView();
  if (!view) return { hours: null, floorMwh: null, pct: null, packMwh: null };

  const { ride_through_hours, bess_reserve_floor_mwh, E_BESS_total_kWh } = view.sizing_params;
  const packMwh = E_BESS_total_kWh / 1000;
  const pct = packMwh > 0 ? (bess_reserve_floor_mwh / packMwh) * 100 : null;

  return {
    hours: ride_through_hours,
    floorMwh: bess_reserve_floor_mwh,
    pct,
    packMwh,
  };
}
