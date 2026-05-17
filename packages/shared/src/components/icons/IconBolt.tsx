/**
 * IconBolt — lightning bolt. Power-flow indicator on SLD overlays, command
 * buttons that dispatch real-time setpoints, etc.
 */

import React from "react";
import { Path } from "react-native-svg";
import { StrokeIcon } from "./StrokeIcon";

export interface IconBoltProps {
  size?: number;
  color?: string;
}

/**
 * Render lightning-bolt icon.
 * @param props size + color
 * @returns StrokeIcon
 */
export function IconBolt({
  size,
  color = "currentColor",
}: IconBoltProps): React.ReactElement {
  return (
    <StrokeIcon size={size} color={color}>
      <Path d="M13 2 L5 13 H11 L9 22 L19 10 H13 Z" />
    </StrokeIcon>
  );
}
