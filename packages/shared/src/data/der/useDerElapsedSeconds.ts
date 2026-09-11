/** @returns whole seconds since the DER Control event started; 0 while quiet. */

import { useDerEvent } from "./useDerEvent";
import { useElapsedSeconds } from "./useElapsedSeconds";

export function useDerElapsedSeconds(): number {
  const { eventActive, activeSinceMs } = useDerEvent();
  return useElapsedSeconds(eventActive, activeSinceMs);
}
