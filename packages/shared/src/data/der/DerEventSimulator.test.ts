/**
 * Tests for DerEventSimulator — the mocked utility DER-curtailment cycle.
 * Deterministic: every transition is driven by an explicit `now` argument.
 */

import { DerEventSimulator, QUIET_MS, ACTIVE_MS } from "./DerEventSimulator";

describe("DerEventSimulator — resting state", () => {
  it("starts quiet with no commanded target", () => {
    // Arrange
    const sim = new DerEventSimulator();

    // Act
    const state = sim.state();

    // Assert
    expect(state.eventActive).toBe(false);
    expect(state.activeSinceMs).toBeNull();
    expect(state.targetActivePowerW).toBe(0);
    expect(state.energizeEnabled).toBe(true);
  });
});

describe("DerEventSimulator — quiet -> active -> quiet cycle", () => {
  it("stays quiet until QUIET_MS elapses from the first tick", () => {
    // Arrange
    const sim = new DerEventSimulator();

    // Act + Assert — first tick just sets the baseline, no flip
    expect(sim.tick(0)).toBe(false);
    expect(sim.state().eventActive).toBe(false);

    expect(sim.tick(QUIET_MS - 1)).toBe(false);
    expect(sim.state().eventActive).toBe(false);
  });

  it("flips active at QUIET_MS, with a signed curtailment target", () => {
    // Arrange
    const sim = new DerEventSimulator();
    sim.tick(0);

    // Act
    const flipped = sim.tick(QUIET_MS);
    const state = sim.state();

    // Assert
    expect(flipped).toBe(true);
    expect(state.eventActive).toBe(true);
    expect(state.activeSinceMs).toBe(QUIET_MS);
    expect(state.targetActivePowerW).toBeLessThan(0); // curtailment = absorb
  });

  it("flips back to quiet after ACTIVE_MS, clearing activeSinceMs + target", () => {
    // Arrange
    const sim = new DerEventSimulator();
    sim.tick(0);
    sim.tick(QUIET_MS); // -> active

    // Act + Assert — still active mid-window
    expect(sim.tick(QUIET_MS + ACTIVE_MS - 1)).toBe(false);
    expect(sim.state().eventActive).toBe(true);

    // Act — window closes
    const flipped = sim.tick(QUIET_MS + ACTIVE_MS);
    const state = sim.state();

    // Assert
    expect(flipped).toBe(true);
    expect(state.eventActive).toBe(false);
    expect(state.activeSinceMs).toBeNull();
    expect(state.targetActivePowerW).toBe(0);
  });
});
