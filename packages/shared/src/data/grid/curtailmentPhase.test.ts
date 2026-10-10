import { curtailmentPhase } from "./curtailmentPhase";

describe("curtailmentPhase", () => {
  it("is active while the utility event is in force", () => {
    // Arrange / Act
    const next = curtailmentPhase({ active: true, gpusThrottled: true, wasCurtailed: false });

    // Assert
    expect(next).toEqual({ phase: "active", wasCurtailed: true });
  });

  it("is releasing after the event ends while GPU caps still hold", () => {
    // Arrange — event just closed; gateway's release dwell keeps the caps ~30 s
    const after = { active: false, gpusThrottled: true, wasCurtailed: true };

    // Act
    const next = curtailmentPhase(after);

    // Assert
    expect(next).toEqual({ phase: "releasing", wasCurtailed: true });
  });

  it("clears once caps lift, and never claims a release without a curtailment first", () => {
    // Arrange / Act
    const lifted = curtailmentPhase({ active: false, gpusThrottled: false, wasCurtailed: true });
    const noEvent = curtailmentPhase({ active: false, gpusThrottled: true, wasCurtailed: false });
    const unknown = curtailmentPhase({ active: null, gpusThrottled: false, wasCurtailed: false });

    // Assert
    expect([lifted, noEvent, unknown]).toEqual([
      { phase: null, wasCurtailed: false },
      { phase: null, wasCurtailed: false },
      { phase: null, wasCurtailed: false },
    ]);
  });
});
