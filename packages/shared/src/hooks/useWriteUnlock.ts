/**
 * useWriteUnlock — the "Unlock controls" guard on command panels. Controls
 * start locked; unlock() opens them, and they relock RELOCK_MS after the last
 * write (or the unlock itself) or as soon as the screen loses focus.
 * Accidental-write guard only — the gateway is the authority on what runs.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export const RELOCK_MS = 60_000;

export interface WriteUnlock {
  unlocked: boolean;
  /** Open the controls and start the relock countdown. */
  unlock: () => void;
  /** A command just went out — restart the countdown. No-op while locked. */
  noteWrite: () => void;
}

/**
 * @param focused whether the owning screen is focused; false relocks at once
 */
export function useWriteUnlock(focused: boolean): WriteUnlock {
  const [unlocked, setUnlocked] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const disarm = useCallback((): void => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const arm = useCallback((): void => {
    disarm();
    timer.current = setTimeout(() => {
      timer.current = null;
      setUnlocked(false);
    }, RELOCK_MS);
  }, [disarm]);

  const unlock = useCallback((): void => {
    setUnlocked(true);
    arm();
  }, [arm]);

  const noteWrite = useCallback((): void => {
    // Reason: timer is only live while unlocked, so it doubles as the lock check
    // without a stale `unlocked` closure.
    if (timer.current !== null) arm();
  }, [arm]);

  useEffect(() => {
    if (focused) return;
    disarm();
    setUnlocked(false);
  }, [focused, disarm]);

  useEffect(() => disarm, [disarm]);

  return { unlocked, unlock, noteWrite };
}
