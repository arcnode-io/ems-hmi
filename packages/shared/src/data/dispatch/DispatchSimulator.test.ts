/**
 * Tests for DispatchSimulator — the mocked dispatch lifecycle state machine.
 * Deterministic: every transition is driven by an explicit `now` argument.
 */

import { DispatchSimulator } from "./DispatchSimulator";
import { ACK_DELAY_MS, SETTLE_WINDOW_MS, SETTLED_HOLD_MS } from "./constants";
import type { DispatchProposal } from "./dispatch.types";

const DISCHARGE: DispatchProposal = {
  deviceId: "bess_module_01",
  setpointKw: 1500,
  priceUsdPerMwh: 187,
  reason: "Arbitrage spread $187/MWh",
};

const SOC_START = 70;

describe("DispatchSimulator — happy-path lifecycle", () => {
  it("runs proposed → pending → executing → settled → proposed", () => {
    // Arrange
    const sim = new DispatchSimulator();
    expect(sim.phase()).toBe("proposed");

    // Act + Assert — confirm arms the dispatch
    sim.confirm(DISCHARGE, SOC_START, 0);
    expect(sim.phase()).toBe("pending");

    // Ack delay elapses → executing
    expect(sim.tick(ACK_DELAY_MS)).toBe(true);
    expect(sim.phase()).toBe("executing");

    // Mid-window: still executing
    expect(sim.tick(ACK_DELAY_MS + SETTLE_WINDOW_MS / 2)).toBe(false);
    expect(sim.phase()).toBe("executing");

    // Window closes → settled
    expect(sim.tick(ACK_DELAY_MS + SETTLE_WINDOW_MS)).toBe(true);
    expect(sim.phase()).toBe("settled");

    // Hold elapses → back to resting
    sim.tick(ACK_DELAY_MS + SETTLE_WINDOW_MS + SETTLED_HOLD_MS);
    expect(sim.phase()).toBe("proposed");
  });
});

describe("DispatchSimulator — ticker overrides", () => {
  it("drives active_power to the signed setpoint (watts) while executing", () => {
    // Arrange
    const sim = new DispatchSimulator();
    sim.confirm(DISCHARGE, SOC_START, 0);
    sim.tick(ACK_DELAY_MS);

    // Act
    const watts = sim.overrideFor(
      "bess_module_01",
      "active_power",
      ACK_DELAY_MS,
    );

    // Assert — 1500 kW discharge → 1_500_000 W
    expect(watts).toBe(1_500_000);
  });

  it("walks state_of_charge downward for a discharge", () => {
    // Arrange
    const sim = new DispatchSimulator();
    sim.confirm(DISCHARGE, SOC_START, 0);
    sim.tick(ACK_DELAY_MS);

    // Act — SoC at the end of the executing window
    const socEnd = sim.overrideFor(
      "bess_module_01",
      "state_of_charge",
      ACK_DELAY_MS + SETTLE_WINDOW_MS,
    );

    // Assert — discharge drains the pack by the full swing
    expect(socEnd).toBe(SOC_START - 30);
  });

  it("returns null for a device that is not the dispatch target", () => {
    // Arrange
    const sim = new DispatchSimulator();
    sim.confirm(DISCHARGE, SOC_START, 0);
    sim.tick(ACK_DELAY_MS);

    // Act + Assert
    expect(
      sim.overrideFor("bess_module_02", "active_power", ACK_DELAY_MS),
    ).toBeNull();
  });
});

describe("DispatchSimulator — revenue accrual", () => {
  it("accrues zero at window open and the full amount at close", () => {
    // Arrange
    const sim = new DispatchSimulator();
    sim.confirm(DISCHARGE, SOC_START, 0);
    sim.tick(ACK_DELAY_MS);

    // Act
    const atOpen = sim.revenueUsd(ACK_DELAY_MS);
    const atClose = sim.revenueUsd(ACK_DELAY_MS + SETTLE_WINDOW_MS);

    // Assert — 1.5 MW · 1.5 h · $187/MWh = $420.75
    expect(atOpen).toBe(0);
    expect(atClose).toBeCloseTo(420.75, 1);
  });
});

describe("DispatchSimulator — cancel", () => {
  it("returns to proposed when cancelled before executing", () => {
    // Arrange
    const sim = new DispatchSimulator();
    sim.confirm(DISCHARGE, SOC_START, 0);

    // Act
    sim.cancel();

    // Assert
    expect(sim.phase()).toBe("proposed");
  });
});
