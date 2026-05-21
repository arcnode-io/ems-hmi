/**
 * DispatchSimulator — the mocked BESS dispatch lifecycle state machine.
 *
 * Time-driven and deterministic: every transition is a pure function of the
 * `now` passed to `tick()`, so the MockMqttProvider can drive it straight
 * off its rAF loop (auto-pauses with the tab) and tests can step it by hand.
 *
 * The simulator owns no React state. The provider mirrors `phase()` /
 * `executingWindow()` into context on transitions; fast values (live SoC,
 * power, revenue) are read per-frame via `overrideFor()` / `revenueUsd()`.
 */

import type { DispatchPhase, DispatchProposal } from "./dispatch.types";
import {
  ACK_DELAY_MS,
  SETTLE_WINDOW_MS,
  SETTLED_HOLD_MS,
  SOC_SWING_PCT,
} from "./constants";
import { dispatchRevenueUsd } from "./telemetry";

interface ActiveDispatch {
  proposal: DispatchProposal;
  socStartPct: number;
  confirmedAt: number;
  /** Set when pending → executing. */
  executingStartedAt: number | null;
  /** Set when executing → settled. */
  settledAt: number | null;
}

export class DispatchSimulator {
  private active: ActiveDispatch | null = null;

  /** Current lifecycle phase. `proposed` whenever nothing is armed. */
  phase(): DispatchPhase {
    const a = this.active;
    if (!a) return "proposed";
    if (a.executingStartedAt === null) return "pending";
    if (a.settledAt === null) return "executing";
    return "settled";
  }

  /** The armed proposal, or null while resting. */
  proposal(): DispatchProposal | null {
    return this.active?.proposal ?? null;
  }

  /** Executing-window bounds (performance.now basis), or null if not executing. */
  executingWindow(): { startedAt: number; endsAt: number } | null {
    const a = this.active;
    if (!a || a.executingStartedAt === null) return null;
    return {
      startedAt: a.executingStartedAt,
      endsAt: a.executingStartedAt + SETTLE_WINDOW_MS,
    };
  }

  /** Arm a confirmed dispatch. `socStartPct` is the pack SoC at confirm time. */
  confirm(proposal: DispatchProposal, socStartPct: number, now: number): void {
    this.active = {
      proposal,
      socStartPct,
      confirmedAt: now,
      executingStartedAt: null,
      settledAt: null,
    };
  }

  /** Abort a dispatch that has not begun executing. No-op once executing. */
  cancel(): void {
    if (this.phase() === "pending") this.active = null;
  }

  /**
   * Advance the lifecycle to `now`. Returns true if the phase changed, so the
   * provider knows when to mirror fresh state into context.
   */
  tick(now: number): boolean {
    const a = this.active;
    if (!a) return false;
    if (a.executingStartedAt === null) {
      if (now >= a.confirmedAt + ACK_DELAY_MS) {
        a.executingStartedAt = now;
        return true;
      }
      return false;
    }
    if (a.settledAt === null) {
      if (now >= a.executingStartedAt + SETTLE_WINDOW_MS) {
        a.settledAt = now;
        return true;
      }
      return false;
    }
    if (now >= a.settledAt + SETTLED_HOLD_MS) {
      this.active = null;
      return true;
    }
    return false;
  }

  /** Fraction [0,1] through the executing window. */
  progress(now: number): number {
    const a = this.active;
    if (!a || a.executingStartedAt === null) return 0;
    const elapsed = now - a.executingStartedAt;
    return Math.max(0, Math.min(1, elapsed / SETTLE_WINDOW_MS));
  }

  /**
   * Override value for one of the dispatched device's measurement tickers,
   * or null if this (device, measurement) is not steered by the dispatch.
   */
  overrideFor(
    deviceId: string,
    measurement: string,
    now: number,
  ): number | null {
    const a = this.active;
    if (!a || a.proposal.deviceId !== deviceId) return null;
    const phase = this.phase();
    if (measurement === "active_power") {
      return phase === "executing" ? a.proposal.setpointKw * 1000 : 0;
    }
    if (measurement === "state_of_charge") {
      // Discharge (+setpoint) drains the pack; charge (−setpoint) fills it.
      const target =
        a.socStartPct - Math.sign(a.proposal.setpointKw) * SOC_SWING_PCT;
      if (phase === "pending") return a.socStartPct;
      if (phase === "settled") return target;
      if (phase === "executing") {
        return a.socStartPct + (target - a.socStartPct) * this.progress(now);
      }
      return null;
    }
    return null;
  }

  /** Revenue accrued so far this dispatch, USD. */
  revenueUsd(now: number): number {
    const a = this.active;
    if (!a) return 0;
    return dispatchRevenueUsd(a.proposal, this.progress(now));
  }
}
