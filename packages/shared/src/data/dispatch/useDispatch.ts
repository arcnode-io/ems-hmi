/**
 * useDispatch() — read the dispatch lifecycle + arm/abort a dispatch.
 * Must be used within an MQTT provider (Real or Mock), which owns the lifecycle.
 */

import { useContext } from "react";
import { DispatchContext, type DispatchControls } from "./DispatchContext";

/**
 * @returns Dispatch state + confirm/cancel controls
 * @throws Error if used outside an MQTT provider
 */
export function useDispatch(): DispatchControls {
  const ctx = useContext(DispatchContext);
  if (ctx === null) {
    throw new Error("useDispatch must be used within an MQTT provider");
  }
  return ctx;
}
