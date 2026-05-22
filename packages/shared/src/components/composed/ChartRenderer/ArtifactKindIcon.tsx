/**
 * ArtifactKindIcon — the glyph in an artifact card's kind pill, per the
 * designer mockup: a line-chart mark for charts, a grid for tables.
 * Errors carry no glyph (the mockup specs none).
 */

import React from "react";
import { Svg, Path, Rect } from "react-native-svg";

export function ArtifactKindIcon({
  kindLabel,
  color,
}: {
  kindLabel: string;
  color: string;
}): React.ReactElement | null {
  if (kindLabel === "Chart") {
    return (
      <Svg width={8} height={8} viewBox="0 0 16 16">
        <Path
          d="M2 13 L6 8 L9 11 L14 4"
          stroke={color}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  if (kindLabel === "Table") {
    return (
      <Svg width={8} height={8} viewBox="0 0 16 16">
        <Rect
          x={2}
          y={3}
          width={12}
          height={10}
          rx={1}
          stroke={color}
          strokeWidth={1.6}
          fill="none"
        />
        <Path d="M2 7 H14 M6 3 V13 M10 3 V13" stroke={color} strokeWidth={1.6} />
      </Svg>
    );
  }
  return null;
}
