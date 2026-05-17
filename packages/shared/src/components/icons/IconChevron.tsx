/**
 * IconChevron — directional chevron arrow (right by default; rotates via `dir`).
 */

import React from "react";
import { G, Path } from "react-native-svg";
import { StrokeIcon } from "./StrokeIcon";

export type ChevronDirection = "right" | "down" | "left" | "up";

export interface IconChevronProps {
  size?: number;
  color?: string;
  dir?: ChevronDirection;
}

const ROTATION: Record<ChevronDirection, number> = {
  right: 0,
  down: 90,
  left: 180,
  up: 270,
};

/**
 * Render a directional chevron, rotated via the `dir` prop.
 * @param props size + color + dir (defaults: right)
 * @returns StrokeIcon
 */
export function IconChevron({
  size,
  color = "currentColor",
  dir = "right",
}: IconChevronProps): React.ReactElement {
  return (
    <StrokeIcon size={size} color={color}>
      <G originX={12} originY={12} rotation={ROTATION[dir]}>
        <Path d="M9 6 L15 12 L9 18" />
      </G>
    </StrokeIcon>
  );
}
