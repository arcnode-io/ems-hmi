/**
 * curtailmentPhase — what the curtailment banner should say. "active" while
 * der_dispatch.event_active is true; "releasing" after it ends while GPUs are
 * still capped (the gateway holds caps ~30 s before restoring), so yellow GPUs
 * never sit there with no explanation. States only observed facts — no
 * countdown: the dwell timer lives in the gateway, not here.
 */

import { useRef } from "react";

export type CurtailmentPhase = "active" | "releasing" | null;

export interface PhaseInput {
  active: boolean | null;
  gpusThrottled: boolean;
  /** Carried across renders: a curtailment was seen and its caps haven't lifted yet. */
  wasCurtailed: boolean;
}

/** Pure step: next phase + carried flag. */
export function curtailmentPhase(input: PhaseInput): { phase: CurtailmentPhase; wasCurtailed: boolean } {
  if (input.active === true) return { phase: "active", wasCurtailed: true };
  if (input.wasCurtailed && input.gpusThrottled) return { phase: "releasing", wasCurtailed: true };
  return { phase: null, wasCurtailed: false };
}

/**
 * Hook form: carries `wasCurtailed` across renders. A page opened mid-release
 * shows nothing — it never saw the curtailment, so it can't claim one.
 */
export function useCurtailmentPhase(active: boolean | null, gpusThrottled: boolean): CurtailmentPhase {
  const wasCurtailed = useRef(false);
  const next = curtailmentPhase({ active, gpusThrottled, wasCurtailed: wasCurtailed.current });
  wasCurtailed.current = next.wasCurtailed;
  return next.phase;
}
