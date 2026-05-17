/**
 * IconGrid — transmission tower silhouette. Grid-module identification.
 */

import React from "react";
import { Path } from "react-native-svg";
import { StrokeIcon } from "./StrokeIcon";

export interface IconGridProps {
  size?: number;
  color?: string;
}

/**
 * Render Grid-module icon.
 * @param props size + color
 * @returns StrokeIcon
 */
export function IconGrid({
  size,
  color = "currentColor",
}: IconGridProps): React.ReactElement {
  return (
    <StrokeIcon size={size} color={color}>
      <Path d="M5 21 L8 9 L16 9 L19 21" />
      <Path d="M7 13 L17 13 M6.4 17 L17.6 17" />
      <Path d="M10 9 L11 4 L13 4 L14 9" />
    </StrokeIcon>
  );
}
