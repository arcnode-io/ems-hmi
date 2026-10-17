/**
 * Setpoint range for a BESS dispatch: the per-device `bounds.active_power`
 * device-api derives (W, signed — the gateway's own clamp). None → null → no
 * dispatch offered: the HMI never invents a limit for a command with physical
 * consequences.
 */

import type { TopologyViewType } from "../topology/topology.schema";

export interface SetpointRange {
  minKw: number;
  maxKw: number;
}

/** @example setpointRangeKw(view, "bess_module_1") // { minKw: -3854, maxKw: 3854 } */
export function setpointRangeKw(view: TopologyViewType, deviceId: string): SetpointRange | null {
  const range = view.devices[deviceId]?.bounds?.active_power;
  return range ? { minKw: range.min / 1000, maxKw: range.max / 1000 } : null;
}
