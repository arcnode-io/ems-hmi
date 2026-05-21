/**
 * DispatchContext — the dispatch lifecycle, owned by MockMqttProvider.
 *
 * Holds only slow-changing state (phase + window bounds). Consumers derive
 * fast values (countdown, live SoC, revenue) locally so the provider
 * re-renders only on phase transitions.
 */

import { createContext } from "react";
import type { DispatchProposal, DispatchState } from "./dispatch.types";

export interface DispatchControls {
  state: DispatchState;
  /** Arm a confirmed dispatch. `socStartPct` is the pack SoC at confirm time. */
  confirm: (proposal: DispatchProposal, socStartPct: number) => void;
  /** Abort a dispatch that has not begun executing. */
  cancel: () => void;
}

export const DispatchContext = createContext<DispatchControls | null>(null);
