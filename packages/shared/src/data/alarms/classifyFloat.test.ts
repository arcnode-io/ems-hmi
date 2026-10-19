import { classifyFloat } from "./classifyFloat";

const LIMITS = { warn_min: 394, warn_max: 436, alarm_min: 381, alarm_max: 439 };

describe("classifyFloat", () => {
  it("names the limit each reading broke, alarm before warn", () => {
    // Arrange
    const readings = [240, 390, 415, 437, 450];

    // Act
    const actual = readings.map((value) => classifyFloat(value, LIMITS));

    // Assert
    expect(actual).toEqual([
      { severity: "alarm", limit: { side: "min", value: 381 } },
      { severity: "warn", limit: { side: "min", value: 394 } },
      null,
      { severity: "warn", limit: { side: "max", value: 436 } },
      { severity: "alarm", limit: { side: "max", value: 439 } },
    ]);
  });
});
