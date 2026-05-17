/**
 * IconWarning — caution triangle with exclamation. Warn severity per
 * constitution rule 1 ("color is never the only signal"). Filled, not stroked.
 */

import React from "react";
import { Svg, Path, Rect, Circle } from "react-native-svg";

export interface IconWarningProps {
  size?: number;
  color?: string;
}

/**
 * Render a yellow warning triangle with inner exclamation.
 * @param props size + color (defaults: 16, currentColor)
 * @returns Svg element
 */
export function IconWarning({
  size = 16,
  color = "currentColor",
}: IconWarningProps): React.ReactElement {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 3 L22 20 L2 20 Z" fill={color} />
      <Rect x={11.1} y={9} width={1.8} height={6} rx={0.6} fill="#000" fillOpacity={0.65} />
      <Circle cx={12} cy={17.2} r={1.05} fill="#000" fillOpacity={0.65} />
    </Svg>
  );
}
