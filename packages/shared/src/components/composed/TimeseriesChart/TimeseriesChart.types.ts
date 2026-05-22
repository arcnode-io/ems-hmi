/**
 * TimeseriesChart public types. Field names mirror the analyst-agent
 * backend's `LineSpec` pydantic model 1:1 (see [[project-analyst-architecture]]).
 */

/** Point on a series. y === null = gap (skip drawing). */
export interface TimeseriesPoint {
  x: number | string;
  y: number | null;
}

export interface TimeseriesSeries {
  label: string;
  /** Color override; defaults to domain color rotation. */
  color?: string;
  points: readonly TimeseriesPoint[];
  /** Forecast/projection series render dashed; historical render solid. */
  style?: "solid" | "dashed";
  /**
   * Interpolation between samples.
   * - "linear" (default): straight line — continuous process measurements.
   * - "step": flat plateau + vertical edge — event-driven measurements
   *   (DOE limits, breaker state). Per constitution rule 3.14, smoothing
   *   would imply gradual drift and is a lie for these values.
   */
  interpolation?: "linear" | "step";
}

export interface TimeseriesThreshold {
  label: string;
  y: number;
  severity: "warn" | "alarm";
}

/**
 * Shaded fault-gap region rendered behind series lines. Per rule 3.14,
 * data outages render as visible gaps, never silently zero.
 */
export interface TimeseriesGap {
  xStart: number;
  xEnd: number;
}

export interface TimeseriesChartProps {
  title: string;
  xAxis: { label: string; kind: "time" | "category" | "numeric" };
  yAxis: { label: string; unit: string };
  series: readonly TimeseriesSeries[];
  /** Null tolerated — the analyst LineSpec serializes absent optionals as null. */
  thresholds?: readonly TimeseriesThreshold[] | null;
  /** Time ranges with no/invalid data — rendered as diagonal hatches. */
  gaps?: readonly TimeseriesGap[] | null;
  /** Hint for the canvas height; clamps to 120..480. */
  height?: number;
  /** ISO timestamp; renders a "as of …" footer when set. */
  dataAsOf?: string;
}
