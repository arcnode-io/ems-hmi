/**
 * IconPadlock — LOTO (lockout/tagout) symbol. Paired with `statusLoto` color.
 */

import React from "react";
import { Path, Rect, Circle } from "react-native-svg";
import { StrokeIcon } from "./StrokeIcon";

export interface IconPadlockProps {
  size?: number;
  color?: string;
}

/**
 * Render padlock icon (closed-state baseline).
 * @param props size + color
 * @returns StrokeIcon
 */
export function IconPadlock({
  size,
  color = "currentColor",
}: IconPadlockProps): React.ReactElement {
  return (
    <StrokeIcon size={size} color={color}>
      <Path d="M8 11 V8 a4 4 0 0 1 8 0 V11" />
      <Rect x={5} y={11} width={14} height={9} rx={1.5} />
      <Circle cx={12} cy={15} r={1.2} />
      <Path d="M12 16 V18" />
    </StrokeIcon>
  );
}
