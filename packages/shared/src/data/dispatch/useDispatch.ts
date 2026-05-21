/**
 * useDispatch() — read the dispatch lifecycle + arm/abort a dispatch.
 * Must be used within MockMqttProvider, which owns the lifecycle.
 */

import { useContext } from "react";
import { DispatchContext, type DispatchControls } from "./DispatchContext";

/**
 * @returns Dispatch state + confirm/cancel controls
 * @throws Error if used outside MockMqttProvider
 */
export function useDispatch(): DispatchControls {
  const ctx = useContext(DispatchContext);
  if (ctx === null) {
    throw new Error("useDispatch must be used within MockMqttProvider");
  }
  return ctx;
}
