import { buildTickerPlan } from "./tickers";
import type { TopologyViewType } from "../topology/topology.schema";

function meas(type: "float" | "bool" | "enum", bounds: { min: number; max: number; nominal: number } | null): object {
  return { unit: "watts", type, poll_rate_hz: 1, display_name_default: null, iec_61850_ref: null, bounds, thresholds: null, values: type === "enum" ? { "0": "NA" } : null };
}

describe("buildTickerPlan", () => {
  it("simulates only floats the catalog rates — a reading with no basis stays unknown", () => {
    // Arrange
    const view = {
      devices: { relay_1: { device_id: "relay_1", template: "relay", parent: null, display_name: null, extra_measurements: null } },
      templates_used: {
        relay: {
          measurements: {
            rated: meas("float", { min: 0, max: 10, nominal: 5 }),
            unrated: meas("float", null),
            breaker_closed: meas("bool", null),
            trip_status: meas("enum", null),
          },
        },
      },
    } as unknown as TopologyViewType;

    // Act
    const topics = buildTickerPlan(view, "s").map((t) => [t.topic, t.current]);

    // Assert
    expect(topics).toEqual([["sites/s/devices/relay_1/measurements/rated/watts", 5]]);
  });
});
