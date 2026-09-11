/**
 * CircuitLimitContext — the circuit export-limit event state, owned by
 * MockDerEventProvider (same provider as DerEventContext — one keyboard
 * trigger, two independent mock feeds). Demo-only; see derEvent.types.ts.
 */

import { createContext } from "react";
import type { CircuitLimitState } from "./derEvent.types";

export const CircuitLimitContext = createContext<CircuitLimitState | null>(
  null,
);
