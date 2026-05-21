/** Tests for dispatch telemetry derivations. AAA pattern. */

import { dispatchProgress, dispatchRevenueUsd } from "./telemetry";
import type { DispatchProposal } from "./dispatch.types";

const PROPOSAL: DispatchProposal = {
  deviceId: "bess_module_01",
  setpointKw: 1500,
  priceUsdPerMwh: 187,
  reason: "Arbitrage spread $187/MWh",
};

describe("dispatchProgress", () => {
  it("is 0.5 at the window midpoint", () => {
    expect(dispatchProgress(0, 100, 50)).toBe(0.5);
  });

  it("clamps to 0 before the window opens", () => {
    expect(dispatchProgress(0, 100, -10)).toBe(0);
  });

  it("clamps to 1 after the window closes", () => {
    expect(dispatchProgress(0, 100, 200)).toBe(1);
  });
});

describe("dispatchRevenueUsd", () => {
  it("is zero at progress 0", () => {
    expect(dispatchRevenueUsd(PROPOSAL, 0)).toBe(0);
  });

  it("is 1.5 MW · 1.5 h · $187/MWh at full progress", () => {
    expect(dispatchRevenueUsd(PROPOSAL, 1)).toBeCloseTo(420.75, 1);
  });
});
