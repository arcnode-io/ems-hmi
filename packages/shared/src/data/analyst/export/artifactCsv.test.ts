/** Tests for artifactToCsv. AAA pattern. */

import { artifactToCsv } from "./artifactCsv";
import type { AnalystArtifact } from "../types";

const TS = "2026-05-22T14:00:00Z";

describe("artifactToCsv", () => {
  it("flattens a line artifact to x + per-series columns", () => {
    // Arrange
    const artifact: AnalystArtifact = {
      kind: "line",
      spec: {
        title: "DAM price",
        xAxis: { label: "Time", kind: "time" },
        yAxis: { label: "price", unit: "usd" },
        series: [
          { label: "market_01", points: [{ x: 0, y: 21 }, { x: 1, y: 22 }] },
        ],
        dataAsOf: TS,
      },
    };

    // Act
    const out = artifactToCsv(artifact);

    // Assert
    expect(out?.filename).toBe("dam_price.csv");
    expect(out?.csv).toBe("x,market_01\n0,21\n1,22");
  });

  it("flattens a table artifact by column key", () => {
    // Arrange
    const artifact: AnalystArtifact = {
      kind: "table",
      spec: {
        title: "Alarms",
        columns: [
          { key: "time", label: "Time" },
          { key: "device", label: "Device" },
        ],
        rows: [{ time: "07:42", device: "BESS-02" }],
        dataAsOf: TS,
      },
    };

    // Act
    const out = artifactToCsv(artifact);

    // Assert
    expect(out?.csv).toBe("Time,Device\n07:42,BESS-02");
  });

  it("quotes cells containing commas", () => {
    // Arrange
    const artifact: AnalystArtifact = {
      kind: "pie",
      spec: {
        title: "Mix",
        unit: "kW",
        slices: [{ label: "PV, solar", value: 5 }],
        dataAsOf: TS,
      },
    };

    // Act + Assert
    expect(artifactToCsv(artifact)?.csv).toBe('label,value\n"PV, solar",5');
  });

  it("returns null for an error artifact", () => {
    // Arrange
    const artifact: AnalystArtifact = {
      kind: "error",
      spec: { code: "unknown", message: "boom", dataAsOf: TS },
    };

    // Act + Assert
    expect(artifactToCsv(artifact)).toBeNull();
  });
});
