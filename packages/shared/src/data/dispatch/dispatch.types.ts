/**
 * Dispatch workflow types — a mocked BESS charge/discharge command and its
 * lifecycle. The autopilot stands a `proposal`; the operator confirms it
 * through ConfirmationModal; the simulated lifecycle then runs
 * proposed → pending → executing → settled → proposed.
 *
 * Demo-only: there is no real market or hardware behind this. See
 * [[project-sim-affordance-amendment]] for the SIM cue rules.
 */

/** Lifecycle phase. `proposed` is the resting state — autopilot standing by. */
export type DispatchPhase = "proposed" | "pending" | "executing" | "settled";

/** A standing dispatch suggestion from the autopilot, or an operator override. */
export interface DispatchProposal {
  deviceId: string;
  /** Signed power setpoint, kW. Positive = discharge, negative = charge. */
  setpointKw: number;
  /** Market price driving the proposal, USD/MWh. */
  priceUsdPerMwh: number;
  /** Human-readable rationale, e.g. "Arbitrage spread $187/MWh". */
  reason: string;
}

/**
 * The slow-changing dispatch state mirrored into React context. Fast values
 * (live SoC, power, countdown, revenue) are derived locally by consumers
 * from `executingStartedAt`/`executingEndsAt` so the provider re-renders
 * only on phase transitions.
 */
export interface DispatchState {
  phase: DispatchPhase;
  /** The active or standing proposal. Null only before the autopilot arms one. */
  proposal: DispatchProposal | null;
  /** Wall-clock ms (performance.now basis) the executing window opened. */
  executingStartedAt: number | null;
  /** Wall-clock ms the executing window closes. */
  executingEndsAt: number | null;
}
