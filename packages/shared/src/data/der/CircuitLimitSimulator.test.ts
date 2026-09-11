/**
 * Tests for CircuitLimitSimulator — manually-fired distribution circuit
 * export-limit event. Same tick shape as DerEventSimulator.
 */

import { CircuitLimitSimulator, ACTIVE_MS } from "./CircuitLimitSimulator";

describe("CircuitLimitSimulator — resting state", () => {
  it("starts quiet with no export cap in effect", () => {
    // Arrange
    const sim = new CircuitLimitSimulator();

    // Act
    const state = sim.state();

    // Assert
    expect(state.eventActive).toBe(false);
    expect(state.activeSinceMs).toBeNull();
    expect(state.exportCapW).toBe(0);
  });
});

describe("CircuitLimitSimulator — fire()", () => {
  it("goes active immediately with a positive export cap", () => {
    // Arrange
    const sim = new CircuitLimitSimulator();

    // Act
    sim.fire(2000);
    const state = sim.state();

    // Assert
    expect(state.eventActive).toBe(true);
    expect(state.activeSinceMs).toBe(2000);
    expect(state.exportCapW).toBeGreaterThan(0);
  });

  it("auto-clears back to quiet once ACTIVE_MS elapses", () => {
    // Arrange
    const sim = new CircuitLimitSimulator();
    sim.fire(2000);

    // Act + Assert
    expect(sim.tick(2000 + ACTIVE_MS - 1)).toBe(false);
    expect(sim.state().eventActive).toBe(true);

    const cleared = sim.tick(2000 + ACTIVE_MS);

    // Assert
    expect(cleared).toBe(true);
    expect(sim.state().eventActive).toBe(false);
    expect(sim.state().exportCapW).toBe(0);
  });
});
