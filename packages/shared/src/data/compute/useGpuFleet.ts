/**
 * useGpuFleet — fleet rollup of every gpu_node, folded in the HMI (there's
 * no compute_module publisher yet). The demo story: GPUs stay flat and
 * un-throttled while the site is curtailed.
 */

import { useMemo } from "react";
import type { TopologyViewType } from "../topology/topology.schema";
import { useTopologyView } from "../topology/useTopologyView";
import { useDeploymentIdentity } from "../deployment/useDeploymentIdentity";
import { useAggregateMeasurements } from "../mqtt/useAggregateMeasurements";
import { measurementTopic, type TopicUnit } from "../topics/topicBuilder";

const GPU_NODE_TEMPLATE = "gpu_node";
// ~1k topics at 1 Hz — one render per second is plenty for a fleet tile.
const FLUSH_MS = 1000;
const THROTTLE_KEY = /^gpu_(\d+)_throttle_reason$/;

export interface GpuNodeReadings {
  deviceId: string;
  nodePowerW: number | null;
  gpuPowerW: number | null;
  /** One per GPU; enum label (`NA` = not throttling), null until reported. */
  throttleReasons: readonly (string | null)[];
}

export interface GpuFleet {
  nodes: { deviceId: string; throttling: number; nodePowerW: number | null }[];
  gpuCount: number;
  throttlingCount: number;
  totalDrawW: number | null;
  perGpuW: number | null;
}

export interface GpuNodeTopics {
  deviceId: string;
  nodePower: string;
  gpuPower: string;
  /** One per GPU, ordered by GPU index. */
  throttle: string[];
}

/**
 * Per-node topic set for every gpu_node in the view. GPU count comes from the
 * template's `gpu_N_throttle_reason` keys, not a hardcoded 8.
 */
export function gpuNodeTopics(
  view: Pick<TopologyViewType, "devices" | "templates_used">,
  siteId: string,
): GpuNodeTopics[] {
  const template = view.templates_used[GPU_NODE_TEMPLATE];
  if (template === undefined) return [];
  // Reason: numeric sort — lexical would put gpu_10 before gpu_2.
  const throttleNames = Object.keys(template.measurements)
    .map((name) => ({ name, idx: THROTTLE_KEY.exec(name)?.[1] }))
    .filter((entry): entry is { name: string; idx: string } => entry.idx !== undefined)
    .sort((left, right) => Number(left.idx) - Number(right.idx))
    .map((entry) => entry.name);
  return Object.values(view.devices)
    .filter((dev) => dev.template === GPU_NODE_TEMPLATE)
    .map((dev) => {
      const topic = (name: string, unit: TopicUnit): string =>
        measurementTopic(siteId, dev.device_id, name, unit);
      return {
        deviceId: dev.device_id,
        nodePower: topic("power_consumed", "watts"),
        gpuPower: topic("gpu_power_watts", "watts"),
        throttle: throttleNames.map((name) => topic(name, "none")),
      };
    });
}

const NOT_THROTTLING = "NA";

function sumOrNull(values: readonly (number | null)[]): number | null {
  const present = values.filter((val): val is number => val !== null);
  return present.length === 0 ? null : present.reduce((acc, val) => acc + val, 0);
}

/**
 * Fold per-node readings into the fleet view. Unreported values stay null
 * (never 0, never "throttling") so a cold start doesn't read as a dead fleet.
 * @example gpuFleetFrom([{deviceId:"a",nodePowerW:10e3,gpuPowerW:8e3,throttleReasons:["NA"]}]).perGpuW // 8000
 */
export function gpuFleetFrom(nodes: readonly GpuNodeReadings[]): GpuFleet {
  const summary = nodes.map((node) => ({
    deviceId: node.deviceId,
    nodePowerW: node.nodePowerW,
    throttling: node.throttleReasons.filter(
      (reason) => reason !== null && reason !== NOT_THROTTLING,
    ).length,
  }));
  // Reason: per-GPU average only over nodes that have reported, else the
  // cold-start nodes drag it toward 0.
  const reporting = nodes.filter((node) => node.gpuPowerW !== null);
  const reportingGpus = reporting.reduce((acc, node) => acc + node.throttleReasons.length, 0);
  const gpuPowerW = sumOrNull(reporting.map((node) => node.gpuPowerW));
  return {
    nodes: summary,
    gpuCount: nodes.reduce((acc, node) => acc + node.throttleReasons.length, 0),
    throttlingCount: summary.reduce((acc, node) => acc + node.throttling, 0),
    totalDrawW: sumOrNull(nodes.map((node) => node.nodePowerW)),
    perGpuW: gpuPowerW === null || reportingGpus === 0 ? null : gpuPowerW / reportingGpus,
  };
}

/** Live GPU fleet rollup. Null fields until the first batch lands. */
export function useGpuFleet(): GpuFleet {
  const { view } = useTopologyView();
  const { siteId } = useDeploymentIdentity();
  const nodes = useMemo(() => (view ? gpuNodeTopics(view, siteId) : []), [view, siteId]);
  const flat = useMemo(
    () => nodes.flatMap((node) => [node.nodePower, node.gpuPower, ...node.throttle]),
    [nodes],
  );
  const msgs = useAggregateMeasurements<number | string>(flat, { flushMs: FLUSH_MS });
  const num = (topic: string): number | null => {
    const val = msgs[topic]?.value;
    return typeof val === "number" ? val : null;
  };
  return gpuFleetFrom(
    nodes.map((node) => ({
      deviceId: node.deviceId,
      nodePowerW: num(node.nodePower),
      gpuPowerW: num(node.gpuPower),
      throttleReasons: node.throttle.map((topic) => {
        const val = msgs[topic]?.value;
        return typeof val === "string" ? val : null;
      }),
    })),
  );
}
