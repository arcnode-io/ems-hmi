/**
 * RadialGauge — circular progress ring (0..100). Used inside KpiStrip's BESS
 * tile to render SoC. Screen-local utility, NOT the canonical Gauge primitive.
 */

import React from "react";
import { Svg, Circle } from "react-native-svg";

interface RadialGaugeProps {
  /** 0..100 */
  value: number;
  /** Foreground color (theme domain color). */
  color: string;
  /** Track color (theme borderSoft). */
  trackColor: string;
  size?: number;
}

export function RadialGauge({
  value,
  color,
  trackColor,
  size = 68,
}: RadialGaugeProps): React.ReactElement {
  const r = size / 2 - 5;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <Svg width={size} height={size}>
      <Circle cx={c} cy={c} r={r} stroke={trackColor} strokeWidth={4} fill="none" />
      <Circle
        cx={c}
        cy={c}
        r={r}
        stroke={color}
        strokeWidth={4}
        fill="none"
        strokeDasharray={`${circ}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${c} ${c})`}
      />
    </Svg>
  );
}
