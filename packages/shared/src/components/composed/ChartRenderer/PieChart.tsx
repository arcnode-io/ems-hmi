/**
 * PieChart — donut renderer for `PieSpec`. Body component; caller wraps in
 * ArtifactCard. Slices use the shared `seriesColor` palette when the spec
 * omits explicit colors. Renders an inline legend below the donut with
 * value + percent so operators don't have to estimate from arcs.
 */

import React from "react";
import { View, Text } from "react-native";
import { Svg, Path, Circle } from "react-native-svg";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { SPACE } from "../../../theme/tokens/primitives";
import type { PieSpec } from "../../../data/analyst/types";
import { seriesColor } from "./helpers";

const SIZE = 180;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R_OUTER = 75;
const R_INNER = 45;

interface PieChartProps {
  spec: PieSpec;
}

interface ArcSpec {
  d: string;
  color: string;
  label: string;
  value: number;
  percent: number;
}

/**
 * Build the SVG path command for a single donut slice between two angles
 * (radians, 0 = right, π/2 = bottom). Handles the >180° large-arc case.
 */
function arcPath(start: number, end: number): string {
  const x1 = CX + R_OUTER * Math.cos(start);
  const y1 = CY + R_OUTER * Math.sin(start);
  const x2 = CX + R_OUTER * Math.cos(end);
  const y2 = CY + R_OUTER * Math.sin(end);
  const ix1 = CX + R_INNER * Math.cos(end);
  const iy1 = CY + R_INNER * Math.sin(end);
  const ix2 = CX + R_INNER * Math.cos(start);
  const iy2 = CY + R_INNER * Math.sin(start);
  const large = end - start > Math.PI ? 1 : 0;
  return [
    `M ${x1} ${y1}`,
    `A ${R_OUTER} ${R_OUTER} 0 ${large} 1 ${x2} ${y2}`,
    `L ${ix1} ${iy1}`,
    `A ${R_INNER} ${R_INNER} 0 ${large} 0 ${ix2} ${iy2}`,
    "Z",
  ].join(" ");
}

function buildArcs(spec: PieSpec, t: ReturnType<typeof useTheme>): ArcSpec[] {
  const total = spec.slices.reduce((s, sl) => s + Math.max(0, sl.value), 0);
  if (total <= 0) return [];
  let cursor = -Math.PI / 2;  // 12 o'clock start
  return spec.slices.map((s, i) => {
    const v = Math.max(0, s.value);
    const sweep = (v / total) * Math.PI * 2;
    const arc: ArcSpec = {
      d: arcPath(cursor, cursor + sweep),
      color: s.color ?? seriesColor(t, i),
      label: s.label,
      value: v,
      percent: (v / total) * 100,
    };
    cursor += sweep;
    return arc;
  });
}

export function PieChart({ spec }: PieChartProps): React.ReactElement {
  const t = useTheme();
  const arcs = buildArcs(spec, t);
  return (
    <View style={{ paddingVertical: SPACE[2] }}>
      <View style={{ alignItems: "center" }}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {arcs.length === 0 ? (
            <Circle cx={CX} cy={CY} r={R_OUTER} fill="none" stroke={t.borderSoft} strokeWidth={1} />
          ) : (
            arcs.map((a, i) => <Path key={i} d={a.d} fill={a.color} />)
          )}
        </Svg>
      </View>
      <View style={{ paddingHorizontal: SPACE[3], paddingTop: SPACE[2], gap: 4 }}>
        {arcs.map((a, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 10, height: 10, backgroundColor: a.color, borderRadius: 2 }} />
            <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.text, flex: 1 }]} numberOfLines={1}>
              {a.label}
            </Text>
            <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.textMid }]}>
              {a.value.toFixed(0)} {spec.unit} · {a.percent.toFixed(0)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
