/**
 * IconCompute — server rack with cable tails. Compute module identification.
 */

import React from "react";
import { Rect, Circle, Path } from "react-native-svg";
import { StrokeIcon } from "./StrokeIcon";

export interface IconComputeProps {
  size?: number;
  color?: string;
}

/**
 * Render Compute-module icon.
 * @param props size + color
 * @returns StrokeIcon
 */
export function IconCompute({
  size,
  color = "currentColor",
}: IconComputeProps): React.ReactElement {
  return (
    <StrokeIcon size={size} color={color}>
      <Rect x={3} y={9} width={18} height={6} rx={1} />
      <Circle cx={6} cy={12} r={0.5} fill={color} stroke="none" />
      <Circle cx={9} cy={12} r={0.5} fill={color} stroke="none" />
      <Path d="M14 12 L18 12" />
      <Path d="M7 9 L7 6 M12 9 L12 5 M17 9 L17 6" />
      <Path d="M7 15 L7 18 M12 15 L12 19 M17 15 L17 18" />
    </StrokeIcon>
  );
}
