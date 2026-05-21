/**
 * Dispatch telemetry — pure derivations of the fast-changing values
 * (window progress, accrued revenue) from the slow context state. Shared by
 * the DispatchSimulator and by screens that render live dispatch feedback.
 */

import { SETTLE_WINDOW_HOURS } from "./constants";
import type { DispatchProposal } from "./dispatch.types";

/** Fraction [0,1] through an executing window. */
export function dispatchProgress(
  startedAt: number,
  endsAt: number,
  now: number,
): number {
  if (now <= startedAt) return 0;
  if (now >= endsAt) return 1;
  return (now - startedAt) / (endsAt - startedAt);
}

/** Revenue accrued at a given window progress, USD. */
export function dispatchRevenueUsd(
  proposal: DispatchProposal,
  progress: number,
): number {
  const mw = proposal.setpointKw / 1000;
  return mw * SETTLE_WINDOW_HOURS * proposal.priceUsdPerMwh * progress;
}
