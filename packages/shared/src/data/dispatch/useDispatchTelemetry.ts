/**
 * useDispatchTelemetry — derives the fast-changing dispatch values (window
 * progress, accrued revenue, countdown) locally from the slow context state.
 *
 * Runs a local 250 ms timer only while executing, so the rest of the app is
 * untouched by the dispatch animation.
 */

import { useEffect, useState } from "react";
import { useDispatch } from "./useDispatch";
import { dispatchProgress, dispatchRevenueUsd } from "./telemetry";

export interface DispatchTelemetry {
  /** Fraction [0,1] through the executing window. */
  progress: number;
  /** Revenue accrued so far this dispatch, USD. */
  revenueUsd: number;
  /** Whole seconds left in the executing window. */
  secondsRemaining: number;
}

const TICK_MS = 250;

export function useDispatchTelemetry(): DispatchTelemetry {
  const { state } = useDispatch();
  const [, setTick] = useState(0);

  // Re-render at TICK_MS only while the window is open.
  useEffect(() => {
    if (state.phase !== "executing") return;
    const id = setInterval(() => setTick((n) => n + 1), TICK_MS);
    return () => clearInterval(id);
  }, [state.phase]);

  const { executingStartedAt, executingEndsAt, proposal } = state;
  if (executingStartedAt === null || executingEndsAt === null || !proposal) {
    return { progress: 0, revenueUsd: 0, secondsRemaining: 0 };
  }
  const now = performance.now();
  const progress = dispatchProgress(executingStartedAt, executingEndsAt, now);
  return {
    progress,
    revenueUsd: dispatchRevenueUsd(proposal, progress),
    secondsRemaining: Math.max(0, (executingEndsAt - now) / 1000),
  };
}
