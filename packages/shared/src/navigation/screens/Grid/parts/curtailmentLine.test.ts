import { bannerTitle, curtailmentLine, curtailmentTitle } from "./curtailmentLine";

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

describe("curtailmentTitle", () => {
  it("names the program the curtailment came through", () => {
    // Arrange / Act
    const titles = [curtailmentTitle("ERCOT_FLEX"), curtailmentTitle("DLR_LINE_CONSTRAINT")];

    // Assert
    expect(titles).toEqual(["Curtailment active · ERCOT flex call", "Curtailment active · Line constraint"]);
  });

  it("falls back to the bare title when no program is known yet", () => {
    // Arrange / Act
    const titles = [curtailmentTitle(null), curtailmentTitle("NONE")];

    // Assert
    expect(titles).toEqual(["Curtailment active", "Curtailment active"]);
  });
});

describe("bannerTitle", () => {
  it("gives every phase a title that says why things are yellow", () => {
    // Arrange / Act
    const titles = [
      bannerTitle("curtailment", "ERCOT_FLEX"),
      bannerTitle("gridLimit", null),
      bannerTitle("curtailmentReleasing", "NONE"),
      bannerTitle("gridLimitReleasing", null),
      bannerTitle("gpusThrottled", null),
    ];

    // Assert
    expect(titles).toEqual([
      "Curtailment active · ERCOT flex call",
      "Grid limit reached",
      "Curtailment ended · GPU caps releasing",
      "Grid limit cleared · GPU caps releasing",
      "GPUs throttled · cause not reported",
    ]);
  });
});
