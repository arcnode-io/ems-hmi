/**
 * AgentToolIcon — source glyphs for the intel-feed cards, per the designer
 * mockup: a brain for news, a cloud for weather, a bolt for market data.
 */

import React from "react";
import { Svg, Path, Circle } from "react-native-svg";
import { useTheme } from "../../../theme/ThemeProvider";
import type { IntelSource } from "../../../data/analyst/intelFeed";

export function AgentToolIcon({
  source,
}: {
  source: IntelSource;
}): React.ReactElement {
  const t = useTheme();
  const glyph = {
    stroke: t.textMid,
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };
  if (source === "news") {
    return (
      <Svg width={12} height={12} viewBox="0 0 16 16">
        <Path
          {...glyph}
          d="M6 3.5 a2 2 0 0 0-2 2 v.5 a1.5 1.5 0 0 0-1 1.4 a1.5 1.5 0 0 0 1 1.4 V10 a2 2 0 0 0 2 2 V3.5 z"
        />
        <Path
          {...glyph}
          d="M10 3.5 a2 2 0 0 1 2 2 v.5 a1.5 1.5 0 0 1 1 1.4 a1.5 1.5 0 0 1-1 1.4 V10 a2 2 0 0 1-2 2 V3.5 z"
        />
        <Path {...glyph} d="M6 6.5 h1 M9 6.5 h1 M6 9 h1 M9 9 h1" />
      </Svg>
    );
  }
  if (source === "weather") {
    return (
      <Svg width={12} height={12} viewBox="0 0 16 16">
        <Path
          {...glyph}
          d="M4.5 11 a2.5 2.5 0 0 1 0-5 a3 3 0 0 1 5.7-1 a2.5 2.5 0 0 1 .8 5 H4.5 z"
        />
        <Circle {...glyph} cx={11.5} cy={4.5} r={1} strokeDasharray="1 1" />
      </Svg>
    );
  }
  // market
  return (
    <Svg width={12} height={12} viewBox="0 0 16 16">
      <Path {...glyph} d="M9 2 L4 9 H8 L7 14 L12 7 H8 L9 2 z" />
    </Svg>
  );
}
