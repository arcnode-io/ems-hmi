/**
 * IconOverview — 2×2 grid. Nav: top-level Overview route.
 */

import React from "react";
import { Rect } from "react-native-svg";
import { StrokeIcon } from "./StrokeIcon";

export interface IconOverviewProps {
  size?: number;
  color?: string;
}

/**
 * Render Overview nav icon.
 * @param props size + color
 * @returns StrokeIcon
 */
export function IconOverview({
  size,
  color = "currentColor",
}: IconOverviewProps): React.ReactElement {
  return (
    <StrokeIcon size={size} color={color}>
      <Rect x={3.5} y={3.5} width={7} height={7} rx={1} />
      <Rect x={13.5} y={3.5} width={7} height={7} rx={1} />
      <Rect x={3.5} y={13.5} width={7} height={7} rx={1} />
      <Rect x={13.5} y={13.5} width={7} height={7} rx={1} />
    </StrokeIcon>
  );
}
