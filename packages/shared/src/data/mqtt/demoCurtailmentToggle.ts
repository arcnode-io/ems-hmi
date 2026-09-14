/**
 * demoCurtailmentToggle — demo-mode-only keypress (Alt+Shift+D) to force a
 * utility curtailment event on/off for camera takes, since der_dispatch's
 * random-walk ticker can't be relied on to fire within a single take.
 *
 * Self-contained on purpose — MockMqttProvider's only touch point is the
 * one hook call plus the two override checks in its tick loop (search
 * "demoCurtailmentToggle" there). Delete this file and both checks to
 * remove the whole feature; nothing else depends on it, and it never
 * runs outside MockMqttProvider (demo/local only, never beta).
 *
 * Same minimal-structural-type pattern as navigation/linking.ts's
 * originPrefix(): bare `window`/`KeyboardEvent` don't resolve under the
 * mobile package's RN tsconfig (no DOM lib), so this is typed just enough
 * to compile on both and no-ops on native (no `window` there).
 */

import { useEffect, useState } from "react";

interface MinimalKeyboardEvent {
  altKey: boolean;
  shiftKey: boolean;
  code: string;
}

interface MinimalWindow {
  addEventListener: (type: "keydown", listener: (e: MinimalKeyboardEvent) => void) => void;
  removeEventListener: (type: "keydown", listener: (e: MinimalKeyboardEvent) => void) => void;
}

function getWindow(): MinimalWindow | undefined {
  return (globalThis as unknown as { window?: MinimalWindow }).window;
}

/**
 * Alt+Shift+D toggles a forced curtailment event on/off. Web-only (no-op
 * on native, where there's no keyboard/window).
 * @returns true while the demo override is forcing an event active
 */
export function useDemoCurtailmentToggle(): boolean {
  const [forced, setForced] = useState(false);

  useEffect(() => {
    const win = getWindow();
    if (!win) return;
    const onKeyDown = (e: MinimalKeyboardEvent): void => {
      if (e.altKey && e.shiftKey && e.code === "KeyD") {
        setForced((prev) => !prev);
      }
    };
    win.addEventListener("keydown", onKeyDown);
    return () => win.removeEventListener("keydown", onKeyDown);
  }, []);

  return forced;
}

/** Demo curtailment cap forced by the toggle, watts (matches der_dispatch's real shape). */
export const DEMO_CURTAILMENT_CAP_W = 300_000;
