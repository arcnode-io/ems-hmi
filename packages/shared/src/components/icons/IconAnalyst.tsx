/**
 * IconAnalyst — trend line with up-right arrow. Nav: top-level Analyst route.
 */

import React from "react";
import { Path } from "react-native-svg";
import { StrokeIcon } from "./StrokeIcon";

export interface IconAnalystProps {
  size?: number;
  color?: string;
}

/**
 * Render Analyst nav icon.
 * @param props size + color
 * @returns StrokeIcon
 */
export function IconAnalyst({
  size,
  color = "currentColor",
}: IconAnalystProps): React.ReactElement {
  return (
    <StrokeIcon size={size} color={color}>
      <Path d="M3 20 L9 14 L13 17 L21 8" />
      <Path d="M15 8 L21 8 L21 14" />
    </StrokeIcon>
  );
}
