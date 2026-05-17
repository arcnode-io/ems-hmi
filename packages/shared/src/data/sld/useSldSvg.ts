/**
 * useSldSvg — access the loaded SLD SVG string from any descendant of SldProvider.
 */

import { useContext } from "react";
import { SldContext, type SldContextValue } from "./SldProvider";

/**
 * Hook for accessing the SLD SVG string + status. Throws outside SldProvider.
 * @returns SldContextValue
 * @throws Error if invoked outside an SldProvider
 */
export function useSldSvg(): SldContextValue {
  const ctx = useContext(SldContext);
  if (ctx === null) {
    throw new Error("useSldSvg must be used within SldProvider");
  }
  return ctx;
}
