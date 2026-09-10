/**
 * MockDerEventProvider — drives DerEventSimulator on a 1s poll and exposes
 * the result via DerEventContext. No rAF needed (event windows are tens of
 * seconds, not per-frame). Demo-only — see derEvent.types.ts for the swap
 * plan once the real `der_dispatch` channels land.
 */

import React, { useEffect, useRef, useState } from "react";
import { DerEventSimulator } from "./DerEventSimulator";
import { DerEventContext } from "./DerEventContext";
import type { DerEventState } from "./derEvent.types";

const POLL_MS = 1000;

interface MockDerEventProviderProps {
  children: React.ReactNode;
}

export function MockDerEventProvider({
  children,
}: MockDerEventProviderProps): React.ReactElement {
  const simRef = useRef(new DerEventSimulator());
  const [state, setState] = useState<DerEventState>(() => simRef.current.state());

  useEffect(() => {
    const id = setInterval(() => {
      if (simRef.current.tick(performance.now())) {
        setState(simRef.current.state());
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <DerEventContext.Provider value={state}>{children}</DerEventContext.Provider>
  );
}
