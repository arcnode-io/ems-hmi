/**
 * useGridProtection — Protection panel data for the Grid screen.
 * `protective_relay_*.anti_islanding_armed` / `ride_through_enabled`, from
 * the SEL-351 DNP3 profile. No reconnect delay: it's a relay setting with
 * no DNP point (edp-api dbea150).
 */

import { useMemo } from "react";
import { useTopologyView } from "../topology/useTopologyView";
import { useAggregateMeasurements } from "../mqtt/useAggregateMeasurements";
import { useDeploymentIdentity } from "../deployment/useDeploymentIdentity";
import { measurementTopic, type TopicUnit } from "../topics/topicBuilder";

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

  const topics = useMemo(() => {
    if (!view) return [];
    const list: string[] = [];
    for (const [deviceId, device] of Object.entries(view.devices)) {
      if (device.template !== "protective_relay") continue;
      const tpl = view.templates_used[device.template];
      if (!tpl) continue;
      for (const name of ["anti_islanding_armed", "ride_through_enabled"]) {
        const m = tpl.measurements[name];
        if (m) list.push(measurementTopic(siteId, deviceId, name, m.unit as TopicUnit));
      }
    }
    return list;
  }, [view, siteId]);

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
