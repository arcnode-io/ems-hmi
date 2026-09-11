/**
 * Tests for DerEventSimulator — manually-fired utility DER-curtailment
 * event. Deterministic: every transition is driven by an explicit `now`.
 */

import { DerEventSimulator, ACTIVE_MS } from "./DerEventSimulator";

describe("DerEventSimulator — resting state", () => {
  it("starts quiet with no commanded target, and stays quiet if never fired", () => {
    // Arrange
    const sim = new DerEventSimulator();

    // Act
    const unchanged = sim.tick(999_999);
    const state = sim.state();

    // Assert
    expect(unchanged).toBe(false);
    expect(state.eventActive).toBe(false);
    expect(state.activeSinceMs).toBeNull();
    expect(state.targetActivePowerW).toBe(0);
    expect(state.energizeEnabled).toBe(true);
  });
});

describe("DerEventSimulator — fire()", () => {
  it("goes active immediately with a signed curtailment target", () => {
    // Arrange
    const sim = new DerEventSimulator();

    // Act
    sim.fire(1000);
    const state = sim.state();

    // Assert
    expect(state.eventActive).toBe(true);
    expect(state.activeSinceMs).toBe(1000);
    expect(state.targetActivePowerW).toBeLessThan(0); // curtailment = absorb
  });

  it("auto-clears back to quiet once ACTIVE_MS elapses", () => {
    // Arrange
    const sim = new DerEventSimulator();
    sim.fire(1000);

    // Act + Assert — still active mid-window
    expect(sim.tick(1000 + ACTIVE_MS - 1)).toBe(false);
    expect(sim.state().eventActive).toBe(true);

    // Act — window closes
    const cleared = sim.tick(1000 + ACTIVE_MS);
    const state = sim.state();

    // Assert
    expect(cleared).toBe(true);
    expect(state.eventActive).toBe(false);
    expect(state.activeSinceMs).toBeNull();
    expect(state.targetActivePowerW).toBe(0);
  });

  it("re-firing while active restarts the window", () => {
    // Arrange
    const sim = new DerEventSimulator();
    sim.fire(1000);

    // Act — refire partway through the first window
    sim.fire(1000 + ACTIVE_MS - 1);

    // Assert — the old window would have closed by now, but the refire reset it
    expect(sim.tick(1000 + ACTIVE_MS)).toBe(false);
    expect(sim.state().eventActive).toBe(true);
    expect(sim.state().activeSinceMs).toBe(1000 + ACTIVE_MS - 1);
  });
});
