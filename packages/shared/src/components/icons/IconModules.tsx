/**
 * IconModules — stacked boxes (isometric). Nav: top-level Modules route.
 */

import React from "react";
import { Path } from "react-native-svg";
import { StrokeIcon } from "./StrokeIcon";

export interface IconModulesProps {
  size?: number;
  color?: string;
}

/**
 * Render Modules nav icon.
 * @param props size + color
 * @returns StrokeIcon
 */
export function IconModules({
  size,
  color = "currentColor",
}: IconModulesProps): React.ReactElement {
  return (
    <StrokeIcon size={size} color={color}>
      <Path d="M12 3 L20 7 L12 11 L4 7 Z" />
      <Path d="M4 12 L12 16 L20 12" />
      <Path d="M4 17 L12 21 L20 17" />
    </StrokeIcon>
  );
}
