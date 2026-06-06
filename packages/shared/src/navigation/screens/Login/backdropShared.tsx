/**
 * backdropShared — constants + SMIL helpers shared by the two Heartbeat
 * backdrops. Separate from the HeartbeatBackdrop dispatcher so the backdrops
 * import these without a circular dependency.
 *
 * Pulse + twinkle animate via SMIL (web only; native renders static — same
 * trade as the SLD particles).
 */

import React from "react";
import { Circle, Line, Defs as RawDefs } from "react-native-svg";

// react-native-svg's web `Defs` typing omits `children` (lib gap) — it accepts
// them at runtime. One justified cast, re-exported so the backdrops stay clean.
export const Defs = RawDefs as unknown as React.ComponentType<{
  children: React.ReactNode;
}>;

export const BACKDROP_W = 800;
export const BACKDROP_H = 460;
export const HORIZON_Y = BACKDROP_H * 0.62;
export const PULSE_DUR = "7s";

/** Deterministic PRNG so stars / sketch marks don't reshuffle each render. */
export function makeRng(seed: number): () => number {
  let s = seed;
  return (): number => (s = (s * 9301 + 49297) % 233280) / 233280;
}

/** Raw SMIL element — react-native-svg-web passes it through to the DOM. */
function smil(
  tag: "animate" | "animateMotion",
  props: Record<string, string>,
): React.ReactElement {
  return React.createElement(tag, props);
}

/** A circle that twinkles its opacity (sovereign stars). */
export function Twinkle(props: {
  cx: number;
  cy: number;
  r: number;
  fill: string;
  dur: string;
  begin: string;
}): React.ReactElement {
  const { cx, cy, r, fill, dur, begin } = props;
  return React.createElement(
    Circle,
    { cx, cy, r, fill },
    smil("animate", {
      attributeName: "opacity",
      values: "0.3;0.85;0.3",
      keyTimes: "0;0.5;1",
      dur,
      begin,
      repeatCount: "indefinite",
    }),
  );
}

interface PulseDot {
  r: number;
  fill: string;
  opacity?: number;
}

/**
 * The three travelling pulse dots (glow + core + bright center). The path is a
 * flat horizontal line, so we animate `cx` directly — Firefox-safe (no mpath).
 */
export function PulseTrain({ dots }: { dots: PulseDot[] }): React.ReactElement {
  return (
    <>
      {dots.map((d, i) => (
        <React.Fragment key={i}>
          {React.createElement(
            Circle,
            { cx: -20, cy: HORIZON_Y, r: d.r, fill: d.fill, opacity: d.opacity },
            smil("animate", {
              attributeName: "cx",
              from: "-20",
              to: `${BACKDROP_W + 20}`,
              dur: PULSE_DUR,
              repeatCount: "indefinite",
            }),
          )}
        </React.Fragment>
      ))}
    </>
  );
}

/** The fading wake trailing the pulse (dashed line, animated offset). */
export function PulseWake(props: {
  stroke: string;
  strokeWidth: number;
  dasharray: string;
  from: string;
  opacity: number;
}): React.ReactElement {
  const { stroke, strokeWidth, dasharray, from, opacity } = props;
  return React.createElement(
    Line,
    {
      x1: -40,
      y1: HORIZON_Y,
      x2: BACKDROP_W + 40,
      y2: HORIZON_Y,
      stroke,
      strokeWidth,
      strokeLinecap: "round",
      strokeDasharray: dasharray,
      opacity,
    },
    smil("animate", {
      attributeName: "stroke-dashoffset",
      from,
      to: "0",
      dur: PULSE_DUR,
      repeatCount: "indefinite",
    }),
  );
}

