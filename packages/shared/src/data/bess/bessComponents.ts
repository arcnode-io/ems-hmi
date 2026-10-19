/**
 * The components inside a BESS module — whatever the DTM parents to it.
 * AC modules hold bess_rack units; DC-coupled modules hold the battery bank
 * (bess_catl) and its PCS units. Each row carries only the readings its
 * template actually has, so nothing is shown as missing that doesn't exist.
 */

import { useMemo } from "react";
import type { TopologyViewType } from "../topology/topology.schema";
import { measurementTopic, type TopicUnit } from "../topics/topicBuilder";
import { useTopologyView } from "../topology/useTopologyView";
import { useDeploymentIdentity } from "../deployment/useDeploymentIdentity";
import { useAggregateMeasurements, type MessagesByTopic } from "../mqtt/useAggregateMeasurements";

export type ComponentMetricKey = "soc" | "power" | "acVoltage" | "frequency" | "dcVoltage" | "energyDischarged";

/**
 * Metric → candidate measurement names, in display order. Templates name
 * the same quantity differently (rack `frequency`, PCS `grid_frequency`).
 */
const METRICS: ReadonlyArray<readonly [ComponentMetricKey, readonly string[]]> = [
  ["soc", ["state_of_charge"]],
  ["power", ["active_power"]],
  ["acVoltage", ["ac_voltage", "ac_voltage_ab"]],
  ["frequency", ["frequency", "grid_frequency"]],
  ["dcVoltage", ["dc_voltage"]],
  ["energyDischarged", ["energy_discharged"]],
];

/** Rack / PCS `operating_state`, bank `bms_status`. */
const STATE_NAMES = ["operating_state", "bms_status"] as const;

export interface ComponentMetric {
  key: ComponentMetricKey;
  value: number | null;
}

export interface BessComponentRow {
  id: string;
  displayName: string;
  template: string;
  /** false = no address yet (ADR §25). Absent from device-api counts as provisioned. */
  provisioned: boolean;
  /** Latest state enum label; null until reported. */
  state: string | null;
  metrics: ComponentMetric[];
}

type Device = TopologyViewType["devices"][string];

interface Plan {
  device: Device;
  metrics: Array<{ key: ComponentMetricKey; topic: string }>;
  stateTopic: string | null;
}

function planFor(view: TopologyViewType, siteId: string, moduleId: string): Plan[] {
  return Object.values(view.devices)
    .filter((d) => d.parent === moduleId)
    .map((device) => {
      const measurements = view.templates_used[device.template]?.measurements ?? {};
      const topicOf = (names: readonly string[]): string | null => {
        const name = names.find((n) => measurements[n]);
        return name ? measurementTopic(siteId, device.device_id, name, measurements[name]!.unit as TopicUnit) : null;
      };
      return {
        device,
        metrics: METRICS.flatMap(([key, names]) => {
          const topic = topicOf(names);
          return topic ? [{ key, topic }] : [];
        }),
        stateTopic: topicOf(STATE_NAMES),
      };
    });
}

/** Every topic componentRows reads for `moduleId`. */
export function componentTopics(view: TopologyViewType, siteId: string, moduleId: string): string[] {
  return planFor(view, siteId, moduleId).flatMap((p) => [
    ...p.metrics.map((m) => m.topic),
    ...(p.stateTopic ? [p.stateTopic] : []),
  ]);
}

/** One row per child of `moduleId`, in DTM order. */
export function componentRows(
  view: TopologyViewType,
  siteId: string,
  moduleId: string,
  messages: MessagesByTopic,
): BessComponentRow[] {
  return planFor(view, siteId, moduleId).map(({ device, metrics, stateTopic }) => {
    const state = stateTopic ? messages[stateTopic]?.value : undefined;
    return {
      id: device.device_id,
      displayName: device.display_name ?? device.device_id,
      template: device.template,
      provisioned: device.provisioned !== false,
      state: typeof state === "string" ? state : null,
      metrics: metrics.map(({ key, topic }) => {
        const value = messages[topic]?.value;
        return { key, value: typeof value === "number" ? value : null };
      }),
    };
  });
}

/** Live component rows for a BESS module; empty until topology loads. */
export function useBessComponents(moduleId: string): BessComponentRow[] {
  const { view } = useTopologyView();
  const { siteId } = useDeploymentIdentity();
  const topics = useMemo(() => (view ? componentTopics(view, siteId, moduleId) : []), [view, siteId, moduleId]);
  const messages = useAggregateMeasurements(topics);
  return useMemo(
    () => (view ? componentRows(view, siteId, moduleId, messages) : []),
    [view, siteId, moduleId, messages],
  );
}
