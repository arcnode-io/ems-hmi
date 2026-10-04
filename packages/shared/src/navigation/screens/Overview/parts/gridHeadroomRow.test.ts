import { gridHeadroomRow } from "./gridHeadroomRow";
import type { OperatingEnvelope } from "../../../../data/grid/useOperatingEnvelope";

const LIVE: OperatingEnvelope = {
  status: "ok",
  importLimitW: 600_000,
  exportLimitW: 0,
  importHeadroomW: 150_000,
  exportHeadroomW: 450_000,
  usedFraction: 0.75,
};

describe("gridHeadroomRow", () => {
  it("shows import headroom left and counts toward the worst-constraint pick", () => {
    // Arrange + Act
    const row = gridHeadroomRow(LIVE, false);

    // Assert
    expect(row).toEqual({ val: 0.75, headline: "150 kW import free", forState: 0.75 });
  });

  it("reads n/a in ISLAND and drops out of the constraint pick (rule 3.11)", () => {
    // Arrange + Act
    const row = gridHeadroomRow(LIVE, true);

    // Assert
    expect(row).toEqual({ val: 0, headline: "ISLAND · n/a", forState: null });
  });

  it("drops out of the constraint pick when the envelope is stale (rule 3.10)", () => {
    // Arrange + Act
    const row = gridHeadroomRow({ ...LIVE, status: "stale" }, false);

    // Assert
    expect(row).toEqual({ val: 0, headline: "—", forState: null });
  });

  it("still shows headroom when limits arrive but no status has (transition-only topic)", () => {
    // Arrange + Act
    const row = gridHeadroomRow({ ...LIVE, status: null }, false);

    // Assert
    expect(row).toEqual({ val: 0.75, headline: "150 kW import free", forState: 0.75 });
  });

  it("shows a dash until the envelope first arrives", () => {
    // Arrange
    const empty: OperatingEnvelope = {
      status: null, importLimitW: null, exportLimitW: null,
      importHeadroomW: null, exportHeadroomW: null, usedFraction: null,
    };

    // Act
    const row = gridHeadroomRow(empty, false);

    // Assert
    expect(row).toEqual({ val: 0, headline: "—", forState: null });
  });

  it("shows an over-limit site as a full bar that counts as GRID LIMITED", () => {
    // Arrange + Act
    const row = gridHeadroomRow({ ...LIVE, importLimitW: 0, importHeadroomW: -1_120_000, usedFraction: 1 }, false);

    // Assert
    expect(row).toEqual({ val: 1, headline: "1.1 MW over limit", forState: 1 });
  });

  it("reads At limit (fully used) inside the jitter tolerance, not 0 kW over", () => {
    // Arrange — 0 W limit, POI at 13 W
    // Act
    const row = gridHeadroomRow({ ...LIVE, importLimitW: 0, importHeadroomW: -13, usedFraction: 1 }, false);

    // Assert
    expect(row).toEqual({ val: 1, headline: "At limit", forState: 1 });
  });
});
