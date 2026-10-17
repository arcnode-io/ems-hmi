import { buildTickerPlan, nextFloatValue } from "./tickers";
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

describe("nextFloatValue", () => {
  it("steps in proportion to the band it may wander, not the meter's full scale — 60 Hz stays near 60", () => {
    // Arrange — grid frequency: 55–65 Hz full scale, 59.5–60.5 warn band; worst-case noise
    const ticker = {
      topic: "f", intervalMs: 1000, nextDueAt: 0,
      bounds: { min: 55, max: 65, nominal: 60 }, safeMin: 59.5, safeMax: 60.5, current: 60,
    };
    jest.spyOn(Math, "random").mockReturnValue(1);

    // Act
    const next = nextFloatValue(ticker);

    // Assert — at most STEP_FRACTION (2%) of the 1 Hz band
    expect(next).toBeCloseTo(60.02, 5);
  });
});
