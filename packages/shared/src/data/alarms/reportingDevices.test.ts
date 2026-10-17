import { reportingDevices } from "./reportingDevices";
import type { TopologyViewType } from "../topology/topology.schema";
import type { MqttMessage } from "../mqtt/MqttClient";

function measurement(unit: string): TopologyViewType["templates_used"][string]["measurements"][string] {
  return { unit, type: "float", poll_rate_hz: 1, display_name_default: null, iec_61850_ref: null, bounds: null, thresholds: null, values: null };
}

// Reason: only devices + templates_used matter here; the rest of the view is noise.
const VIEW = {
  devices: {
    relay_1: { device_id: "relay_1", template: "relay", parent: null, display_name: null, extra_measurements: null },
    relay_2: { device_id: "relay_2", template: "relay", parent: null, display_name: null, extra_measurements: null },
  },
  templates_used: {
    relay: { measurements: { phase_voltage_a: measurement("volts"), trip_status: measurement("none") } },
  },
} as unknown as TopologyViewType;

const MSG: MqttMessage<unknown> = { ts: "2026-10-17T00:00:00Z", value: false };

describe("reportingDevices", () => {
  it("lists the devices with any current reading among those asked for", () => {
    // Arrange
    const messages = { "sites/s/devices/relay_1/measurements/trip_status/none": MSG };

    // Act
    const { topics, reporting } = reportingDevices(VIEW, "s", ["relay_1", "relay_2"], messages);

    // Assert
    expect([topics.length, [...reporting]]).toEqual([4, ["relay_1"]]);
  });
});
