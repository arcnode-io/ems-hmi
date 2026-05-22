/**
 * ChartCanvas — the TimeseriesChart SVG: grid, y-axis ticks, threshold
 * lines, fault-gap hatches, and the series polylines.
 */

import React from "react";
import {
  Svg,
  Line,
  Polyline,
  Rect,
  Circle,
  Text as SvgText,
} from "react-native-svg";
import { useTheme } from "../../../theme/ThemeProvider";
import { seriesColor } from "../ChartRenderer/helpers";
import {
  PAD_L,
  PAD_R,
  PAD_T,
  numericX,
  pointsToPolyline,
  projectPoint,
  type Scale,
} from "./TimeseriesChart.math";
import type {
  TimeseriesGap,
  TimeseriesSeries,
  TimeseriesThreshold,
} from "./TimeseriesChart.types";

export interface ChartCanvasProps {
  scale: Scale | null;
  series: readonly TimeseriesSeries[];
  thresholds: readonly TimeseriesThreshold[];
  gaps: readonly TimeseriesGap[];
  canvasW: number;
  chartH: number;
  height: number;
  /** Series point index to mark with readout dots, or null. */
  readoutIndex?: number | null;
}

export function ChartCanvas({
  scale,
  series,
  thresholds,
  gaps,
  canvasW,
  chartH,
  height,
  readoutIndex,
}: ChartCanvasProps): React.ReactElement {
  const t = useTheme();
  const plotW = canvasW - PAD_L - PAD_R;
  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${canvasW} ${height}`}>
      {/* horizontal grid lines at 0/25/50/75/100% of chartH */}
      {[0, 0.25, 0.5, 0.75, 1].map((g) => (
        <Line
          key={`grid-${g}`}
          x1={PAD_L}
          x2={canvasW - PAD_R}
          y1={PAD_T + chartH * g}
          y2={PAD_T + chartH * g}
          stroke={t.chartGrid}
          strokeWidth={1}
        />
      ))}

      {/* y-axis tick labels (min / mid / max) */}
      {scale &&
        [0, 0.5, 1].map((g) => {
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
      {scale &&
        thresholds.map((th) => {
          const yRange = scale.yMax - scale.yMin || 1;
          const py = PAD_T + chartH - ((th.y - scale.yMin) / yRange) * chartH;
          const color = th.severity === "alarm" ? t.statusAlarm : t.statusWarn;
          return (
            <Line
              key={`th-${th.label}`}
              data-region="threshold"
              x1={PAD_L}
              x2={canvasW - PAD_R}
              y1={py}
              y2={py}
              stroke={color}
              strokeWidth={1}
              strokeDasharray="4,3"
            />
          );
        })}

      {/* fault gaps — hatch rectangles drawn behind series */}
      {scale &&
        gaps.map((gap, i) => {
          const xRange = scale.xMax - scale.xMin || 1;
          const x0 = PAD_L + ((gap.xStart - scale.xMin) / xRange) * (canvasW - PAD_L - PAD_R);
          const x1 = PAD_L + ((gap.xEnd - scale.xMin) / xRange) * (canvasW - PAD_L - PAD_R);
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
      {scale &&
        series.map((s, i) => {
          const pts = pointsToPolyline(
            s.points,
            scale,
            plotW,
            chartH,
            s.interpolation ?? "linear",
          );
          if (pts === "") return null;
          return (
            <Polyline
              key={`series-${i}`}
              data-region="series"
              points={pts}
              stroke={s.color ?? seriesColor(t, i)}
              strokeWidth={1.75}
              fill="none"
              strokeDasharray={s.style === "dashed" ? "5,3" : undefined}
              strokeLinecap="round"
              strokeLinejoin={s.interpolation === "step" ? "miter" : "round"}
            />
          );
        })}

      {/* tap-to-read markers */}
      {scale &&
        readoutIndex != null &&
        series.map((s, i) => {
          const p = s.points[readoutIndex];
          if (p === undefined || p.y === null) return null;
          const x = numericX(p.x);
          if (!Number.isFinite(x)) return null;
          const { px, py } = projectPoint(scale, plotW, chartH, x, p.y);
          return (
            <Circle
              key={`readout-${i}`}
              data-region="readout"
              cx={px}
              cy={py}
              r={3.5}
              fill={s.color ?? seriesColor(t, i)}
              stroke={t.surface}
              strokeWidth={1.5}
            />
          );
        })}
    </Svg>
  );
}
