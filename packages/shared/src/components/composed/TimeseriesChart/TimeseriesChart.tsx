/**
 * TimeseriesChart — canonical line chart. Used by Energy ForecastTrace,
 * Analyst LineSpec renderer, and any future "value over time" surface.
 *
 * Field names mirror the analyst-agent backend's `LineSpec` pydantic
 * model 1:1 (see [[project-analyst-architecture]]) so codegen is a
 * one-line swap when the day comes.
 *
 * See updated-handoff/02-components/TimeseriesChart.md. Brush / zoom /
 * pan + NOW marker are out-of-scope v1; thresholds + dashed forecast +
 * grid lines + axis ticks are in.
 */

import React from "react";
import { View, Text } from "react-native";
import { Svg, Line, Polyline, Rect, Text as SvgText } from "react-native-svg";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle, type Theme } from "../../../theme/tokens";
import { SPACE, RADIUS } from "../../../theme/tokens/primitives";

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
  thresholds?: readonly TimeseriesThreshold[];
  /** Time ranges with no/invalid data — rendered as diagonal hatches. */
  gaps?: readonly TimeseriesGap[];
  /** Hint for the canvas height; clamps to 120..480. */
  height?: number;
  /** ISO timestamp; renders a "as of …" footer when set. */
  dataAsOf?: string;
}

const W = 320;
const PAD_L = 36;
const PAD_R = 10;
const PAD_T = 12;
const PAD_B = 22;
const MIN_HEIGHT = 120;
const MAX_HEIGHT = 480;

/** Cycle of domain colors for series that don't specify a color. */
function seriesColor(t: Theme, idx: number): string {
  const palette = [t.colorBess, t.colorCompute, t.colorGrid, t.colorThermal];
  return palette[idx % palette.length] ?? t.text;
}

interface Scale {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

function computeScale(
  series: readonly TimeseriesSeries[],
  thresholds: readonly TimeseriesThreshold[],
): Scale | null {
  let xMin = Number.POSITIVE_INFINITY;
  let xMax = Number.NEGATIVE_INFINITY;
  let yMin = Number.POSITIVE_INFINITY;
  let yMax = Number.NEGATIVE_INFINITY;
  for (const s of series) {
    for (const p of s.points) {
      const x = typeof p.x === "number" ? p.x : NaN;
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

function pointsToPolyline(
  points: readonly TimeseriesPoint[],
  scale: Scale,
  chartW: number,
  chartH: number,
  interpolation: "linear" | "step" = "linear",
): string {
  const xRange = scale.xMax - scale.xMin || 1;
  const yRange = scale.yMax - scale.yMin || 1;
  const project = (x: number, y: number): { px: number; py: number } => ({
    px: PAD_L + ((x - scale.xMin) / xRange) * chartW,
    py: PAD_T + chartH - ((y - scale.yMin) / yRange) * chartH,
  });
  const parts: string[] = [];
  let prevY: number | null = null;
  for (const p of points) {
    if (p.y === null) {
      prevY = null;
      continue;
    }
    const x = typeof p.x === "number" ? p.x : 0;
    const { px, py } = project(x, p.y);
    // Reason: step interpolation injects a synthetic point at (current-x,
    // prev-y) before drawing to (current-x, current-y). Produces flat
    // plateau + vertical edge — the canonical event-driven render.
    if (interpolation === "step" && prevY !== null) {
      const { py: pyPrev } = project(x, prevY);
      parts.push(`${px.toFixed(2)},${pyPrev.toFixed(2)}`);
    }
    parts.push(`${px.toFixed(2)},${py.toFixed(2)}`);
    prevY = p.y;
  }
  return parts.join(" ");
}

/**
 * Render a line chart.
 * @param props TimeseriesChart props
 * @returns View containing title, axes, SVG canvas
 */
export function TimeseriesChart({
  title,
  // Reason: xAxis.kind affects future "time" axis formatting; honored in
  // step 9b. For now numeric/category render identically; field is part
  // of the LineSpec contract so callers can pass it.
  xAxis: _xAxis,
  yAxis,
  series,
  thresholds = [],
  gaps = [],
  height = 220,
  dataAsOf,
}: TimeseriesChartProps): React.ReactElement {
  const t = useTheme();
  const H = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, height));
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;
  const scale = computeScale(series, thresholds);
  const noData = scale === null;

  return (
    <View
      dataSet={{
        comp: "TimeseriesChart",
        state: noData ? "no-data" : "ready",
      }}
      style={{
        padding: SPACE[3],
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: RADIUS[3],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: SPACE[2],
        }}
      >
        <Text
          numberOfLines={1}
          style={[
            resolveTypeStyle(t, "cardHeading"),
            { color: t.text, fontSize: 14 },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            resolveTypeStyle(t, "kpiLabel"),
            { color: t.textSoft, fontSize: 9 },
          ]}
        >
          {yAxis.label}
          {yAxis.unit ? ` · ${yAxis.unit}` : ""}
        </Text>
      </View>

      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {/* horizontal grid lines at 0/25/50/75/100% of chartH */}
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <Line
            key={`grid-${g}`}
            x1={PAD_L}
            x2={W - PAD_R}
            y1={PAD_T + chartH * g}
            y2={PAD_T + chartH * g}
            stroke={t.chartGrid}
            strokeWidth={1}
          />
        ))}

