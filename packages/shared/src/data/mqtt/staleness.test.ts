import { staleAfterFor } from "./staleness";
import type { MeasurementViewType, TopologyViewType } from "../topology/topology.schema";

const meas = (unit: string, hz: number | null): MeasurementViewType => ({
  unit, type: "float", poll_rate_hz: hz, display_name_default: null, iec_61850_ref: null, bounds: null, thresholds: null, values: null,
});

const VIEW: Pick<TopologyViewType, "devices" | "templates_used"> = {
  devices: { cm1: { device_id: "cm1", template: "compute_module", parent: null, display_name: null, extra_measurements: null } },
  templates_used: {
    compute_module: {
      template: "compute_module", kind: "module", equipment_id: null, vendor: null, model: null, description: "", commands: {},
      measurements: { total_power: meas("watts", 1), pue: meas("none", 0.1), label: meas("none", null) },
    },
  },
};

describe("staleAfterFor", () => {
  it("allows 3 missed publishes at the template's poll rate", () => {
    // Arrange
    const staleAfter = staleAfterFor(VIEW);

    // Act
    const ages = [
      staleAfter("sites/s/devices/cm1/measurements/total_power/watts"),
      staleAfter("sites/s/devices/cm1/measurements/pue/none"),
    ];

    // Assert — 1 Hz → 3 s; 0.1 Hz → 30 s
    expect(ages).toEqual([3000, 30_000]);
  });

  it("never expires what it can't place or what has no poll rate", () => {
    // Arrange
    const staleAfter = staleAfterFor(VIEW);

    // Act
    const ages = [
      staleAfter("sites/s/devices/cm1/measurements/label/none"),
      staleAfter("sites/s/devices/ghost/measurements/total_power/watts"),
      staleAfter("not/a/measurement/topic"),
    ];

    // Assert
    expect(ages).toEqual([null, null, null]);
  });
});
