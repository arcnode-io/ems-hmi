/** Overview GPU strip footer values, formatted from the live fleet rollup. */

import type { GpuFleet } from "../../../../data/compute/useGpuFleet";

export interface StripMetric {
  value: string;
  unit: string;
}

export interface GpuStripMetrics {
  throttling: StripMetric;
  totalDraw: StripMetric;
  perGpu: StripMetric;
}

const DASH = "—";
const MW = 1_000_000;

function draw(watts: number | null): StripMetric {
  if (watts === null) return { value: DASH, unit: "kW" };
  return watts >= MW
    ? { value: (watts / MW).toFixed(2), unit: "MW" }
    : { value: (watts / 1000).toFixed(1), unit: "kW" };
}

/** @example gpuStripMetrics(fleet).throttling // { value: "0 / 784", unit: "GPUs" } */
export function gpuStripMetrics(fleet: GpuFleet): GpuStripMetrics {
  return {
    throttling: { value: `${fleet.throttlingCount} / ${fleet.gpuCount}`, unit: "GPUs" },
    totalDraw: draw(fleet.totalDrawW),
    perGpu: { value: fleet.perGpuW === null ? DASH : fleet.perGpuW.toFixed(0), unit: "W" },
  };
}
