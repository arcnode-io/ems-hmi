/**
 * StrokeIcon — base wrapper for the Lucide-style stroke icons. Provides a
 * 24×24 viewBox + 1.75px round-cap/round-join stroke. Filled icons (Warning,
 * Alarm, Fire) skip this wrapper and emit their own `<Svg>` directly.
 */

import React from "react";
import { Svg } from "react-native-svg";

export interface StrokeIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  children: React.ReactNode;
}

const DEFAULT_SIZE = 18;
const DEFAULT_STROKE = 1.75;

/**
 * Render a 24×24-viewBox Svg with stroke defaults + the given children.
 * @param props size + color + strokeWidth + children (Path/Rect/etc.)
 * @returns Svg element
 */
export function StrokeIcon({
  size = DEFAULT_SIZE,
  color = "currentColor",
  strokeWidth = DEFAULT_STROKE,
  children,
}: StrokeIconProps): React.ReactElement {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  );
}
