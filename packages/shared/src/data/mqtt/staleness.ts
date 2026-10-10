/**
 * staleness — max age for periodic telemetry, from the topology's declared
 * per-measurement poll rate. Opt-in per consumer (useAggregateMeasurements
 * staleAfterMs): only for periodic telemetry. On-change state (event_active,
 * operator_reserve, import_limit…) declares a nominal rate it doesn't keep, so
 * it must never use this.
 */

import type { TopologyViewType } from "../topology/topology.schema";
import { parseMeasurementTopic } from "../topics/topicBuilder";

/** Missed publishes tolerated before a value reads as unknown — matches the gateway's "go quiet" (3 missed polls). */
export const STALE_AFTER_MISSED = 3;

/**
 * @returns topic → max age ms (STALE_AFTER_MISSED × publish period), or null = never expires
 * @example staleAfterFor(view)("sites/s/devices/cm1/measurements/total_power/watts") // 3000 at 1 Hz
 */
export function staleAfterFor(
  view: Pick<TopologyViewType, "devices" | "templates_used">,
): (topic: string) => number | null {
  return (topic) => {
    const parts = parseMeasurementTopic(topic);
    if (parts === null) return null;
    const device = view.devices[parts.deviceId];
    const hz = device ? view.templates_used[device.template]?.measurements[parts.measurement]?.poll_rate_hz : null;
    return hz ? (STALE_AFTER_MISSED * 1000) / hz : null;
  };
}
