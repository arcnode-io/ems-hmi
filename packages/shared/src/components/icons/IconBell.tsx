/**
 * IconBell — notification bell. Top bar alarm count affordance.
 */

import React from "react";
import { Path } from "react-native-svg";
import { StrokeIcon } from "./StrokeIcon";

export interface IconBellProps {
  size?: number;
  color?: string;
}

/**
 * Render notification-bell icon.
 * @param props size + color
 * @returns StrokeIcon
 */
export function IconBell({
  size,
  color = "currentColor",
}: IconBellProps): React.ReactElement {
  return (
    <StrokeIcon size={size} color={color}>
      <Path d="M6 16 V11 a6 6 0 0 1 12 0 V16 L20 18 H4 Z" />
      <Path d="M10 21 a2 2 0 0 0 4 0" />
    </StrokeIcon>
  );
}
