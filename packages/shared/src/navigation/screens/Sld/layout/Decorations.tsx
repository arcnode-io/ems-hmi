/**
 * Breaker + Inverter glyphs via react-native-svg primitives.
 */

import React from "react";
import { match } from "ts-pattern";
import { Circle, G, Line, Text as SvgText } from "react-native-svg";
import type { SldDecoration } from "./types";
import {
  BREAKER_BAR_HALF,
  BREAKER_OPEN_LIFT,
  INVERTER_GLYPH_BASELINE_Y,
  INVERTER_GLYPH_FONT_PX,
  RING_R_BREAKER,
  RING_R_INVERTER,
  STROKE_DROP,
} from "./renderConstants";

const RING_STROKE_BREAKER = STROKE_DROP;
const RING_STROKE_INVERTER = 1.2;

interface DecorationProps {
  d: SldDecoration;
  color: string;
}

export function Breaker({ d, color }: DecorationProps): React.ReactElement {
  const openTipY = d.state === "open" ? -BREAKER_OPEN_LIFT : 0;
  return (
    <G transform={`translate(${d.x} ${d.y})`}>
      <Circle r={RING_R_BREAKER} fill="none" stroke={color} strokeWidth={RING_STROKE_BREAKER} />
      <Line
        x1={-BREAKER_BAR_HALF}
        y1={0}
        x2={BREAKER_BAR_HALF}
        y2={openTipY}
        stroke={color}
        strokeWidth={RING_STROKE_BREAKER}
        strokeLinecap="round"
      />
    </G>
  );
}

export function Inverter({ d, color }: DecorationProps): React.ReactElement {
  return (
    <G transform={`translate(${d.x} ${d.y})`}>
      <Circle r={RING_R_INVERTER} fill="none" stroke={color} strokeWidth={RING_STROKE_INVERTER} />
      <SvgText
        y={INVERTER_GLYPH_BASELINE_Y}
        textAnchor="middle"
        fill={color}
        fontSize={INVERTER_GLYPH_FONT_PX}
        fontWeight="700"
      >
        ~
      </SvgText>
    </G>
  );
}

export function DecorationByKind({ d, color }: DecorationProps): React.ReactElement {
  return match(d)
    .with({ kind: "breaker" }, (deco) => <Breaker d={deco} color={color} />)
    .with({ kind: "inverter" }, (deco) => <Inverter d={deco} color={color} />)
    .exhaustive();
}
