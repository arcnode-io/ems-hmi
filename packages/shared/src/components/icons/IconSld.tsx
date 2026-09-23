/**
 * IconSld — single-line-diagram glyph: feed drop, bus bar, three drops to
 * nodes. Nav: top-level SLD route.
 */

import React from "react";
import { Path, Rect } from "react-native-svg";
import { StrokeIcon } from "./StrokeIcon";

export interface IconSldProps {
  size?: number;
  color?: string;
}

/**
 * Render SLD nav icon.
 * @param props size + color
 * @returns StrokeIcon
 */
export function IconSld({
  size,
  color = "currentColor",
}: IconSldProps): React.ReactElement {
  return (
    <StrokeIcon size={size} color={color}>
      <Path d="M12 3 V9 M4 9 H20 M6 9 V15 M12 9 V15 M18 9 V15" />
      <Rect x={4} y={15} width={4} height={5} rx={1} />
      <Rect x={10} y={15} width={4} height={5} rx={1} />
      <Rect x={16} y={15} width={4} height={5} rx={1} />
    </StrokeIcon>
  );
}
