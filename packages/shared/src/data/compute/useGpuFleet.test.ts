import { gpuFleetFilter, gpuFleetFrom, gpuNodeTopics } from "./useGpuFleet";
import type { MeasurementViewType, TopologyViewType } from "../topology/topology.schema";

function meas(unit: string, type: MeasurementViewType["type"]): MeasurementViewType {
  return { unit, type, poll_rate_hz: 1, display_name_default: null, iec_61850_ref: null, bounds: null, thresholds: null, values: null };
}

function device(deviceId: string, template: string): TopologyViewType["devices"][string] {
  return { device_id: deviceId, template, parent: null, display_name: null, extra_measurements: null };
}

describe("gpuFleetFrom", () => {
  it("sums node draw, averages per-GPU power, and counts throttling GPUs", () => {
    // Arrange — 2 nodes × 2 GPUs; node b has one GPU on SW_POWER_CAP and one cap not yet reported
    const nodes = [
      { deviceId: "a", nodePowerW: 10_000, nodeLimitW: 26_400, gpuPowerW: 8_000, gpuLimitsW: [4_000, 4_000], throttleReasons: ["NA", "NA"] },
      { deviceId: "b", nodePowerW: 11_000, nodeLimitW: null, gpuPowerW: 8_400, gpuLimitsW: [5_000, null], throttleReasons: ["NA", "SW_POWER_CAP"] },
    ];

    // Act
    const fleet = gpuFleetFrom(nodes);

    // Assert
    expect(fleet).toEqual({
      nodes: [
        { deviceId: "a", throttling: 0, nodePowerW: 10_000, nodeLimitW: 26_400, gpuPowerW: 8_000, gpuCapW: 4_000 },
        { deviceId: "b", throttling: 1, nodePowerW: 11_000, nodeLimitW: null, gpuPowerW: 8_400, gpuCapW: null },
      ],
      gpuCount: 4,
      throttlingCount: 1,
      totalDrawW: 21_000,
      perGpuW: 4_100,
    });
  });

  it("reads not-yet-reported values as null, never as zero or throttling", () => {
    // Arrange
    const nodes = [
      { deviceId: "a", nodePowerW: null, nodeLimitW: null, gpuPowerW: null, gpuLimitsW: [null, null], throttleReasons: [null, null] },
    ];

    // Act
    const fleet = gpuFleetFrom(nodes);

    // Assert
    expect([fleet.totalDrawW, fleet.perGpuW, fleet.throttlingCount, fleet.gpuCount]).toEqual([null, null, 0, 2]);
  });
});

describe("gpuNodeTopics", () => {
  it("builds the per-node topics to read out of the fleet subscription, per template GPU", () => {
    // Arrange — template with 2 GPUs; a pdu in the view must be ignored
    const view: Pick<TopologyViewType, "devices" | "templates_used"> = {
      devices: { gpu_node_01: device("gpu_node_01", "gpu_node"), pdu_01: device("pdu_01", "pdu") },
      templates_used: {
        gpu_node: {
          template: "gpu_node", kind: "leaf", equipment_id: null, vendor: null, model: null, description: "", commands: {},
          measurements: {
            power_consumed: meas("watts", "float"),
            gpu_power_watts: meas("watts", "float"),
            gpu_2_throttle_reason: meas("none", "enum"),
            gpu_1_throttle_reason: meas("none", "enum"),
            gpu_1_power: meas("watts", "float"),
            power_limit: meas("watts", "float"),
            gpu_2_power_limit: meas("watts", "float"),
            gpu_1_power_limit: meas("watts", "float"),
          },
        },
      },
    };
    const prefix = "sites/s1/devices/gpu_node_01/measurements";

    // Act
    const topics = gpuNodeTopics(view, "s1");

    // Assert
    expect(topics).toEqual([
      {
        deviceId: "gpu_node_01",
        nodePower: `${prefix}/power_consumed/watts`,
        nodeLimit: `${prefix}/power_limit/watts`,
        gpuPower: `${prefix}/gpu_power_watts/watts`,
        throttle: [`${prefix}/gpu_1_throttle_reason/none`, `${prefix}/gpu_2_throttle_reason/none`],
        gpuLimits: [`${prefix}/gpu_1_power_limit/watts`, `${prefix}/gpu_2_power_limit/watts`],
      },
    ]);
  });
});

describe("gpuFleetFilter", () => {
  it("is one site-wide wildcard, so dispatch matches each message once, not per node", () => {
    // Arrange / Act
    const filter = gpuFleetFilter("s1");

    // Assert
    expect(filter).toBe("sites/s1/devices/+/measurements/#");
  });
});

describe("gpuFleetFrom cold start", () => {
  it("keeps total draw unknown until every node has reported, so a partial sum never reads as a ramp", () => {
    // Arrange — 2 nodes, only one reported yet
    const base = { nodeLimitW: null, gpuPowerW: null, gpuLimitsW: [], throttleReasons: [] };
    const nodes = [
      { ...base, deviceId: "a", nodePowerW: 10_000 },
      { ...base, deviceId: "b", nodePowerW: null },
    ];

    // Act
    const partial = gpuFleetFrom(nodes).totalDrawW;
    const full = gpuFleetFrom([nodes[0]!, { ...base, deviceId: "b", nodePowerW: 11_000 }]).totalDrawW;

    // Assert
    expect([partial, full]).toEqual([null, 21_000]);
  });
});
