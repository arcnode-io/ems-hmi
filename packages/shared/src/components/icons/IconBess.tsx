/**
 * IconBess — battery box with bolt arrow. Used for BESS module identification.
 */

import React from "react";
import { Rect, Path } from "react-native-svg";
import { StrokeIcon } from "./StrokeIcon";

export interface IconBessProps {
  size?: number;
  color?: string;
}

/**
 * Render BESS-module icon.
 * @param props size + color
 * @returns StrokeIcon
 */
export function IconBess({ size, color = "currentColor" }: IconBessProps): React.ReactElement {
  return (
    <StrokeIcon size={size} color={color}>
      <Rect x={4} y={6} width={16} height={13} rx={1.5} />
      <Path d="M9 4 L9 6 M15 4 L15 6" />
      <Path
        d="M11 11 L11 14 L9 14 L13 18 L13 15 L15 15 L11 11"
        fill={color}
        stroke="none"
      />
    </StrokeIcon>
  );
}
