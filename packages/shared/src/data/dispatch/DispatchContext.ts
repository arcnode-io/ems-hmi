/**
 * DispatchContext — the dispatch lifecycle. One implementation
 * (useRealDispatch over MQTT) for every mode; the demo differs only in who
 * answers on the wire (the mock gateway, not a real one).
 */

import { createContext } from "react";
import type { DispatchCommand, DispatchState } from "./dispatch.types";

export interface DispatchControls {
  state: DispatchState;
  /** Publish a confirmed setpoint command. */
  confirm: (command: DispatchCommand) => void;
  /** Drop the in-flight command's tracking and return to idle. */
  cancel: () => void;
}

export const DispatchContext = createContext<DispatchControls | null>(null);
