/**
 * TimeseriesChart — canonical line chart. Used by the Energy ForecastTrace,
 * the Analyst LineSpec renderer, and any "value over time" surface.
 *
 * Geometry lives in TimeseriesChart.math; the SVG in ChartCanvas; the
 * swatch row in ChartLegend; the tap readout in ChartReadout. This file is
 * the container — measure, scale, header, tap handling, compose.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  type LayoutChangeEvent,
  type GestureResponderEvent,
} from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { SPACE, RADIUS } from "../../../theme/tokens/primitives";
import { seriesColor } from "../ChartRenderer/helpers";
import type { TimeseriesChartProps } from "./TimeseriesChart.types";
import {
  DEFAULT_W,
  PAD_L,
  PAD_R,
  PAD_T,
  PAD_B,
  MIN_HEIGHT,
  MAX_HEIGHT,
  computeScale,
  pxToDataX,
  nearestPointIndex,
} from "./TimeseriesChart.math";
import { ChartCanvas } from "./ChartCanvas";
import { ChartLegend } from "./ChartLegend";
import { ChartReadout, type ReadoutRow } from "./ChartReadout";

export type {
  TimeseriesPoint,
  TimeseriesSeries,
  TimeseriesThreshold,
  TimeseriesGap,
  TimeseriesChartProps,
} from "./TimeseriesChart.types";

/** Format the readout x — a clock time on a time axis, else the raw value. */
function formatXLabel(x: number | string, kind: string): string {
  if (kind === "time") {
    const ms = typeof x === "number" ? x : Date.parse(x);
    if (Number.isFinite(ms)) {
      const d = new Date(ms);
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    }
  }
  return String(x);
}

export function TimeseriesChart({
  title,
  xAxis,
  yAxis,
  series,
  thresholds: thresholdsProp,
  gaps: gapsProp,
  height = 220,
  dataAsOf,
}: TimeseriesChartProps): React.ReactElement {
  const t = useTheme();
  // Normalize — the server sends explicit null for absent optionals, and a
  // `= []` default param only catches undefined.
  const thresholds = thresholdsProp ?? [];
  const gaps = gapsProp ?? [];
  const H = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, height));
  const [canvasW, setCanvasW] = useState(DEFAULT_W);
  const [readout, setReadout] = useState<number | null>(null);
  const chartH = H - PAD_T - PAD_B;
  const scale = computeScale(series, thresholds);
  const noData = scale === null;

  // canvasW is measured off the plot wrapper, so it equals the SVG's
  // rendered px width — tap locationX maps 1:1 to viewBox x.
  const onPlotLayout = (e: LayoutChangeEvent): void => {
    const w = Math.max(DEFAULT_W, Math.round(e.nativeEvent.layout.width));
    if (w !== canvasW) setCanvasW(w);
  };
  const onTap = (e: GestureResponderEvent): void => {
    const first = series[0];
    if (scale === null || first === undefined) return;
    const dataX = pxToDataX(scale, canvasW - PAD_L - PAD_R, e.nativeEvent.locationX);
    const idx = nearestPointIndex(first.points, dataX);
    setReadout(idx >= 0 ? idx : null);
  };

  const readoutPoint = readout !== null ? series[0]?.points[readout] : undefined;
  const readoutRows: ReadoutRow[] =
    readout === null
      ? []
      : series.map((s, i) => ({
          label: s.label,
          color: s.color ?? seriesColor(t, i),
          value: s.points[readout]?.y ?? null,
        }));

  return (
    <View
      dataSet={{ comp: "TimeseriesChart", state: noData ? "no-data" : "ready" }}
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
          style={[resolveTypeStyle(t, "cardHeading"), { color: t.text, fontSize: 14 }]}
        >
          {title}
        </Text>
        <Text
          style={[resolveTypeStyle(t, "kpiLabel"), { color: t.textSoft, fontSize: 9 }]}
        >
          {yAxis.label}
          {yAxis.unit ? ` · ${yAxis.unit}` : ""}
        </Text>
      </View>

      {/* Reason: the responder API gives a locationX relative to this view;
          Pressable.onPress does not carry tap coordinates on RN-Web. */}
      <View
        dataSet={{ region: "plot" }}
        onLayout={onPlotLayout}
        onStartShouldSetResponder={() => true}
        onResponderRelease={onTap}
        style={{ position: "relative" }}
      >
        <ChartCanvas
          scale={scale}
          series={series}
          thresholds={thresholds}
          gaps={gaps}
          canvasW={canvasW}
          chartH={chartH}
          height={H}
          readoutIndex={readout}
        />
        {readoutPoint !== undefined ? (
          <ChartReadout
            xLabel={formatXLabel(readoutPoint.x, xAxis.kind)}
            rows={readoutRows}
          />
        ) : null}
      </View>

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

      <ChartLegend series={series} dataAsOf={dataAsOf} />
    </View>
  );
}
