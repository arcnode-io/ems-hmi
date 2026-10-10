/**
 * LotoGlyph — the handoff's SLD padlock (sld-desktop.jsx NodeBoxD), drawn at
 * the node's top-left so it never covers the status dot. A state marker only.
 */

import React from "react";
import { G, Path, Rect } from "react-native-svg";

interface LotoGlyphProps {
  /** Top-left corner of the 13×13 badge, node-local coords. */
  x: number;
  y: number;
  color: string;
  bg: string;
}

export function LotoGlyph({ x, y, color, bg }: LotoGlyphProps): React.ReactElement {
  return (
    <G transform={`translate(${x} ${y})`}>
      <Rect x={-1} y={-1} width={13} height={13} rx={2} fill={bg} stroke={color} strokeWidth={0.8} />
      <Path d="M 3 5.5 V 4 a 2 2 0 0 1 4 0 V 5.5" fill="none" stroke={color} strokeWidth={1} />
      <Rect x={2} y={5.5} width={6} height={4.5} rx={0.7} fill={color} />
    </G>
  );
}
