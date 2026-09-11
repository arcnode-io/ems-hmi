/**
 * useCircuitLimitEvent() — read the current circuit export-limit event
 * state. Must be used within MockDerEventProvider.
 */

import { useContext } from "react";
import { CircuitLimitContext } from "./CircuitLimitContext";
import type { CircuitLimitState } from "./derEvent.types";

/**
 * @returns the current circuit export-limit event state
 * @throws Error if used outside MockDerEventProvider
 */
export function useCircuitLimitEvent(): CircuitLimitState {
  const ctx = useContext(CircuitLimitContext);
  if (ctx === null) {
    throw new Error(
      "useCircuitLimitEvent must be used within MockDerEventProvider",
    );
  }
  return ctx;
}
