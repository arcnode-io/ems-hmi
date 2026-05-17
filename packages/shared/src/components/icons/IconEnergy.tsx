/**
 * IconEnergy — lightning glyph. Nav: top-level Energy route.
 */

import React from "react";
import { Path } from "react-native-svg";
import { StrokeIcon } from "./StrokeIcon";

export interface IconEnergyProps {
  size?: number;
  color?: string;
}

/**
 * Render Energy nav icon.
 * @param props size + color
 * @returns StrokeIcon
 */
export function IconEnergy({
  size,
  color = "currentColor",
}: IconEnergyProps): React.ReactElement {
  return (
    <StrokeIcon size={size} color={color}>
      <Path d="M13 2 L4 13 L11 13 L10 22 L20 10 L13 10 Z" />
    </StrokeIcon>
  );
}
