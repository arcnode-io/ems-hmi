/**
 * IconWrench — maintenance / LOTO indicator. Paired with `statusLoto` color
 * (formerly statusMaintenance) on maintenance overlays.
 */

import React from "react";
import { Path } from "react-native-svg";
import { StrokeIcon } from "./StrokeIcon";

export interface IconWrenchProps {
  size?: number;
  color?: string;
}

/**
 * Render wrench icon.
 * @param props size + color
 * @returns StrokeIcon
 */
export function IconWrench({
  size,
  color = "currentColor",
}: IconWrenchProps): React.ReactElement {
  return (
    <StrokeIcon size={size} color={color}>
      <Path d="M14 4 a4 4 0 0 1 5 5 L9 19 a3 3 0 0 1 -4 -4 Z" />
      <Path d="M11 8 L16 13" />
    </StrokeIcon>
  );
}
