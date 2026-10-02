/** Compute screen view-model: pure formatting over the live GPU fleet. */

import type { GpuFleet, GpuNodeSummary } from "../../../../data/compute/useGpuFleet";
import type { ActiveAlarm } from "../../../../data/alarms/useAlarms";
import { gpuStripMetrics, type StripMetric } from "../../Overview/parts/gpuStripMetrics";

const DASH = "—";
const COMPUTE_TEMPLATES: ReadonlySet<string> = new Set(["gpu_node", "compute_module"]);
// Reason: advisory band starts at 90% of the node PSU cap, read live — never hardcoded.
const WARN_FRACTION = 0.9;

const pct = (frac: number): string => `${Math.round(frac * 100)}`;

/** Hero strip: throttle count, fleet draw, headroom to P_compute_total_kW. */
export function heroKpis(
  fleet: GpuFleet,
  capacityKw: number,
): { throttling: StripMetric; draw: StripMetric; headroom: StripMetric } {
  const strip = gpuStripMetrics(fleet);
  const headroom =
    fleet.totalDrawW === null ? DASH : (capacityKw - fleet.totalDrawW / 1000).toFixed(0);
  return { throttling: strip.throttling, draw: strip.totalDraw, headroom: { value: headroom, unit: "kW" } };
}

/** Top-N nodes by draw; unreported nodes sort last. */
export function topNodes(
  fleet: GpuFleet,
  count: number,
): { deviceId: string; draw: string; cap: string }[] {
  return [...fleet.nodes]
    .sort((left, right) => (right.nodePowerW ?? -1) - (left.nodePowerW ?? -1))
    .slice(0, count)
    .map((node) => ({
      deviceId: node.deviceId,
      draw: node.nodePowerW === null ? DASH : `${(node.nodePowerW / 1000).toFixed(1)} kW`,
      cap: node.capUsed === null ? DASH : `${pct(node.capUsed)}%`,
    }));
}

/** Heatmap cell: % of GPU cap in use; warn when any GPU on the node throttles. */
export function capCell(node: GpuNodeSummary): { label: string; tone: "compute" | "warn" | "idle" } {
  if (node.capUsed === null) return { label: DASH, tone: "idle" };
  return { label: pct(node.capUsed), tone: node.throttling > 0 ? "warn" : "compute" };
}

/** Histogram input: reported node draws + warn line from the largest reported PSU cap. */
export function drawSamples(fleet: GpuFleet): { samples: number[]; warnAtW: number | null } {
  const samples = fleet.nodes
    .map((node) => node.nodePowerW)
    .filter((watts): watts is number => watts !== null);
  const limits = fleet.nodes
    .map((node) => node.nodeLimitW)
    .filter((watts): watts is number => watts !== null);
  return { samples, warnAtW: limits.length === 0 ? null : Math.max(...limits) * WARN_FRACTION };
}

/** Alarms scoped to the compute cluster (gpu_node + compute_module devices). */
export function computeAlarms(
  alarms: readonly ActiveAlarm[],
  templateOf: (deviceId: string) => string | undefined,
): ActiveAlarm[] {
  return alarms.filter((alarm) => COMPUTE_TEMPLATES.has(templateOf(alarm.deviceId) ?? ""));
}
