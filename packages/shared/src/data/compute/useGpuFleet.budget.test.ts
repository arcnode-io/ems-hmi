/**
 * Subscription budget for the GPU fleet at real site scale. A site-wide `#`
 * on ems.arcnode.io pulled ~3.5k msgs/s and pinned 76% of the browser's main
 * thread (2026-10-06); this keeps the fleet to the measurements it reads.
 * Rates mirror edp-api's gpu_node template (37 measurements, 27.9 Hz/node).
 */

import { gpuFleetFilters } from "./useGpuFleet";
import { estimateMessageRate } from "../mqtt/messageBudget";
import type { MeasurementViewType, TopologyViewType } from "../topology/topology.schema";

const NODES = 98;
const GPUS = 8;
// ~10.9 Hz/node × 98 for what the fold reads; the whole template is 27.9 Hz/node.
const FLEET_BUDGET_MSGS_PER_S = 1100;

const meas = (unit: string, hz: number): MeasurementViewType => ({
  unit, type: "float", poll_rate_hz: hz, display_name_default: null, iec_61850_ref: null, bounds: null, thresholds: null, values: null,
});

function realGpuNodeTemplate(): Record<string, MeasurementViewType> {
  const measurements: Record<string, MeasurementViewType> = {
    power_consumed: meas("watts", 1),
    power_limit: meas("watts", 0.1),
    inlet_temp: meas("celsius", 0.5),
    fan_speed: meas("percent", 0.5),
    gpu_power_watts: meas("watts", 1),
  };
  for (let gpu = 1; gpu <= GPUS; gpu += 1) {
    measurements[`gpu_${gpu}_power`] = meas("watts", 1);
    measurements[`gpu_${gpu}_power_limit`] = meas("watts", 0.1);
    measurements[`gpu_${gpu}_clock`] = meas("hertz", 1);
    measurements[`gpu_${gpu}_throttle_reason`] = { ...meas("none", 1), type: "enum" };
  }
  return measurements;
}

function siteOf98Nodes(): Pick<TopologyViewType, "devices" | "templates_used"> {
  const devices: TopologyViewType["devices"] = {};
  for (let node = 1; node <= NODES; node += 1) {
    devices[`gpu_node_${node}`] = { device_id: `gpu_node_${node}`, template: "gpu_node", parent: null, display_name: null, extra_measurements: null };
  }
  return {
    devices,
    templates_used: {
      gpu_node: { template: "gpu_node", kind: "leaf", equipment_id: null, vendor: null, model: null, description: "", commands: {}, measurements: realGpuNodeTemplate() },
    },
  };
}

describe("GPU fleet subscription budget (98 nodes, real rates)", () => {
  it(`stays under ${FLEET_BUDGET_MSGS_PER_S} msgs/s — the fold's ~19 names, not the whole site`, () => {
    // Arrange
    const view = siteOf98Nodes();
    const everything = estimateMessageRate(["sites/s1/devices/+/measurements/#"], view, "s1");

    // Act
    const fleet = estimateMessageRate(gpuFleetFilters(view, "s1"), view, "s1");

    // Assert
    expect({ underBudget: fleet <= FLEET_BUDGET_MSGS_PER_S, fleet: Math.round(fleet), everything: Math.round(everything) }).toEqual({
      underBudget: true,
      fleet: 1068,
      everything: 2734,
    });
  });
});
