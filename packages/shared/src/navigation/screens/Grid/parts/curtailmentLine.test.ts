import { curtailmentLine } from "./curtailmentLine";

describe("curtailmentLine", () => {
  it("states the utility's import limit next to what the meter actually reads", () => {
    // Arrange — live event: envelope closed to 0 W, site importing 1.12 MW

    // Act
    const line = curtailmentLine(0, 1_120_000);

    // Assert
    expect(line).toBe("Utility limit: 0 W import · site importing 1.12 MW");
  });

  it("handles export, kW scale, and values not yet reported", () => {
    // Arrange / Act
    const lines = [
      curtailmentLine(250_000, -300_000),
      curtailmentLine(null, 40_000),
      curtailmentLine(0, null),
    ];

    // Assert
    expect(lines).toEqual([
      "Utility limit: 250 kW import · site exporting 300 kW",
      "Utility limit: — · site importing 40 kW",
      "Utility limit: 0 W import · site —",
    ]);
  });
});
