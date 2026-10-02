import { gpuFleetFrom, gpuNodeTopics } from "./useGpuFleet";
import type { MeasurementViewType, TopologyViewType } from "../topology/topology.schema";

function meas(unit: string, type: MeasurementViewType["type"]): MeasurementViewType {
  return { unit, type, poll_rate_hz: 1, display_name_default: null, iec_61850_ref: null, bounds: null, thresholds: null, values: null };
}

function device(deviceId: string, template: string): TopologyViewType["devices"][string] {
  return { device_id: deviceId, template, parent: null, display_name: null, extra_measurements: null };
}

describe("gpuFleetFrom", () => {
  it("sums node draw, averages per-GPU power, and counts throttling GPUs", () => {
    // Arrange — 2 nodes × 2 GPUs; node b has one GPU on SW_POWER_CAP
    const nodes = [
      { deviceId: "a", nodePowerW: 10_000, gpuPowerW: 8_000, throttleReasons: ["NA", "NA"] },
      { deviceId: "b", nodePowerW: 11_000, gpuPowerW: 8_400, throttleReasons: ["NA", "SW_POWER_CAP"] },
    ];

    // Act
    const fleet = gpuFleetFrom(nodes);

    // Assert
    expect(fleet).toEqual({
      nodes: [
        { deviceId: "a", throttling: 0, nodePowerW: 10_000 },
        { deviceId: "b", throttling: 1, nodePowerW: 11_000 },
      ],
      gpuCount: 4,
      throttlingCount: 1,
      totalDrawW: 21_000,
      perGpuW: 4_100,
    });
  });

  it("reads not-yet-reported values as null, never as zero or throttling", () => {
    // Arrange
    const nodes = [{ deviceId: "a", nodePowerW: null, gpuPowerW: null, throttleReasons: [null, null] }];

    // Act
    const fleet = gpuFleetFrom(nodes);

    // Assert
    expect([fleet.totalDrawW, fleet.perGpuW, fleet.throttlingCount, fleet.gpuCount]).toEqual([null, null, 0, 2]);
  });
});

describe("gpuNodeTopics", () => {
  it("builds per-node topics for every gpu_node, with one throttle topic per template GPU", () => {
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
        gpuPower: `${prefix}/gpu_power_watts/watts`,
        throttle: [`${prefix}/gpu_1_throttle_reason/none`, `${prefix}/gpu_2_throttle_reason/none`],
      },
    ]);
  });
});
