/**
 * BarChart — categorical grouped/stacked bars. Body component; caller wraps
 * in ArtifactCard. Series colors fall back to the shared domain palette via
 * `seriesColor` when the spec omits explicit colors.
 */

import React from "react";
import { View, Text } from "react-native";
import { Svg, Rect, Line, Text as SvgText } from "react-native-svg";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { SPACE } from "../../../theme/tokens/primitives";
import type { BarSpec } from "../../../data/analyst/types";
import { seriesColor } from "./helpers";

const W = 320;
const HEIGHT = 200;
const PAD_L = 36;
const PAD_R = 14;
const PAD_T = 12;
const PAD_B = 28;

interface BarChartProps {
  spec: BarSpec;
}

interface Scale {
  maxY: number;
  /** Pixel y for value 0 — bars grow upward from here. */
  zeroPx: number;
  bandWidth: number;
}

function computeScale(spec: BarSpec): Scale {
  const stacked = spec.stacked ?? false;
  let maxY = 0;
  if (stacked) {
    for (let i = 0; i < spec.xAxis.categories.length; i++) {
      const stackSum = spec.series.reduce((sum, s) => sum + (s.values[i] ?? 0), 0);
      maxY = Math.max(maxY, stackSum);
    }
  } else {
    for (const s of spec.series) for (const v of s.values) maxY = Math.max(maxY, v);
  }
  if (maxY === 0) maxY = 1;
  const usableH = HEIGHT - PAD_T - PAD_B;
  return {
    maxY,
    zeroPx: HEIGHT - PAD_B,
    bandWidth: (W - PAD_L - PAD_R) / Math.max(1, spec.xAxis.categories.length),
  };
  // Reason: usableH consumed implicitly via scale below.
  void usableH;
}

export function BarChart({ spec }: BarChartProps): React.ReactElement {
  const t = useTheme();
  const scale = computeScale(spec);
  const usableH = HEIGHT - PAD_T - PAD_B;
  const stacked = spec.stacked ?? false;
  const yToPx = (v: number): number => scale.zeroPx - (v / scale.maxY) * usableH;
  const seriesCount = spec.series.length;
  return (
    <View style={{ paddingVertical: SPACE[2] }}>
      <Svg width="100%" viewBox={`0 0 ${W} ${HEIGHT}`} preserveAspectRatio="xMidYMid meet">
        {/* y-axis baseline */}
        <Line x1={PAD_L} y1={scale.zeroPx} x2={W - PAD_R} y2={scale.zeroPx} stroke={t.borderSoft} strokeWidth={1} />
        {/* y-axis label (max value) */}
        <SvgText x={PAD_L - 6} y={PAD_T + 8} textAnchor="end" fontSize={9} fill={t.textSoft}>
          {scale.maxY.toFixed(0)} {spec.yAxis.unit}
        </SvgText>
        {/* bars */}
        {spec.xAxis.categories.map((cat, ci) => {
          const bandX = PAD_L + ci * scale.bandWidth;
          const innerPad = scale.bandWidth * 0.15;
          const groupX = bandX + innerPad;
          const groupW = scale.bandWidth - innerPad * 2;
          let stackBase = scale.zeroPx;
          return (
            <React.Fragment key={cat}>
              {spec.series.map((s, si) => {
                const v = s.values[ci] ?? 0;
                const color = s.color ?? seriesColor(t, si);
                if (stacked) {
                  const h = (v / scale.maxY) * usableH;
                  const y = stackBase - h;
                  const r = <Rect key={si} x={groupX} y={y} width={groupW} height={h} fill={color} />;
                  stackBase = y;
                  return r;
                }
                const w = groupW / seriesCount;
                const x = groupX + si * w;
                const y = yToPx(v);
                return <Rect key={si} x={x} y={y} width={w * 0.85} height={scale.zeroPx - y} fill={color} />;
              })}
              <SvgText x={bandX + scale.bandWidth / 2} y={HEIGHT - PAD_B + 12} textAnchor="middle" fontSize={9} fill={t.textSoft}>
                {cat}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
      {/* Legend */}
      {seriesCount > 1 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SPACE[3], paddingHorizontal: SPACE[3], paddingTop: SPACE[2] }}>
          {spec.series.map((s, si) => (
            <View key={si} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={{ width: 10, height: 10, backgroundColor: s.color ?? seriesColor(t, si), borderRadius: 2 }} />
              <Text style={[resolveTypeStyle(t, "caption"), { fontSize: 10, color: t.textMid }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
