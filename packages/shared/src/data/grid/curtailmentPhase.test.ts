import { curtailmentPhase } from "./curtailmentPhase";

const QUIET = { active: false, atGridLimit: false, gpusThrottled: false, cause: null } as const;

describe("curtailmentPhase", () => {
  it("is a curtailment while the utility event is in force, whatever else holds", () => {
    // Arrange / Act
    const next = curtailmentPhase({ ...QUIET, active: true, atGridLimit: true, gpusThrottled: true });

    // Assert
    expect(next).toEqual({ phase: "curtailment", cause: "curtailment" });
  });

  it("is the grid limit when import sits at the limit with no event", () => {
    // Arrange / Act
    const next = curtailmentPhase({ ...QUIET, atGridLimit: true, gpusThrottled: true });

    // Assert
    expect(next).toEqual({ phase: "gridLimit", cause: "gridLimit" });
  });

  it("explains yellow GPUs after either cause clears — the gateway holds caps ~30 s", () => {
    // Arrange / Act
    const afterEvent = curtailmentPhase({ ...QUIET, gpusThrottled: true, cause: "curtailment" });
    const afterLimit = curtailmentPhase({ ...QUIET, gpusThrottled: true, cause: "gridLimit" });

    // Assert
    expect([afterEvent, afterLimit]).toEqual([
      { phase: "curtailmentReleasing", cause: "curtailment" },
      { phase: "gridLimitReleasing", cause: "gridLimit" },
    ]);
  });

  it("still flags yellow GPUs with no cause seen (page opened mid-release, thermal)", () => {
    // Arrange / Act
    const next = curtailmentPhase({ ...QUIET, gpusThrottled: true });

    // Assert
    expect(next).toEqual({ phase: "gpusThrottled", cause: null });
  });

  it("clears and forgets the cause once nothing is constrained", () => {
    // Arrange / Act
    const next = curtailmentPhase({ ...QUIET, active: null, cause: "curtailment" });

    // Assert
    expect(next).toEqual({ phase: null, cause: null });
  });
});
