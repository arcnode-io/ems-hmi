import { topicMatches } from "./topicMatches";

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
