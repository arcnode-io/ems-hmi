/**
 * DerEventSimulator — the mocked utility DER-curtailment cycle. Alternates
 * quiet <-> active on a timer so the demo panel has something to show.
 *
 * Time-driven and deterministic: every transition is a pure function of the
 * `now` passed to `tick()`, matching DispatchSimulator's shape so
 * MockDerEventProvider can drive it the same way MockMqttProvider drives
 * dispatch.
 */

import type { DerEventState } from "./derEvent.types";

/** How long the site sits quiet between curtailment events. */
export const QUIET_MS = 45_000;
/** How long a curtailment event holds once it fires. */
export const ACTIVE_MS = 30_000;
/** Commanded target during an event — absorb 1.2 MW. */
const CURTAIL_TARGET_W = -1_200_000;

export class DerEventSimulator {
  private phaseStartedAt: number | null = null;
  private active = false;
  private activeSinceMs: number | null = null;

  /** Advance to `now`. Returns true if the phase just flipped. */
  tick(now: number): boolean {
    if (this.phaseStartedAt === null) {
      this.phaseStartedAt = now;
      return false;
    }
    const limit = this.active ? ACTIVE_MS : QUIET_MS;
    if (now - this.phaseStartedAt < limit) return false;
    this.active = !this.active;
    this.phaseStartedAt = now;
    this.activeSinceMs = this.active ? now : null;
    return true;
  }

  state(): DerEventState {
    return {
      eventActive: this.active,
      activeSinceMs: this.activeSinceMs,
      targetActivePowerW: this.active ? CURTAIL_TARGET_W : 0,
      energizeEnabled: true,
    };
  }
}
