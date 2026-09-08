/** Tests for the autopilot proposal + re-arm timing. AAA. */

import {
  autopilotProposal,
  shouldAutopilotCharge,
  shouldRearm,
  AUTOPILOT_REARM_MS,
  AUTOPILOT_SOC_PIVOT_PCT,
  DEMO_DISPATCH_DEVICE_ID,
} from "./autopilot";

describe("autopilotProposal", () => {
  it("discharges into the peak when the pack is above the SoC pivot", () => {
    // Act
    const p = autopilotProposal(DEMO_DISPATCH_DEVICE_ID, 62);

    // Assert
    expect(p.deviceId).toBe("bess_module_01");
    expect(p.setpointKw).toBeGreaterThan(0);
    expect(p.reason).toMatch(/spread/i);
  });

  it("charges the trough when the pack is below the SoC pivot", () => {
    // Act
    const p = autopilotProposal(DEMO_DISPATCH_DEVICE_ID, 28);

    // Assert
    expect(p.setpointKw).toBeLessThan(0);
    expect(p.reason).toMatch(/charg/i);
  });

  it("defaults to a discharge when no SoC is given", () => {
    expect(autopilotProposal(DEMO_DISPATCH_DEVICE_ID).setpointKw).toBeGreaterThan(0);
  });
});

describe("shouldAutopilotCharge", () => {
  it("is true below the pivot, false at or above it", () => {
    expect(shouldAutopilotCharge(AUTOPILOT_SOC_PIVOT_PCT - 1)).toBe(true);
    expect(shouldAutopilotCharge(AUTOPILOT_SOC_PIVOT_PCT)).toBe(false);
  });
});

describe("shouldRearm", () => {
  it("is false while never-rested or still inside the beat", () => {
    // Assert
    expect(shouldRearm(null, 10_000)).toBe(false);
    expect(shouldRearm(10_000, 10_000 + AUTOPILOT_REARM_MS - 1)).toBe(false);
  });

  it("is true once the resting beat has elapsed", () => {
    // Assert
    expect(shouldRearm(10_000, 10_000 + AUTOPILOT_REARM_MS)).toBe(true);
  });
});
