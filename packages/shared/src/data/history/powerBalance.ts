/** Rolling-window helpers for the live power-balance chart. */

import type { TimeseriesPoint } from "../../components/composed/TimeseriesChart/TimeseriesChart.types";

export interface TimePoint extends TimeseriesPoint {
  /** Epoch ms. */
  x: number;
}

/** Chart window: the last 15 minutes. */
export const WINDOW_MS = 15 * 60_000;

export interface BalanceSeries {
  /** POI net, W (+import). */
  grid: TimePoint[];
  /** Summed bess_module active_power, W (+discharge). */
  bess: TimePoint[];
  /**
   * Compute container draw, W — summed compute_module.total_power (PDU input:
   * GPU nodes + CDU + switches). Metered, and the same source live + history.
   */
  compute: TimePoint[];
}

export const EMPTY_BALANCE: BalanceSeries = { grid: [], bess: [], compute: [] };

/** Append a live sample, keeping only points within `windowMs` of it. */
export function appendPoint(points: readonly TimePoint[], point: TimePoint, windowMs: number): TimePoint[] {
  const cutoff = point.x - windowMs;
  return [...points.filter((prev) => prev.x >= cutoff), point];
}

/**
 * History ahead of live. Reason: live samples are fresher than bucketed
 * history, so history only fills the span before the first live sample.
 */
export function stitchHistory(history: readonly TimePoint[], live: readonly TimePoint[]): TimePoint[] {
  const firstLive = live[0]?.x ?? Number.POSITIVE_INFINITY;
  return [...history.filter((point) => point.x < firstLive), ...live];
}

/**
 * Sum bucket-aligned series (e.g. several bess_modules) by timestamp.
 * Reason: a gap in any module means the site total is unknown, not lower.
 */
export function sumSeries(series: readonly (readonly TimePoint[])[]): TimePoint[] {
  const first = series[0] ?? [];
  return first.map((point) => {
    const values = series.map((each) => each.find((other) => other.x === point.x)?.y ?? null);
    const total = values.every((val): val is number => val !== null)
      ? values.reduce((acc, val) => acc + val, 0)
      : null;
    return { x: point.x, y: total };
  });
}
