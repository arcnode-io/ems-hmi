/** TimeseriesChart geometry — pure layout + projection maths. */

import type {
  TimeseriesPoint,
  TimeseriesSeries,
  TimeseriesThreshold,
} from "./TimeseriesChart.types";

export const DEFAULT_W = 320;
export const PAD_L = 36;
export const PAD_R = 10;
export const PAD_T = 12;
export const PAD_B = 22;
export const MIN_HEIGHT = 120;
export const MAX_HEIGHT = 480;

export interface Scale {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

/** Coerce a point's x to a number — ISO timestamp strings (time axis) → epoch ms. */
export function numericX(x: number | string): number {
  return typeof x === "number" ? x : Date.parse(x);
}

/** Derive the x/y data range across every series + threshold, or null if empty. */
export function computeScale(
  series: readonly TimeseriesSeries[],
  thresholds: readonly TimeseriesThreshold[],
): Scale | null {
  let xMin = Number.POSITIVE_INFINITY;
  let xMax = Number.NEGATIVE_INFINITY;
  let yMin = Number.POSITIVE_INFINITY;
  let yMax = Number.NEGATIVE_INFINITY;
  for (const s of series) {
    for (const p of s.points) {
      const x = numericX(p.x);
      if (Number.isFinite(x)) {
        if (x < xMin) xMin = x;
        if (x > xMax) xMax = x;
      }
      if (p.y !== null && Number.isFinite(p.y)) {
        if (p.y < yMin) yMin = p.y;
        if (p.y > yMax) yMax = p.y;
      }
    }
  }
  for (const th of thresholds) {
    if (th.y < yMin) yMin = th.y;
    if (th.y > yMax) yMax = th.y;
  }
  if (!Number.isFinite(xMin) || !Number.isFinite(yMin)) return null;
  // Pad y-range 5% on each side so the line doesn't kiss the frame.
  const yPad = Math.max(1, (yMax - yMin) * 0.05);
  return { xMin, xMax, yMin: yMin - yPad, yMax: yMax + yPad };
}

/** Project a data point to canvas pixels. */
export function projectPoint(
  scale: Scale,
  chartW: number,
  chartH: number,
  x: number,
  y: number,
): { px: number; py: number } {
  const xRange = scale.xMax - scale.xMin || 1;
  const yRange = scale.yMax - scale.yMin || 1;
  return {
    px: PAD_L + ((x - scale.xMin) / xRange) * chartW,
    py: PAD_T + chartH - ((y - scale.yMin) / yRange) * chartH,
  };
}

/** Map a tap's canvas-x pixel back to a data-x value. */
export function pxToDataX(scale: Scale, chartW: number, px: number): number {
  const xRange = scale.xMax - scale.xMin || 1;
  return scale.xMin + ((px - PAD_L) / chartW) * xRange;
}

/** Index of the point nearest `dataX`, or -1 if there are none. */
export function nearestPointIndex(
  points: readonly TimeseriesPoint[],
  dataX: number,
): number {
  let best = -1;
  let bestDist = Number.POSITIVE_INFINITY;
  points.forEach((p, i) => {
    const dist = Math.abs(numericX(p.x) - dataX);
    if (Number.isFinite(dist) && dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  });
  return best;
}

/** Build an SVG polyline `points` string for a series. */
export function pointsToPolyline(
  points: readonly TimeseriesPoint[],
  scale: Scale,
  chartW: number,
  chartH: number,
  interpolation: "linear" | "step" = "linear",
): string {
  const parts: string[] = [];
  let prevY: number | null = null;
  for (const p of points) {
    const x = numericX(p.x);
    if (p.y === null || !Number.isFinite(x)) {
      prevY = null;
      continue;
    }
    const { px, py } = projectPoint(scale, chartW, chartH, x, p.y);
    // Reason: step interpolation injects a synthetic point at (current-x,
    // prev-y) before drawing to (current-x, current-y) — flat plateau +
    // vertical edge, the canonical event-driven render.
    if (interpolation === "step" && prevY !== null) {
      const { py: pyPrev } = projectPoint(scale, chartW, chartH, x, prevY);
      parts.push(`${px.toFixed(2)},${pyPrev.toFixed(2)}`);
    }
    parts.push(`${px.toFixed(2)},${py.toFixed(2)}`);
    prevY = p.y;
  }
  return parts.join(" ");
}
