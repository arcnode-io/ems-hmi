/**
 * Estimate the message rate a set of MQTT filters pulls into the browser,
 * from the topology's per-measurement `poll_rate_hz`. Backs the subscription
 * budget tests: the HMI subscribes only to what it renders, and that has to
 * stay cheap at real site scale (98 GPU nodes ≈ 1k topics/s of interest).
 */

import type { TopologyViewType } from "../topology/topology.schema";
import { measurementTopic, type TopicUnit } from "../topics/topicBuilder";
import { topicMatches } from "./topicMatches";

// Reason: matches the mock ticker's default when a template omits a rate.
const DEFAULT_POLL_HZ = 1;

/**
 * @param filters subscribed filters (concrete or device-level +)
 * @param view topology providing devices and per-measurement publish rates
 * @param siteId site the topics are keyed by
 * @returns estimated messages/s, each matched topic counted once
 * @example estimateMessageRate(["sites/s1/devices/+/measurements/p/watts"], view, "s1") // 2 for two 1 Hz devices
 */
export function estimateMessageRate(
  filters: readonly string[],
  view: Pick<TopologyViewType, "devices" | "templates_used">,
  siteId: string,
): number {
  let rate = 0;
  for (const device of Object.values(view.devices)) {
    const measurements = view.templates_used[device.template]?.measurements ?? {};
    for (const [name, meas] of Object.entries(measurements)) {
      const topic = measurementTopic(siteId, device.device_id, name, meas.unit as TopicUnit);
      if (filters.some((filter) => topicMatches(filter, topic))) rate += meas.poll_rate_hz ?? DEFAULT_POLL_HZ;
    }
  }
  return rate;
}
