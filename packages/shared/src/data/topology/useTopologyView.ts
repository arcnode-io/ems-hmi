/**
 * useTopologyView — access the topology projection from any descendant of TopologyProvider.
 *
 * Returns { status, view, error, refetch }. `view` is null while loading or on error.
 */

import { useContext } from "react";
import {
  TopologyContext,
  type TopologyContextValue,
} from "./TopologyProvider";

/**
 * Hook for accessing topology view + status. Throws outside TopologyProvider.
 * @returns TopologyContextValue
 * @throws Error if invoked outside a TopologyProvider
 */
export function useTopologyView(): TopologyContextValue {
  const ctx = useContext(TopologyContext);
  if (ctx === null) {
    throw new Error("useTopologyView must be used within TopologyProvider");
  }
  return ctx;
}
