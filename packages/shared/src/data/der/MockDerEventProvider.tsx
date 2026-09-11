/**
 * MockDerEventProvider — owns both mock Grid Events feeds (DerEvent +
 * CircuitLimit) and a keyboard trigger to fire them on demand. No
 * randomizer: a live recorded take can't rely on an event happening to
 * land in frame, so firing is manual — Alt+Shift+D / Alt+Shift+C.
 *
 * Still polls at 1s to auto-clear each event back to quiet after its
 * active window elapses (DerEventSimulator/CircuitLimitSimulator own the
 * timing). Demo-only — see derEvent.types.ts for the swap plan.
 */

import React, { useEffect, useRef, useState } from "react";
import { DerEventSimulator } from "./DerEventSimulator";
import { CircuitLimitSimulator } from "./CircuitLimitSimulator";
import { DerEventContext } from "./DerEventContext";
import { CircuitLimitContext } from "./CircuitLimitContext";
import type { DerEventState, CircuitLimitState } from "./derEvent.types";

const POLL_MS = 1000;

/**
 * Minimal structural shapes for the pieces of `window`/`KeyboardEvent` this
 * file needs — avoids requiring the DOM lib on React Native, same pattern
 * as navigation/linking.ts's originPrefix(). The real browser objects
 * satisfy these structurally at runtime; RN's `globalThis.window` is
 * undefined, so `getWindow()` returns null there and this whole feature
 * is a no-op.
 */
interface MinimalKeyboardEvent {
  altKey: boolean;
  shiftKey: boolean;
  code: string;
}
interface MinimalWindow {
  addEventListener: (
    type: "keydown",
    listener: (e: MinimalKeyboardEvent) => void,
  ) => void;
  removeEventListener: (
    type: "keydown",
    listener: (e: MinimalKeyboardEvent) => void,
  ) => void;
}

function getWindow(): MinimalWindow | null {
  const g = globalThis as unknown as { window?: MinimalWindow };
  return g.window ?? null;
}

/** Fires on Alt+Shift+D (DER Control) / Alt+Shift+C (Circuit Export Limit). */
function isFireKey(e: MinimalKeyboardEvent, code: string): boolean {
  return e.altKey && e.shiftKey && e.code === code;
}

interface MockDerEventProviderProps {
  children: React.ReactNode;
}

export function MockDerEventProvider({
  children,
}: MockDerEventProviderProps): React.ReactElement {
  const derSimRef = useRef(new DerEventSimulator());
  const circuitSimRef = useRef(new CircuitLimitSimulator());
  const [derState, setDerState] = useState<DerEventState>(() =>
    derSimRef.current.state(),
  );
  const [circuitState, setCircuitState] = useState<CircuitLimitState>(() =>
    circuitSimRef.current.state(),
  );

  useEffect(() => {
    const id = setInterval(() => {
      if (derSimRef.current.tick(performance.now())) {
        setDerState(derSimRef.current.state());
      }
      if (circuitSimRef.current.tick(performance.now())) {
        setCircuitState(circuitSimRef.current.state());
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // Reason: web-only trigger — getWindow() is null on React Native, so
    // this whole effect is a harmless no-op there.
    const win = getWindow();
    if (!win) return;
    const onKeyDown = (e: MinimalKeyboardEvent): void => {
      if (isFireKey(e, "KeyD")) {
        derSimRef.current.fire(performance.now());
        setDerState(derSimRef.current.state());
      } else if (isFireKey(e, "KeyC")) {
        circuitSimRef.current.fire(performance.now());
        setCircuitState(circuitSimRef.current.state());
      }
    };
    win.addEventListener("keydown", onKeyDown);
    // eslint-disable-next-line no-console -- operator hint, not app logging
    console.info(
      "[demo] Grid Events triggers — Alt+Shift+D: DER Control, Alt+Shift+C: Circuit Export Limit",
    );
    return () => win.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <DerEventContext.Provider value={derState}>
      <CircuitLimitContext.Provider value={circuitState}>
        {children}
      </CircuitLimitContext.Provider>
    </DerEventContext.Provider>
  );
}
