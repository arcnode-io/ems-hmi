/**
 * DerEventContext — the DER-control event state, owned by
 * MockDerEventProvider. Demo-only; deleted once ems-device-api's AsyncAPI
 * generator emits the real `der_dispatch` channels and consumers read them
 * straight via useSubscription instead. See derEvent.types.ts.
 */

import { createContext } from "react";
import type { DerEventState } from "./derEvent.types";

export const DerEventContext = createContext<DerEventState | null>(null);
