/**
 * curtailmentPhase — what the constraint banner says. Rule: if the plant is
 * constrained or any GPU is yellow, the banner is up and says why. Priority:
 * utility event → grid limit binding (no event) → caps still releasing from
 * whichever cleared (gateway holds caps ~30 s) → GPUs throttled, cause unseen.
 * Observed facts only — no countdown: the dwell timer lives in the gateway.
 */

import { useRef } from "react";
import { match } from "ts-pattern";

export type CurtailmentPhase =
  | "curtailment"
  | "gridLimit"
  | "curtailmentReleasing"
  | "gridLimitReleasing"
  | "gpusThrottled"
  | null;

/** What last constrained the plant, carried across renders until everything clears. */
export type ConstraintCause = "curtailment" | "gridLimit" | null;

export interface PhaseInput {
  /** der_dispatch.event_active. */
  active: boolean | null;
  /** Import at/over the envelope limit (isAtLimit on the gateway's headroom). */
  atGridLimit: boolean;
  gpusThrottled: boolean;
  cause: ConstraintCause;
}

/** Pure step: next phase + carried cause. */
export function curtailmentPhase(input: PhaseInput): { phase: CurtailmentPhase; cause: ConstraintCause } {
  if (input.active === true) return { phase: "curtailment", cause: "curtailment" };
  if (input.atGridLimit) return { phase: "gridLimit", cause: "gridLimit" };
  if (input.gpusThrottled) {
    const phase = match(input.cause)
      .with("curtailment", () => "curtailmentReleasing" as const)
      .with("gridLimit", () => "gridLimitReleasing" as const)
      .with(null, () => "gpusThrottled" as const)
      .exhaustive();
    return { phase, cause: input.cause };
  }
  return { phase: null, cause: null };
}

/**
 * Hook form: carries the cause across renders, so caps still holding after a
 * curtailment or a grid limit clears say which one they're releasing from.
 */
export function useCurtailmentPhase(
  active: boolean | null,
  atGridLimit: boolean,
  gpusThrottled: boolean,
): CurtailmentPhase {
  const cause = useRef<ConstraintCause>(null);
  const next = curtailmentPhase({ active, atGridLimit, gpusThrottled, cause: cause.current });
  cause.current = next.cause;
  return next.phase;
}
