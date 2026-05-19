/**
 * ConductorPath + Particle via react-native-svg primitives. Particle uses
 * SVG <animateMotion> on web; on native the element renders but doesn't
 * animate (react-native-svg has no SMIL — follow-up to drive via rAF).
 */

import React from "react";
import { Platform } from "react-native";
import { match } from "ts-pattern";
import { Circle, Path } from "react-native-svg";
import type { ParticleSpec, SldConductor } from "./types";
import type { SldTheme } from "./SldRenderer";
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
const AC_BUS_DASH = "6,3";
const BUS_OPACITY = 0.55;

function pathBetween(c: SldConductor, reverse: boolean): string {
  if (c.points && c.points.length > 0) {
    const vertices = [{ x: c.x1, y: c.y1 }, ...c.points, { x: c.x2, y: c.y2 }];
    const ordered = reverse ? vertices.slice().reverse() : vertices;
    return ordered.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  }
  return reverse
    ? `M ${c.x2} ${c.y2} L ${c.x1} ${c.y1}`
    : `M ${c.x1} ${c.y1} L ${c.x2} ${c.y2}`;
}

interface ParticleProps {
  conductor: SldConductor;
  spec: ParticleSpec;
  envelopeDirection: "IMP" | "EXP" | null;
  color: string;
}

/**
 * Web ships SVG <animateMotion>; native renders a static dot at the path
 * origin until we drive motion via rAF.
 */
export function Particle({ conductor, spec, envelopeDirection, color }: ParticleProps): React.ReactElement {
  const reverse = conductor.flowSource?.kind === "envelope" && envelopeDirection === "EXP";
  const path = pathBetween(conductor, reverse);
  const origin = reverse ? { cx: conductor.x2, cy: conductor.y2 } : { cx: conductor.x1, cy: conductor.y1 };
  if (Platform.OS !== "web") {
    return (
      <Circle r={spec.radius} fill={color} opacity={PARTICLE_OPACITY} cx={origin.cx} cy={origin.cy} />
    );
  }
  // react-native-svg-web passes unknown props through to the DOM <circle>,
  // so animateMotion as a child is rendered as a real SMIL animation.
  return React.createElement(
    Circle,
    { r: spec.radius, fill: color, opacity: PARTICLE_OPACITY },
    React.createElement("animateMotion", {
      dur: `${spec.durationSec}s`,
      begin: `${spec.beginOffsetSec}s`,
      repeatCount: "indefinite",
      path,
    }),
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

interface ConductorPathProps {
  c: SldConductor;
  theme: SldTheme;
}

export function ConductorPath({ c, theme }: ConductorPathProps): React.ReactElement {
  const d = pathBetween(c, false);
  if (isBusBackbone(c)) {
    return (
      <Path
        d={d}
        fill="none"
        stroke={theme.textMid}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={c.id === AC_BUS_ID ? AC_BUS_DASH : undefined}
        opacity={BUS_OPACITY}
      />
    );
  }
  const v = visualsFor(c);
  return (
    <Path
      d={d}
      fill="none"
      stroke={theme.text}
      strokeWidth={v.strokeWidth}
      strokeDasharray={v.dasharray}
      opacity={v.opacity}
    />
  );
}
