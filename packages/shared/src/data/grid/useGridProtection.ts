/**
 * useGridProtection — Protection panel data for the Grid screen.
 * `protective_relay_*.anti_islanding_armed` / `ride_through_enabled`, from
 * the SEL-351 DNP3 profile. No reconnect delay: it's a relay setting with
 * no DNP point (edp-api dbea150).
 */

import { familyTopics } from "../topology/templateFamily";
import { useMemo } from "react";
import { useTopologyView } from "../topology/useTopologyView";
import { useAggregateMeasurements } from "../mqtt/useAggregateMeasurements";
import { useDeploymentIdentity } from "../deployment/useDeploymentIdentity";

export interface GridProtection {
  antiIslandingArmed: boolean | null;
  rideThroughEnabled: boolean | null;
}

/**
 * Subscribe to the Grid page's protective_relay feeds.
 * @returns GridProtection — null fields when not yet reporting
 */
export function useGridProtection(): GridProtection {
  const { view } = useTopologyView();
  const { siteId } = useDeploymentIdentity();

  const topics = useMemo(
    () => familyTopics(view, siteId, "protective_relay", ["anti_islanding_armed", "ride_through_enabled"]),
    [view, siteId],
  );

  const messages = useAggregateMeasurements<number | boolean>(topics);

  return useMemo(() => {
    let antiIslandingArmed: boolean | null = null;
    let rideThroughEnabled: boolean | null = null;

    for (const topic of topics) {
      const msg = messages[topic];
      if (!msg) continue;
      if (topic.endsWith("/anti_islanding_armed/none")) {
        if (typeof msg.value === "boolean") antiIslandingArmed = msg.value;
      } else if (topic.endsWith("/ride_through_enabled/none")) {
        if (typeof msg.value === "boolean") rideThroughEnabled = msg.value;
      }
    }

    return { antiIslandingArmed, rideThroughEnabled };
  }, [topics, messages]);
}
