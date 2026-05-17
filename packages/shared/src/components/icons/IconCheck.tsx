/**
 * IconCheck — checkmark. Used in StatusBadge.ok variant + confirmation states.
 */

import React from "react";
import { Path } from "react-native-svg";
import { StrokeIcon } from "./StrokeIcon";

export interface IconCheckProps {
  size?: number;
  color?: string;
}

/**
 * Render checkmark icon.
 * @param props size + color
 * @returns StrokeIcon
 */
export function IconCheck({
  size,
  color = "currentColor",
}: IconCheckProps): React.ReactElement {
  return (
    <StrokeIcon size={size} color={color}>
      <Path d="M5 12 L10 17 L19 7" />
    </StrokeIcon>
  );
}
