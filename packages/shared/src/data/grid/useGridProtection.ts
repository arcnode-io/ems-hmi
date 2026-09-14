/**
 * useGridProtection — Protection panel data for the Grid screen.
 * `protective_relay_*.anti_islanding_armed` / `ride_through_enabled` /
 * `reconnect_delay_s`, just approved and built by power-engineer
 * 2026-09-13. "Export permit" isn't here — per Joe, it's the same number
 * as operating_envelope.export_limit (useOperatingEnvelope), just
 * relabeled on this panel, not a separate protection-scheme field.
 */

import { useMemo } from "react";
import { useTopologyView } from "../topology/useTopologyView";
import { useAggregateMeasurements } from "../mqtt/useAggregateMeasurements";
import { useDeploymentIdentity } from "../deployment/useDeploymentIdentity";
import { measurementTopic, type TopicUnit } from "../topics/topicBuilder";

export interface GridProtection {
  antiIslandingArmed: boolean | null;
  rideThroughEnabled: boolean | null;
  reconnectDelaySec: number | null;
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
      for (const name of ["anti_islanding_armed", "ride_through_enabled", "reconnect_delay_s"]) {
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
    let reconnectDelaySec: number | null = null;

    for (const topic of topics) {
      const msg = messages[topic];
      if (!msg) continue;
      if (topic.endsWith("/anti_islanding_armed/none")) {
        if (typeof msg.value === "boolean") antiIslandingArmed = msg.value;
      } else if (topic.endsWith("/ride_through_enabled/none")) {
        if (typeof msg.value === "boolean") rideThroughEnabled = msg.value;
      } else if (topic.endsWith("/reconnect_delay_s/none")) {
        if (typeof msg.value === "number") reconnectDelaySec = msg.value;
      }
    }

    return { antiIslandingArmed, rideThroughEnabled, reconnectDelaySec };
  }, [topics, messages]);
}
