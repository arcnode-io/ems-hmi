/**
 * Tests for topicBuilder. AAA pattern.
 */

import {
  measurementTopic,
  commandTopic,
  systemTopic,
  parseMeasurementTopic,
} from "./topicBuilder";

describe("measurementTopic", () => {
  it("builds the canonical 7-slot topic", () => {
    const actual = measurementTopic(
      "arc01",
      "bess_rack_1",
      "state_of_charge",
      "percent",
    );
    expect(actual).toBe(
      "sites/arc01/devices/bess_rack_1/measurements/state_of_charge/percent",
    );
  });

  it("passes 'none' literally for unitless measurements", () => {
    const actual = measurementTopic("arc01", "bess_rack_1", "operating_state", "none");
    expect(actual.endsWith("/none")).toBe(true);
  });
});

describe("commandTopic", () => {
  it("builds the canonical 7-slot command topic", () => {
    const actual = commandTopic(
      "arc01",
      "bess_rack_1",
      "set",
      "active_power",
      "watts",
    );
    expect(actual).toBe(
      "sites/arc01/devices/bess_rack_1/commands/set/active_power/watts",
    );
  });
});

describe("systemTopic", () => {
  it("builds the 2-slot system topic", () => {
    expect(systemTopic("topology_changed")).toBe("system/topology_changed");
  });
});

describe("parseMeasurementTopic", () => {
  it("round-trips with measurementTopic", () => {
    const built = measurementTopic("arc01", "bess_rack_1", "state_of_charge", "percent");
    const parsed = parseMeasurementTopic(built);
    expect(parsed).toEqual({
      siteId: "arc01",
      deviceId: "bess_rack_1",
      measurement: "state_of_charge",
      unit: "percent",
    });
  });

  it("returns null on shape mismatch (wrong segment count)", () => {
    expect(parseMeasurementTopic("sites/a/devices/b")).toBeNull();
  });

  it("returns null on wrong family slot", () => {
    expect(
      parseMeasurementTopic("sites/a/devices/b/commands/c/d/e"),
    ).toBeNull();
  });
});
