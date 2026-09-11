/**
 * useElapsedSeconds — whole seconds since `activeSinceMs`, ticking locally
 * at 1 Hz while `active` (mirrors useDispatchTelemetry's local-timer
 * pattern) so a panel counts up without its provider re-rendering every
 * second. Shared core for useDerElapsedSeconds / useCircuitLimitElapsedSeconds.
 */

import { useEffect, useState } from "react";

const TICK_MS = 1000;

/** @returns whole seconds elapsed since `activeSinceMs`; 0 while inactive. */
export function useElapsedSeconds(
  active: boolean,
  activeSinceMs: number | null,
): number {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick((n) => n + 1), TICK_MS);
    return () => clearInterval(id);
  }, [active]);

  if (!active || activeSinceMs === null) return 0;
  return Math.max(0, Math.floor((performance.now() - activeSinceMs) / 1000));
}
