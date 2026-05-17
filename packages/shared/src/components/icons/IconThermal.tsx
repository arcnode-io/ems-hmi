/**
 * IconThermal — thermometer silhouette. Thermal-module identification.
 */

import React from "react";
import { Path, Circle } from "react-native-svg";
import { StrokeIcon } from "./StrokeIcon";

export interface IconThermalProps {
  size?: number;
  color?: string;
}

/**
 * Render Thermal-module icon.
 * @param props size + color
 * @returns StrokeIcon
 */
export function IconThermal({
  size,
  color = "currentColor",
}: IconThermalProps): React.ReactElement {
  return (
    <StrokeIcon size={size} color={color}>
      <Path d="M10 4 a2 2 0 0 1 4 0 V13.5 a4 4 0 1 1 -4 0 Z" />
      <Circle cx={12} cy={17} r={1.6} fill={color} stroke="none" />
      <Path d="M12 8 L12 14" />
    </StrokeIcon>
  );
}
