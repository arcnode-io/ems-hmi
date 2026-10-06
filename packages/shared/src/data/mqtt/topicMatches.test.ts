import { assertSubscribable, topicMatches } from "./topicMatches";

describe("topicMatches", () => {
  it("matches MQTT + (one level) and # (rest) wildcards", () => {
    // Arrange
    const topic = "sites/s1/devices/gpu_node_01/measurements/gpu_1_power/watts";
    const cases: [string, boolean][] = [
      ["sites/s1/devices/gpu_node_01/measurements/#", true],
      ["sites/s1/devices/+/measurements/#", true],
      ["sites/s1/devices/gpu_node_01/measurements/+/watts", true],
      [topic, true],
      ["sites/s1/devices/gpu_node_02/measurements/#", false],
      ["sites/s1/devices/+/measurements/+", false],
      ["sites/s1/devices/gpu_node_01/measurements/gpu_1_power/watts/extra", false],
    ];

    // Act
    const results = cases.map(([filter]) => topicMatches(filter, topic));

    // Assert
    expect(results).toEqual(cases.map(([, expected]) => expected));
  });

  it("lets # also match the parent level, per the MQTT spec", () => {
    // Arrange / Act
    const matched = topicMatches("sites/s1/#", "sites/s1");

    // Assert
    expect(matched).toBe(true);
  });
});

describe("assertSubscribable", () => {
  it("allows concrete topics and a device-level + on a fully named measurement", () => {
    // Arrange
    const ok = [
      "sites/s1/devices/meter_01/measurements/active_power/watts",
      "sites/s1/devices/+/measurements/power_consumed/watts",
      "sites/s1/devices/bess_module_01/events/dispatch_state",
    ];

    // Act / Assert
    expect(() => ok.forEach(assertSubscribable)).not.toThrow();
  });

  it("rejects site-wide # and any + outside the device position — the browser never subscribes to everything", () => {
    // Arrange
    const broad = [
      "sites/s1/devices/+/measurements/#",
      "sites/s1/#",
      "sites/+/devices/meter_01/measurements/active_power/watts",
      "sites/s1/devices/+/measurements/+/watts",
      "sites/s1/devices/+/measurements/power_consumed/+",
    ];

    // Act
    const rejected = broad.filter((filter) => {
      try {
        assertSubscribable(filter);
        return false;
      } catch {
        return true;
      }
    });

    // Assert
    expect(rejected).toEqual(broad);
  });
});
