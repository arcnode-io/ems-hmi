import { constraintSummary, powerRow, runwayRow } from "./headroomRows";

describe("powerRow", () => {
  it("reads fleet draw against the design compute capacity", () => {
    // Arrange — live demo: 1.029 MW against P_compute_total_kW 1120

    // Act
    const row = powerRow(1_029_000, 1120);

    // Assert
    expect(row).toEqual({ val: 1_029 / 1_120, headline: "1029 / 1120 kW", forState: 1_029 / 1_120 });
  });

  it("drops out of the pick until the fleet reports", () => {
    // Arrange / Act
    const row = powerRow(null, 1120);

    // Assert
    expect(row).toEqual({ val: 0, headline: "—", forState: null });
  });
});

describe("runwayRow", () => {
  const BESS = { pack_mwh: 8, reserve_floor_mwh: 2, reserve_floor_pct: 25 };

  it("divides usable energy above the floor by the discharge rate", () => {
    // Arrange — 50% of 8 MWh = 4 MWh, 2 above the floor, discharging 1 MW → 2 h; 2 of 6 usable MWh left
    // Act
    const row = runwayRow(BESS, 50, 1_000_000, 0);

    // Assert
    expect(row).toEqual({ val: 1 - 2 / 6, headline: "2.0 h", forState: 1 - 2 / 6 });
  });

  it("reads Idle with no runway claim when the battery isn't discharging", () => {
    // Arrange / Act
    const idle = runwayRow(BESS, 50, 0, 0);
    const charging = runwayRow(BESS, 50, -300_000, 0);

    // Assert
    expect([idle, charging.headline, charging.forState]).toEqual([
      { val: 1 - 2 / 6, headline: "Idle", forState: null },
      "Idle",
      null,
    ]);
  });

  it("reads At reserve floor as a full constraint once SoC is at or under the floor", () => {
    // Arrange — live: 29.35% of 8 MWh = 2.348 MWh, floor 2.358 → nothing usable left
    const live = { pack_mwh: 8, reserve_floor_mwh: 2.3579, reserve_floor_pct: 29.47 };

    // Act
    const rows = [runwayRow(live, 29.35, 0, 0), runwayRow(live, 29.35, 900_000, 0)];

    // Assert
    expect(rows).toEqual([
      { val: 1, headline: "At reserve floor", forState: 1 },
      { val: 1, headline: "At reserve floor", forState: 1 },
    ]);
  });

  it("measures against the operator reserve when it's above the supplier floor", () => {
    // Arrange — supplier floor 2 MWh, operator keeps back 3 MWh; 50% of 8 = 4 MWh → 1 MWh above, 5 usable
    // Act
    const row = runwayRow(BESS, 50, 1_000_000, 3);

    // Assert
    expect(row).toEqual({ val: 1 - 1 / 5, headline: "1.0 h", forState: 1 - 1 / 5 });
  });

  it("names the operator reserve as what's holding the battery when it binds", () => {
    // Arrange — backend's live check: 6 MWh reserve, SoC frozen at 54.15% (4.33 MWh)
    // Act
    const row = runwayRow(BESS, 54.15, 0, 6);

    // Assert
    expect(row).toEqual({ val: 1, headline: "At operator reserve", forState: 1 });
  });

  it("is a dash with no BESS sizing or SoC yet", () => {
    // Arrange / Act
    const rows = [runwayRow(null, 50, 1_000_000, 0), runwayRow(BESS, null, 1_000_000, 0)];

    // Assert
    expect(rows.map((row) => row.headline)).toEqual(["—", "—"]);
  });
});

describe("constraintSummary", () => {
  it("flags the closest constraint once it crosses 85%, skipping excluded rows", () => {
    // Arrange
    const constraints = [
      { limit: "POWER LIMITED", label: "Power", ratio: 0.92 },
      { limit: "RUNWAY LIMITED", label: "Runway", ratio: null },
      { limit: "GRID LIMITED", label: "Grid", ratio: 0.4 },
    ] as const;

    // Act
    const summary = constraintSummary(constraints);

    // Assert
    expect(summary).toEqual({ state: "POWER LIMITED", footer: "Power is the closest constraint (92% used)." });
  });

  it("is BALANCED below 85%, and waits when nothing reports", () => {
    // Arrange / Act
    const calm = constraintSummary([{ limit: "GRID LIMITED", label: "Grid", ratio: 0.5 }]);
    const cold = constraintSummary([{ limit: "GRID LIMITED", label: "Grid", ratio: null }]);

    // Assert
    expect([calm.state, cold]).toEqual(["BALANCED", { state: "BALANCED", footer: "Waiting on live data." }]);
  });
});
