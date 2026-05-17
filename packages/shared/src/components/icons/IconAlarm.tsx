/**
 * IconAlarm — warning octagon (stop-sign shape) with inner exclamation.
 * Alarm severity per constitution rule 1. Filled, not stroked.
 */

import React from "react";
import { Svg, Polygon, Rect, Circle } from "react-native-svg";

export interface IconAlarmProps {
  size?: number;
  color?: string;
}

const R = 11.2;
const CX = 12;
const CY = 12;

/**
 * Precompute the 8 octagon vertices once at module load (constants are pure).
 * Each vertex sits on a circle of radius R, starting at π/8 so the octagon
 * is flat-top oriented like a traffic stop sign.
 */
const OCTAGON_POINTS = (() => {
  const pts: string[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i + Math.PI / 8;
    pts.push(
      `${(CX + R * Math.cos(a)).toFixed(2)},${(CY + R * Math.sin(a)).toFixed(2)}`,
    );
  }
  return pts.join(" ");
})();

/**
 * Render a red alarm octagon with inner exclamation.
 * @param props size + color (defaults: 16, currentColor)
 * @returns Svg element
 */
export function IconAlarm({
  size = 16,
  color = "currentColor",
}: IconAlarmProps): React.ReactElement {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Polygon points={OCTAGON_POINTS} fill={color} />
      <Rect x={11.2} y={7.5} width={1.6} height={6.2} rx={0.5} fill="#fff" fillOpacity={0.95} />
      <Circle cx={12} cy={16} r={0.95} fill="#fff" fillOpacity={0.95} />
    </Svg>
  );
}
