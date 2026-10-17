/**
 * Breaker + transformer glyphs via react-native-svg primitives.
 */

import React from "react";
import { match } from "ts-pattern";
import { Circle, G, Line } from "react-native-svg";
import type { SldDecoration } from "./types";
import {
  BREAKER_BAR_HALF,
  BREAKER_OPEN_LIFT,
  RING_R_BREAKER,
  RING_R_XFMR,
  STROKE_DROP,
  XFMR_RING_OFFSET,
} from "./renderConstants";

const RING_STROKE_BREAKER = STROKE_DROP;
const RING_STROKE_XFMR = STROKE_DROP;

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

/** Two stacked windings — the design handoff's XfmrSymbol. */
export function Transformer({ d, color }: DecorationProps): React.ReactElement {
  return (
    <G transform={`translate(${d.x} ${d.y})`}>
      <Circle cy={-XFMR_RING_OFFSET} r={RING_R_XFMR} fill="none" stroke={color} strokeWidth={RING_STROKE_XFMR} />
      <Circle cy={XFMR_RING_OFFSET} r={RING_R_XFMR} fill="none" stroke={color} strokeWidth={RING_STROKE_XFMR} />
    </G>
  );
}

export function DecorationByKind({ d, color }: DecorationProps): React.ReactElement {
  return match(d)
    .with({ kind: "breaker" }, (deco) => <Breaker d={deco} color={color} />)
    .with({ kind: "transformer" }, (deco) => <Transformer d={deco} color={color} />)
    .exhaustive();
}
