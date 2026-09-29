/**
 * useReserveFloor — reserve-floor config for the BESS detail panel.
 * ride_through_hours from Dtm.sizing_params (engineering-set, not telemetry);
 * pack + floor + pct from the view's `bess` block, which device-api derives
 * from summed rack capacity — the same derivation the gateway enforces.
 * Not from sizing_params.E_BESS_total_kWh: that's a sizing input and can
 * disagree with the racks a DTM actually instantiates.
 */

import { useTopologyView } from "../topology/useTopologyView";
import type { TopologyViewType } from "../topology/topology.schema";

export interface ReserveFloor {
  hours: number | null;
  floorMwh: number | null;
  /** floorMwh as a percent of installed rack capacity, [0..100]. */
  pct: number | null;
  /** Installed rack capacity, MWh — for context next to the floor. */
  packMwh: number | null;
}

/**
 * Pure projection of a topology view onto the reserve-floor shape.
 * @param view topology view, or null while loading
 * @returns ReserveFloor — pack/floor/pct null when the site has no racks
 */
export function reserveFloorFromView(view: TopologyViewType | null): ReserveFloor {
  if (!view) return { hours: null, floorMwh: null, pct: null, packMwh: null };
  const { bess } = view;
  return {
    hours: view.sizing_params.ride_through_hours,
    floorMwh: bess?.reserve_floor_mwh ?? null,
    pct: bess?.reserve_floor_pct ?? null,
    packMwh: bess?.pack_mwh ?? null,
  };
}

/**
 * Read the site's reserve-floor config from the topology view.
 * @returns ReserveFloor — null fields while topology is loading
 */
export function useReserveFloor(): ReserveFloor {
  const { view } = useTopologyView();
  return reserveFloorFromView(view);
}
