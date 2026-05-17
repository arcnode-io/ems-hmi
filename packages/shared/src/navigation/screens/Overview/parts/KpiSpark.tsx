/**
 * KpiSpark — tiny inline sparkline. Used in PUE tile inside KpiStrip.
 * Pure SVG path; no axes, no legend.
 */

import React from "react";
import { Svg, Path } from "react-native-svg";

interface KpiSparkProps {
  color: string;
  points: readonly number[];
  width?: number;
  height?: number;
}

export function KpiSpark({
  color,
  points,
  width = 90,
  height = 28,
}: KpiSparkProps): React.ReactElement {
  if (points.length === 0) return <Svg width={width} height={height} />;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const d = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((v - min) / range) * height * 0.85 - 2;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
  return (
    <Svg width={width} height={height}>
      <Path
        d={d}
        stroke={color}
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