        {/* y-axis tick labels (min / mid / max) */}
        {scale && [0, 0.5, 1].map((g) => {
          const value = scale.yMax - (scale.yMax - scale.yMin) * g;
          return (
            <SvgText
              key={`ytick-${g}`}
              x={PAD_L - 5}
              y={PAD_T + chartH * g + 3}
              fill={t.textSoft}
              fontSize={9}
              fontFamily={t.fontLabel}
              textAnchor="end"
            >
              {value.toFixed(1)}
            </SvgText>
          );
        })}

        {/* threshold lines */}
        {scale && thresholds.map((th) => {
          const yRange = scale.yMax - scale.yMin || 1;
          const py = PAD_T + chartH - ((th.y - scale.yMin) / yRange) * chartH;
          const color = th.severity === "alarm" ? t.statusAlarm : t.statusWarn;
          return (
            <Line
              key={`th-${th.label}`}
              data-region="threshold"
              x1={PAD_L}
              x2={W - PAD_R}
              y1={py}
              y2={py}
              stroke={color}
              strokeWidth={1}
              strokeDasharray="4,3"
            />
          );
        })}

        {/* fault gaps — diagonal hatch rectangles drawn behind series */}
        {scale && gaps.map((gap, i) => {
          const xRange = scale.xMax - scale.xMin || 1;
          const x0 = PAD_L + ((gap.xStart - scale.xMin) / xRange) * chartW;
          const x1 = PAD_L + ((gap.xEnd - scale.xMin) / xRange) * chartW;
          return (
            <Rect
              key={`gap-${i}`}
              data-region="gap"
              x={Math.min(x0, x1)}
              y={PAD_T}
              width={Math.abs(x1 - x0)}
              height={chartH}
              fill={t.textFaint}
              opacity={0.18}
            />
          );
        })}

        {/* data series */}
        {scale && series.map((s, i) => {
          const points = pointsToPolyline(
            s.points,
            scale,
            chartW,
            chartH,
            s.interpolation ?? "linear",
          );
          if (points === "") return null;
          return (
            <Polyline
              key={`series-${i}`}
              data-region="series"
              points={points}
              stroke={s.color ?? seriesColor(t, i)}
              strokeWidth={1.75}
              fill="none"
              strokeDasharray={s.style === "dashed" ? "5,3" : undefined}
              strokeLinecap="round"
              strokeLinejoin={s.interpolation === "step" ? "miter" : "round"}
            />
          );
        })}
      </Svg>

      {noData ? (
        <Text
          style={[
            resolveTypeStyle(t, "bodyDense"),
            { color: t.textSoft, marginTop: SPACE[2], textAlign: "center" },
          ]}
        >
          No data
        </Text>
      ) : null}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: SPACE[2],
        }}
      >
        <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
          {series.map((s, i) => (
            <View
              key={`legend-${i}`}
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <View
                style={{
                  width: 10,
                  height: 2,
                  backgroundColor: s.color ?? seriesColor(t, i),
                  opacity: s.style === "dashed" ? 0.65 : 1,
                }}
              />
              <Text
                style={[
                  resolveTypeStyle(t, "caption"),
                  { color: t.textMid, fontSize: 9 },
                ]}
              >
                {s.label}
              </Text>
            </View>
          ))}
        </View>
        {dataAsOf ? (
          <Text
            style={[
              resolveTypeStyle(t, "caption"),
              { color: t.textSoft, fontSize: 9 },
            ]}
          >
            as of {dataAsOf}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
