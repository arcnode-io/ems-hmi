/**
 * IconArrow — directional arrow (up by default; rotates via `dir`). Used for
 * trend indicators (KPI delta), nav back-arrow, etc.
 */

import React from "react";
import { G, Path } from "react-native-svg";
import { StrokeIcon } from "./StrokeIcon";

export type ArrowDirection = "up" | "right" | "down" | "left";

export interface IconArrowProps {
  size?: number;
  color?: string;
  dir?: ArrowDirection;
}

const ROTATION: Record<ArrowDirection, number> = {
  up: 0,
  right: 90,
  down: 180,
  left: 270,
};

/**
 * Render a directional arrow, rotated via the `dir` prop.
 * @param props size + color + dir (defaults: up)
 * @returns StrokeIcon
 */
export function IconArrow({
  size,
  color = "currentColor",
  dir = "up",
}: IconArrowProps): React.ReactElement {
  return (
    <StrokeIcon size={size} color={color}>
      <G originX={12} originY={12} rotation={ROTATION[dir]}>
        <Path d="M12 19 L12 5 M6 11 L12 5 L18 11" />
      </G>
    </StrokeIcon>
  );
}
