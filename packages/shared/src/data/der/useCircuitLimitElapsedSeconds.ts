/** @returns whole seconds since the circuit export-limit event started; 0 while quiet. */

import { useCircuitLimitEvent } from "./useCircuitLimitEvent";
import { useElapsedSeconds } from "./useElapsedSeconds";

export function useCircuitLimitElapsedSeconds(): number {
  const { eventActive, activeSinceMs } = useCircuitLimitEvent();
  return useElapsedSeconds(eventActive, activeSinceMs);
}
