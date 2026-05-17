/**
 * IconFire — flame silhouette. Fire severity (constitution rule 3.2 — pulse
 * handled by parent, not this icon). Filled, not stroked.
 */

import React from "react";
import { Svg, Path } from "react-native-svg";

export interface IconFireProps {
  size?: number;
  color?: string;
}

/**
 * Render a flame shape.
 * @param props size + color (defaults: 16, currentColor)
 * @returns Svg element
 */
export function IconFire({
  size = 16,
  color = "currentColor",
}: IconFireProps): React.ReactElement {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2.5 C 12 6.5 9 7.8 8 10.5 C 7 13 8.5 15 10 15 C 9.6 13.6 10.2 12.2 11 11.5 C 11 13.5 13 14 13 16 C 13 17 12.4 17.6 12 17.6 C 14.5 17.6 17 15.4 17 12.2 C 17 9 14.5 7.5 14 5 C 13.6 3 12.5 2.5 12 2.5 Z"
        fill={color}
      />
    </Svg>
  );
}
