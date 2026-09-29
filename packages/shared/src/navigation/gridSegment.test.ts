import { gridSegment, type GridSegmentInput } from "./gridSegment";

const BASE: GridSegmentInput = {
  mode: "GRID",
  direction: "IMP",
  curtailed: false,
  importHeadroomW: 1_250_000,
  exportHeadroomW: 400_000,
  netPowerKw: 180,
  netLabel: "Import",
  frequencyHz: 60.01,
};

describe("gridSegment", () => {
  it("shows import headroom while importing", () => {
    // Arrange + Act
    const seg = gridSegment(BASE);

    // Assert
    expect(seg).toEqual({ value: "+1.3 MW", sub: "Import headroom" });
  });

  it("keeps the headroom visible during curtailment, flagged in the sub", () => {
    // Arrange + Act
    const seg = gridSegment({ ...BASE, curtailed: true, importHeadroomW: 90_000 });

    // Assert
    expect(seg).toEqual({ value: "+90 kW", sub: "Curtailed · Import headroom" });
  });

  it("defaults to import headroom when flow direction is unknown", () => {
    // Arrange + Act — no grid_module in the DTM → no direction
    const seg = gridSegment({ ...BASE, direction: null, importHeadroomW: 524_800 });

    // Assert
    expect(seg).toEqual({ value: "+525 kW", sub: "Import headroom" });
  });

  it("ISLAND wins over everything", () => {
    // Arrange + Act
    const seg = gridSegment({ ...BASE, mode: "ISLAND", curtailed: true });

    // Assert
    expect(seg).toEqual({ value: "ISLAND", sub: "no utility coordination" });
  });

  it("falls back to CURTAILED, then net power, when there's no headroom yet", () => {
    // Arrange
    const noEnvelope = { ...BASE, importHeadroomW: null, exportHeadroomW: null };

    // Act
    const segs = [gridSegment({ ...noEnvelope, curtailed: true }), gridSegment(noEnvelope)];

    // Assert
    expect(segs).toEqual([
      { value: "CURTAILED", sub: "Utility event active" },
      { value: "+180 kW", sub: "60.01 Hz" },
    ]);
  });
});
