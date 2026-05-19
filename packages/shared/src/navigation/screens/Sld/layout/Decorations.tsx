/**
 * Breaker + Inverter glyph subcomponents. Extracted so SldRenderer reads
 * as a flat orchestrator.
 */

import React from "react";
import { match } from "ts-pattern";
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

export function Breaker({ d }: { d: SldDecoration }): React.ReactElement {
  return (
    <g data-comp="breaker" transform={`translate(${d.x} ${d.y})`}>
      <circle
        data-region="ring"
        cx={0}
        cy={0}
        r={RING_R_BREAKER}
        fill="none"
        stroke="currentColor"
        strokeWidth={RING_STROKE_BREAKER}
      />
      {d.state === "open" ? (
        <line
          x1={-BREAKER_BAR_HALF}
          y1={0}
          x2={BREAKER_BAR_HALF}
          y2={-BREAKER_OPEN_LIFT}
          stroke="currentColor"
          strokeWidth={RING_STROKE_BREAKER}
          strokeLinecap="round"
        />
      ) : (
        <line
          x1={-BREAKER_BAR_HALF}
          y1={0}
          x2={BREAKER_BAR_HALF}
          y2={0}
          stroke="currentColor"
          strokeWidth={RING_STROKE_BREAKER}
          strokeLinecap="round"
        />
      )}
    </g>
  );
}

export function Inverter({ d }: { d: SldDecoration }): React.ReactElement {
  return (
    <g data-comp="inverter" transform={`translate(${d.x} ${d.y})`}>
      <circle
        data-region="ring"
        cx={0}
        cy={0}
        r={RING_R_INVERTER}
        fill="none"
        stroke="currentColor"
        strokeWidth={RING_STROKE_INVERTER}
      />
      <text
        data-region="glyph"
        x={0}
        y={INVERTER_GLYPH_BASELINE_Y}
        textAnchor="middle"
        fill="currentColor"
        fontSize={INVERTER_GLYPH_FONT_PX}
        fontWeight={700}
      >
        ~
      </text>
    </g>
  );
}

/** Render any decoration via its discriminator. */
export function DecorationByKind({ d }: { d: SldDecoration }): React.ReactElement {
  return match(d)
    .with({ kind: "breaker" }, (deco) => <Breaker d={deco} />)
    .with({ kind: "inverter" }, (deco) => <Inverter d={deco} />)
    .exhaustive();
}

