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
// ~2.7k msgs/s across the fleet — one render per second is plenty.
const FLUSH_MS = 1000;
const THROTTLE_KEY = /^gpu_(\d+)_throttle_reason$/;
const GPU_LIMIT_KEY = /^gpu_(\d+)_power_limit$/;

export interface GpuNodeReadings {
  deviceId: string;
  nodePowerW: number | null;
  /** Node PSU cap (`power_limit`), W. */
  nodeLimitW: number | null;
  /** Sum across the node's GPUs (gateway `gpu_power_watts`), W. */
  gpuPowerW: number | null;
  /** One per GPU (`gpu_N_power_limit`), null until reported. */
  gpuLimitsW: readonly (number | null)[];
  /** One per GPU; enum label (`NA` = not throttling), null until reported. */
  throttleReasons: readonly (string | null)[];
}

export interface GpuNodeSummary {
  deviceId: string;
  /** GPUs on this node reporting a throttle reason other than NA. */
  throttling: number;
  nodePowerW: number | null;
  nodeLimitW: number | null;
  gpuPowerW: number | null;
  /**
   * GPU power ÷ summed GPU caps, [0..]. ~1 = running at cap (training at max);
   * a drop under load = held back. Null until every cap has reported.
   */
  capUsed: number | null;
}

export interface GpuFleet {
  nodes: GpuNodeSummary[];
  gpuCount: number;
  throttlingCount: number;
  totalDrawW: number | null;
  perGpuW: number | null;
}

export interface GpuNodeTopics {
  deviceId: string;
  nodePower: string;
  nodeLimit: string;
  gpuPower: string;
  /** One per GPU, ordered by GPU index. */
  throttle: string[];
  /** One per GPU, ordered by GPU index. */
  gpuLimits: string[];
}

/** Template measurement names matching `pattern`, sorted by the GPU index it captures. */
function perGpuNames(measurements: Record<string, unknown>, pattern: RegExp): string[] {
  // Reason: numeric sort — lexical would put gpu_10 before gpu_2.
  return Object.keys(measurements)
    .map((name) => ({ name, idx: pattern.exec(name)?.[1] }))
    .filter((entry): entry is { name: string; idx: string } => entry.idx !== undefined)
    .sort((left, right) => Number(left.idx) - Number(right.idx))
    .map((entry) => entry.name);
}

/**
 * Per-node read keys (concrete topics) for every gpu_node in the view. GPU
 * count comes from the template's `gpu_N_*` keys, not a hardcoded 8.
 */
export function gpuNodeTopics(
  view: Pick<TopologyViewType, "devices" | "templates_used">,
  siteId: string,
): GpuNodeTopics[] {
  const template = view.templates_used[GPU_NODE_TEMPLATE];
  if (template === undefined) return [];
  const throttleNames = perGpuNames(template.measurements, THROTTLE_KEY);
  const limitNames = perGpuNames(template.measurements, GPU_LIMIT_KEY);
  return Object.values(view.devices)
    .filter((dev) => dev.template === GPU_NODE_TEMPLATE)
    .map((dev) => {
      const topic = (name: string, unit: TopicUnit): string =>
        measurementTopic(siteId, dev.device_id, name, unit);
      return {
        deviceId: dev.device_id,
        nodePower: topic("power_consumed", "watts"),
        nodeLimit: topic("power_limit", "watts"),
        gpuPower: topic("gpu_power_watts", "watts"),
        throttle: throttleNames.map((name) => topic(name, "none")),
        gpuLimits: limitNames.map((name) => topic(name, "watts")),
      };
    });
}

/**
 * The fleet's one subscription. Reason: per-node `…/<node>/measurements/#`
 * filters cost a match per filter per message — 98 filters × ~2.7k msgs/s
 * measured ~2.9 s CPU per second of traffic, and the browser fell ~45 s behind.
 * One site-wide filter matches each message once.
 */
export function gpuFleetFilter(siteId: string): string {
  return `sites/${siteId}/devices/+/measurements/#`;
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
  const summary = nodes.map((node): GpuNodeSummary => {
    const capsKnown = node.gpuLimitsW.length > 0 && node.gpuLimitsW.every((cap) => cap !== null);
    const capW = capsKnown ? sumOrNull(node.gpuLimitsW) : null;
    return {
      deviceId: node.deviceId,
      throttling: node.throttleReasons.filter(
        (reason) => reason !== null && reason !== NOT_THROTTLING,
      ).length,
      nodePowerW: node.nodePowerW,
      nodeLimitW: node.nodeLimitW,
      gpuPowerW: node.gpuPowerW,
      capUsed: node.gpuPowerW === null || capW === null || capW <= 0 ? null : node.gpuPowerW / capW,
    };
  });
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
  const filters = useMemo(() => [gpuFleetFilter(siteId)], [siteId]);
  const msgs = useAggregateMeasurements<number | string>(filters, { flushMs: FLUSH_MS });
  const num = (topic: string): number | null => {
    const val = msgs[topic]?.value;
    return typeof val === "number" ? val : null;
  };
  return gpuFleetFrom(
    nodes.map((node) => ({
      deviceId: node.deviceId,
      nodePowerW: num(node.nodePower),
      nodeLimitW: num(node.nodeLimit),
      gpuPowerW: num(node.gpuPower),
      gpuLimitsW: node.gpuLimits.map(num),
      throttleReasons: node.throttle.map((topic) => {
        const val = msgs[topic]?.value;
        return typeof val === "string" ? val : null;
      }),
    })),
  );
}
