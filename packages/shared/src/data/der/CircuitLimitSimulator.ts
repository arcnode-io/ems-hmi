/**
 * CircuitLimitSimulator — the mocked distribution-circuit export-limit
 * event (second Grid Events feed, alongside DerEventSimulator). Same
 * manual-fire / auto-clear shape. Demo-only — no real backend, exists so
 * "Grid Events" reads as a genuine multi-type feed. See derEvent.types.ts.
 */

import type { CircuitLimitState } from "./derEvent.types";

/** How long an export-limit event holds once fired. */
export const ACTIVE_MS = 30_000;
/** Commanded export ceiling during an event — cap at 300 kW. */
const EXPORT_CAP_W = 300_000;

export class CircuitLimitSimulator {
  private active = false;
  private activeSinceMs: number | null = null;
  private activeUntilMs: number | null = null;

  /** Fire (or re-fire) the event now — (re)starts the active window. */
  fire(now: number): void {
    this.active = true;
    this.activeSinceMs = now;
    this.activeUntilMs = now + ACTIVE_MS;
  }

  /** Advance to `now`. Returns true if the event just auto-cleared. */
  tick(now: number): boolean {
    if (!this.active || this.activeUntilMs === null) return false;
    if (now < this.activeUntilMs) return false;
    this.active = false;
    this.activeSinceMs = null;
    this.activeUntilMs = null;
    return true;
  }

  state(): CircuitLimitState {
    return {
      eventActive: this.active,
      activeSinceMs: this.activeSinceMs,
      exportCapW: this.active ? EXPORT_CAP_W : 0,
    };
  }
}
