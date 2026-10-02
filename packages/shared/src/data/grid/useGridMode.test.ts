import { fromBreaker } from "./useGridMode";

describe("fromBreaker — PCC breaker from the relay's breaker_closed + trip_status", () => {
  it("closed is GRID, whatever the latched trip flag says", () => {
    // Arrange + Act
    const result = fromBreaker(true, true);

    // Assert
    expect(result).toEqual({ mode: "GRID", islandQualifier: null, breakerState: "CLOSED" });
  });

  it("open after a trip is a fault island", () => {
    // Arrange + Act
    const result = fromBreaker(false, true);

    // Assert
    expect(result).toEqual({ mode: "ISLAND", islandQualifier: "fault", breakerState: "TRIPPED" });
  });

  it("open without a trip is a planned island", () => {
    // Arrange + Act
    const results = [fromBreaker(false, false), fromBreaker(false, undefined)];

    // Assert
    expect(results).toEqual([
      { mode: "ISLAND", islandQualifier: "planned", breakerState: "OPEN" },
      { mode: "ISLAND", islandQualifier: "planned", breakerState: "OPEN" },
    ]);
  });

  it("is unknown until breaker_closed arrives", () => {
    // Arrange + Act
    const result = fromBreaker(undefined, true);

    // Assert
    expect(result).toBeNull();
  });
});
