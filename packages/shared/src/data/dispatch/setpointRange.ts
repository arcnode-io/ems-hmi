/**
 * Setpoint range for a BESS dispatch, from the catalog's rated active power
 * (`active_power.bounds`, W). No rating → null → no dispatch offered: the HMI
 * never invents a limit for a command with physical consequences.
 */

import type { TopologyViewType } from "../topology/topology.schema";

export interface SetpointRange {
  minKw: number;
  maxKw: number;
}

/** @example setpointRangeKw(view, "bess_module_1") // { minKw: -1900, maxKw: 1900 } */
export function setpointRangeKw(view: TopologyViewType, deviceId: string): SetpointRange | null {
  const device = view.devices[deviceId];
  const bounds = device ? view.templates_used[device.template]?.measurements.active_power?.bounds : null;
  return bounds ? { minKw: bounds.min / 1000, maxKw: bounds.max / 1000 } : null;
}
