/**
 * useDerEvent() — read the current DER-control event state. Must be used
 * within MockDerEventProvider.
 */

import { useContext } from "react";
import { DerEventContext } from "./DerEventContext";
import type { DerEventState } from "./derEvent.types";

/**
 * @returns the current DER-control event state
 * @throws Error if used outside MockDerEventProvider
 */
export function useDerEvent(): DerEventState {
  const ctx = useContext(DerEventContext);
  if (ctx === null) {
    throw new Error("useDerEvent must be used within MockDerEventProvider");
  }
  return ctx;
}
