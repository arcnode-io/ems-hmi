/**
 * Which devices are reporting — any current (non-stale) reading on any of
 * their measurements. A device with no alarm is only "ok" once it reports;
 * before that its status is unknown (constitution §3.4).
 */

import { useMemo } from "react";
import type { TopologyViewType } from "../topology/topology.schema";
import { measurementTopic, type TopicUnit } from "../topics/topicBuilder";
import { useTopologyView } from "../topology/useTopologyView";
import { useDeploymentIdentity } from "../deployment/useDeploymentIdentity";
import { useAggregateMeasurements, type MessagesByTopic } from "../mqtt/useAggregateMeasurements";

export interface Reporting {
  /** Every measurement topic of the asked-for devices. */
  topics: string[];
  /** Asked-for devices with at least one current reading. */
  reporting: ReadonlySet<string>;
}

function topicsOf(view: TopologyViewType, siteId: string, deviceId: string): string[] {
  const device = view.devices[deviceId];
  if (!device) return [];
  const measurements = {
    ...view.templates_used[device.template]?.measurements,
    ...device.extra_measurements,
  };
  return Object.entries(measurements).map(([name, m]) => measurementTopic(siteId, deviceId, name, m.unit as TopicUnit));
}

/** Pure core of useReportingDevices — split out for tests. */
export function reportingDevices(
  view: TopologyViewType,
  siteId: string,
  deviceIds: readonly string[],
  messages: MessagesByTopic,
): Reporting {
  const byDevice = deviceIds.map((id) => [id, topicsOf(view, siteId, id)] as const);
  return {
    topics: byDevice.flatMap(([, topics]) => topics),
    reporting: new Set(byDevice.filter(([, topics]) => topics.some((t) => messages[t])).map(([id]) => id)),
  };
}

/**
 * Subscribe to every reading of `deviceIds`; return those reporting.
 * Stale readings drop out via useAggregateMeasurements' global policy.
 */
export function useReportingDevices(deviceIds: readonly string[]): ReadonlySet<string> {
  const { view } = useTopologyView();
  const { siteId } = useDeploymentIdentity();
  const topics = useMemo(
    () => (view ? reportingDevices(view, siteId, deviceIds, {}).topics : []),
    [view, siteId, deviceIds],
  );
  const messages = useAggregateMeasurements(topics);
  return useMemo(
    () => (view ? reportingDevices(view, siteId, deviceIds, messages).reporting : new Set<string>()),
    [view, siteId, deviceIds, messages],
  );
}
