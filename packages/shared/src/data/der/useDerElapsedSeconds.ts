/**
 * useDerElapsedSeconds — whole seconds since the active event began. Ticks
 * locally at 1 Hz while an event is active (mirrors useDispatchTelemetry's
 * local-timer pattern) so the panel counts up without the mock provider
 * re-rendering every second.
 */

import { useEffect, useState } from "react";
import { useDerEvent } from "./useDerEvent";

const TICK_MS = 1000;

/** @returns whole seconds elapsed since the event started; 0 while quiet. */
export function useDerElapsedSeconds(): number {
  const { eventActive, activeSinceMs } = useDerEvent();
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!eventActive) return;
    const id = setInterval(() => setTick((n) => n + 1), TICK_MS);
    return () => clearInterval(id);
  }, [eventActive]);

  if (!eventActive || activeSinceMs === null) return 0;
  return Math.max(0, Math.floor((performance.now() - activeSinceMs) / 1000));
}
