/**
 * Dispatch workflow types — an operator's BESS setpoint command and its
 * lifecycle. The operator confirms through ConfirmationModal; the gateway
 * (or the demo's mock gateway — same MQTT contract) acks on dispatch_state:
 * idle → pending (received) → settled (done) | failed.
 */

/** Lifecycle phase. `idle` = nothing sent this session. */
export type DispatchPhase = "idle" | "pending" | "settled" | "failed";

/** An operator's power setpoint for one BESS. */
export interface DispatchCommand {
  deviceId: string;
  /** Signed power setpoint, kW. Positive = discharge, negative = charge. */
  setpointKw: number;
}

export interface DispatchState {
  phase: DispatchPhase;
  /** The last command sent; null while idle. */
  command: DispatchCommand | null;
  /** Failure reason from the gateway, verbatim. Set only when phase is `failed`. */
  reason: string | null;
}
