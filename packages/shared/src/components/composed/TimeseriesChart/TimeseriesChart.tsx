/**
 * TimeseriesChart — canonical line chart. Used by the Energy ForecastTrace,
 * the Analyst LineSpec renderer, and any "value over time" surface.
 *
 * Geometry lives in TimeseriesChart.math; the SVG in ChartCanvas; the
 * swatch row in ChartLegend. This file is the container — measure, scale,
 * header, compose.
 */

import React, { useState } from "react";
import { View, Text, type LayoutChangeEvent } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { SPACE, RADIUS } from "../../../theme/tokens/primitives";
import type { TimeseriesChartProps } from "./TimeseriesChart.types";
import {
  DEFAULT_W,
  PAD_T,
  PAD_B,
  MIN_HEIGHT,
  MAX_HEIGHT,
  computeScale,
} from "./TimeseriesChart.math";
import { ChartCanvas } from "./ChartCanvas";
import { ChartLegend } from "./ChartLegend";

export type {
  TimeseriesPoint,
  TimeseriesSeries,
  TimeseriesThreshold,
  TimeseriesGap,
  TimeseriesChartProps,
} from "./TimeseriesChart.types";

export function TimeseriesChart({
  title,
  // Reason: xAxis.kind affects future "time" axis formatting; the field is
  // part of the LineSpec contract so callers can pass it.
  xAxis: _xAxis,
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
  const onContainerLayout = (e: LayoutChangeEvent): void => {
    const measured = Math.max(
      DEFAULT_W,
      Math.round(e.nativeEvent.layout.width),
    );
    if (measured !== canvasW) setCanvasW(measured);
  };
  const chartH = H - PAD_T - PAD_B;
  const scale = computeScale(series, thresholds);
  const noData = scale === null;

  return (
    <View
      dataSet={{ comp: "TimeseriesChart", state: noData ? "no-data" : "ready" }}
      onLayout={onContainerLayout}
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

      <ChartCanvas
        scale={scale}
        series={series}
        thresholds={thresholds}
        gaps={gaps}
        canvasW={canvasW}
        chartH={chartH}
        height={H}
      />

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
