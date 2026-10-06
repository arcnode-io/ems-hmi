import { estimateMessageRate } from "./messageBudget";
import type { MeasurementViewType, TopologyViewType } from "../topology/topology.schema";

const meas = (unit: string, hz: number): MeasurementViewType => ({
  unit, type: "float", poll_rate_hz: hz, display_name_default: null, iec_61850_ref: null, bounds: null, thresholds: null, values: null,
});

const VIEW: Pick<TopologyViewType, "devices" | "templates_used"> = {
  devices: {
    n1: { device_id: "n1", template: "node", parent: null, display_name: null, extra_measurements: null },
    n2: { device_id: "n2", template: "node", parent: null, display_name: null, extra_measurements: null },
  },
  templates_used: {
    node: {
      template: "node", kind: "leaf", equipment_id: null, vendor: null, model: null, description: "", commands: {},
      measurements: { p: meas("watts", 1), lim: meas("watts", 0.1), clock: meas("hertz", 1) },
    },
  },
};

describe("estimateMessageRate", () => {
  it("sums the publish rate of every topic the filters match, once per topic", () => {
    // Arrange — concrete p on n1 (1/s) + device-wildcard lim (2 × 0.1/s) + a duplicate of the concrete topic
    const filters = [
      "sites/s1/devices/n1/measurements/p/watts",
      "sites/s1/devices/+/measurements/lim/watts",
      "sites/s1/devices/+/measurements/p/watts",
    ];

    // Act
    const rate = estimateMessageRate(filters, VIEW, "s1");

    // Assert — p on n1 + n2 (2/s, n1 counted once) + lim on both (0.2/s)
    expect(rate).toBeCloseTo(2.2);
  });
});
