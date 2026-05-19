/**
 * ConductorPath + Particle subcomponents. Path direction for particles is
 * picked at render time based on `envelopeDirection`; no DOM post-edit.
 */

import React from "react";
import { match } from "ts-pattern";
import type { ParticleSpec, SldConductor } from "./types";
import {
  DASH_INFO,
  DROP_OPACITY,
  INFO_OPACITY,
  PARTICLE_OPACITY,
  STROKE_BUS,
  STROKE_DROP,
  STROKE_INFO,
} from "./renderConstants";

const AC_BUS_ID = "ac_bus_1";
const DC_BUS_ID = "dc_bus_1";

function pathBetween(c: SldConductor, reverse: boolean): string {
  if (c.points && c.points.length > 0) {
    const vertices = [{ x: c.x1, y: c.y1 }, ...c.points, { x: c.x2, y: c.y2 }];
    const ordered = reverse ? vertices.slice().reverse() : vertices;
    return ordered
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");
  }
  return reverse
    ? `M ${c.x2} ${c.y2} L ${c.x1} ${c.y1}`
    : `M ${c.x1} ${c.y1} L ${c.x2} ${c.y2}`;
}

interface ParticleProps {
  conductor: SldConductor;
  spec: ParticleSpec;
  envelopeDirection: "IMP" | "EXP" | null;
}

export function Particle({ conductor, spec, envelopeDirection }: ParticleProps): React.ReactElement {
  const reverse = conductor.flowSource?.kind === "envelope" && envelopeDirection === "EXP";
  return (
    <circle data-region="particle" r={spec.radius} fill="currentColor" opacity={PARTICLE_OPACITY}>
      <animateMotion
        dur={`${spec.durationSec}s`}
        begin={`${spec.beginOffsetSec}s`}
        repeatCount="indefinite"
        path={pathBetween(conductor, reverse)}
      />
    </circle>
  );
}

interface ConductorVisuals {
  strokeWidth: number;
  opacity: number;
  dasharray: string | undefined;
}

function visualsFor(c: SldConductor): ConductorVisuals {
  return match(c.kind)
    .with("info", () => ({
      strokeWidth: STROKE_INFO,
      opacity: c.dashed ? INFO_OPACITY : 1,
      dasharray: c.dashed ? DASH_INFO : undefined,
    }))
    .with("drop", () => ({
      strokeWidth: STROKE_DROP,
      opacity: DROP_OPACITY,
      dasharray: undefined,
    }))
    .with("ac", "dc", () => ({
      strokeWidth: STROKE_BUS,
      opacity: 1,
      dasharray: undefined,
    }))
    .exhaustive();
}

function isBusBackbone(c: SldConductor): boolean {
  return c.id === AC_BUS_ID || c.id === DC_BUS_ID;
}

export function ConductorPath({ c }: { c: SldConductor }): React.ReactElement {
  const d = pathBetween(c, false);
  const baseAttrs = { d, fill: "none", stroke: "currentColor" };
  if (isBusBackbone(c)) {
    return (
      <path
        {...baseAttrs}
        id={c.id}
        data-comp="bus"
        data-bus-type={c.id === AC_BUS_ID ? "ac" : "dc"}
      />
    );
  }
  const visuals = visualsFor(c);
  return (
    <path
      {...baseAttrs}
      strokeWidth={visuals.strokeWidth}
      strokeDasharray={visuals.dasharray}
      opacity={visuals.opacity}
    />
  );
}
