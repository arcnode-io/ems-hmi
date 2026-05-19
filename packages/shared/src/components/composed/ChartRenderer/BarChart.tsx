/** Categorical grouped or stacked bars; wrap the result in `ArtifactCard`. */

import React from "react";
import { View, Text } from "react-native";
import { Svg, Rect, Line, Text as SvgText } from "react-native-svg";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { SPACE } from "../../../theme/tokens/primitives";
import type { BarSpec } from "../../../data/analyst/types";
import { seriesColor } from "./helpers";

const CANVAS_W = 320;
const CANVAS_H = 200;
const PAD_LEFT = 36;
const PAD_RIGHT = 14;
const PAD_TOP = 12;
const PAD_BOTTOM = 28;
const BAND_INNER_PAD_RATIO = 0.15;
const BAR_WIDTH_RATIO = 0.85;
const USABLE_H = CANVAS_H - PAD_TOP - PAD_BOTTOM;
const PLOT_W = CANVAS_W - PAD_LEFT - PAD_RIGHT;
const Y_BASELINE_PX = CANVAS_H - PAD_BOTTOM;
const Y_LABEL_OFFSET = 6;
const Y_LABEL_BASELINE = PAD_TOP + 8;
const X_LABEL_OFFSET = 12;
const TINY_FONT = 9;
const LEGEND_FONT = 10;
const LEGEND_SWATCH_SIZE = 10;

interface BarChartProps {
  spec: BarSpec;
}

interface ChartScale {
  /** Largest stacked or per-bar value, never zero (defaults to 1). */
  yMax: number;
  /** Pixel-width of a single x-category slot. */
  bandWidth: number;
}

function maxYAcross(spec: BarSpec): number {
  const stacked = spec.stacked ?? false;
  if (stacked) {
    return spec.xAxis.categories.reduce((max, _, i) => {
      const stackSum = spec.series.reduce((sum, s) => sum + (s.values[i] ?? 0), 0);
      return Math.max(max, stackSum);
    }, 0);
  }
  return spec.series.reduce(
    (max, s) => s.values.reduce((m, v) => Math.max(m, v), max),
    0,
  );
}

function computeScale(spec: BarSpec): ChartScale {
  const yMax = Math.max(1, maxYAcross(spec));
  const bandWidth = PLOT_W / Math.max(1, spec.xAxis.categories.length);
  return { yMax, bandWidth };
}

function yToPx(scale: ChartScale, value: number): number {
  return Y_BASELINE_PX - (value / scale.yMax) * USABLE_H;
}

interface BarGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

function groupedBarGeometry(
  scale: ChartScale,
  bandX: number,
  groupW: number,
  seriesIndex: number,
  seriesCount: number,
  value: number,
): BarGeometry {
  const slotWidth = groupW / seriesCount;
  const x = bandX + seriesIndex * slotWidth;
  const yPx = yToPx(scale, value);
  return { x, y: yPx, width: slotWidth * BAR_WIDTH_RATIO, height: Y_BASELINE_PX - yPx };
}

// Returns geometry + the new stack base so the caller can chain.
function stackedBarGeometry(
  scale: ChartScale,
  bandX: number,
  groupW: number,
  stackBaseY: number,
  value: number,
): BarGeometry & { newBaseY: number } {
  const height = (value / scale.yMax) * USABLE_H;
  const y = stackBaseY - height;
  return { x: bandX, y, width: groupW, height, newBaseY: y };
}

interface CategoryColumnProps {
  spec: BarSpec;
  scale: ChartScale;
  category: string;
  categoryIndex: number;
  t: ReturnType<typeof useTheme>;
}

function CategoryColumn({ spec, scale, category, categoryIndex, t }: CategoryColumnProps): React.ReactElement {
  const stacked = spec.stacked ?? false;
  const bandX = PAD_LEFT + categoryIndex * scale.bandWidth;
  const innerPad = scale.bandWidth * BAND_INNER_PAD_RATIO;
  const groupX = bandX + innerPad;
  const groupW = scale.bandWidth - innerPad * 2;
  let stackBaseY = Y_BASELINE_PX;
  return (
    <React.Fragment>
      {spec.series.map((s, si) => {
        const value = s.values[categoryIndex] ?? 0;
        const color = s.color ?? seriesColor(t, si);
        if (stacked) {
          const g = stackedBarGeometry(scale, groupX, groupW, stackBaseY, value);
          stackBaseY = g.newBaseY;
          return <Rect key={si} x={g.x} y={g.y} width={g.width} height={g.height} fill={color} />;
        }
        const g = groupedBarGeometry(scale, groupX, groupW, si, spec.series.length, value);
        return <Rect key={si} x={g.x} y={g.y} width={g.width} height={g.height} fill={color} />;
      })}
      <SvgText
        x={bandX + scale.bandWidth / 2}
        y={Y_BASELINE_PX + X_LABEL_OFFSET}
        textAnchor="middle"
        fontSize={TINY_FONT}
        fill={t.textSoft}
      >
        {category}
      </SvgText>
    </React.Fragment>
  );
}

function Legend({ spec, t }: { spec: BarSpec; t: ReturnType<typeof useTheme> }): React.ReactElement | null {
  if (spec.series.length <= 1) return null;
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: SPACE[3],
        paddingHorizontal: SPACE[3],
        paddingTop: SPACE[2],
      }}
    >
      {spec.series.map((s, si) => (
        <View key={si} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View
            style={{
              width: LEGEND_SWATCH_SIZE,
              height: LEGEND_SWATCH_SIZE,
              backgroundColor: s.color ?? seriesColor(t, si),
              borderRadius: 2,
            }}
          />
          <Text style={[resolveTypeStyle(t, "caption"), { fontSize: LEGEND_FONT, color: t.textMid }]}>
            {s.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function BarChart({ spec }: BarChartProps): React.ReactElement {
  const t = useTheme();
  const scale = computeScale(spec);
  return (
    <View style={{ paddingVertical: SPACE[2] }}>
      <Svg width="100%" viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} preserveAspectRatio="xMidYMid meet">
        <Line x1={PAD_LEFT} y1={Y_BASELINE_PX} x2={CANVAS_W - PAD_RIGHT} y2={Y_BASELINE_PX} stroke={t.borderSoft} strokeWidth={1} />
        <SvgText x={PAD_LEFT - Y_LABEL_OFFSET} y={Y_LABEL_BASELINE} textAnchor="end" fontSize={TINY_FONT} fill={t.textSoft}>
          {scale.yMax.toFixed(0)} {spec.yAxis.unit}
        </SvgText>
        {spec.xAxis.categories.map((category, ci) => (
          <CategoryColumn key={category} spec={spec} scale={scale} category={category} categoryIndex={ci} t={t} />
        ))}
      </Svg>
      <Legend spec={spec} t={t} />
    </View>
  );
}
