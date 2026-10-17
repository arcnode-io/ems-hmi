/**
 * staleness — the global stale-reading policy (Joe, 2026-10-17), applied by
 * both subscription hooks to every reading: unknown after STALE_AFTER_MISSED
 * missed publishes at the catalog's `poll_rate_hz`. On-change state declares
 * `poll_rate_hz: null` in the catalog and never expires. Non-measurement
 * topics (dispatch events) never expire either.
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
