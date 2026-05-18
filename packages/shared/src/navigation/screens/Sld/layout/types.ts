/**
 * SLD layout types. Pure-data shape produced by `layoutSld(topology)` and
 * consumed by `<SldRenderer>`. No React, no SVG strings — coordinates and
 * semantic tags only, so it's trivially testable.
 */

export type FlowSource =
  /** POI net flow (envelope.direction). Reverses on EXP. */
  | { kind: "envelope" }
  /** Sign of a specific measurement on a specific device. Negative = reverse. */
  | { kind: "device"; deviceId: string; measurement: string };

export type ConductorKind = "ac" | "dc" | "drop" | "info";

export interface ParticleSpec {
  /** Animation cycle length, seconds. */
  durationSec: number;
  /** Negative offset to stagger multiple particles on the same path. */
  beginOffsetSec: number;
  /** Visual radius in user-space units. */
  radius: number;
}

export interface SldConductor {
  id: string;
  /** Endpoint coords. Renderer assembles "M x1 y1 L x2 y2" — used by every
   *  conductor that carries particles, since direction reversal only handles
   *  two-point lines. */
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Optional intermediate vertices for an orthogonal polyline routed as
   *  M x1 y1 L points[0].x points[0].y ... L x2 y2. Only used by info /
   *  dashed conductors (no particle direction reversal needed). */
  points?: Array<{ x: number; y: number }>;
  kind: ConductorKind;
  /** Source of direction flip; null = particles stay authored (load-side or info). */
  flowSource: FlowSource | null;
  /** Zero or more animated dots along this conductor. */
  particles: ParticleSpec[];
  /** Soft information conductors render dashed (parent→child, utility info). */
  dashed?: boolean;
}

export type DecorationKind = "breaker" | "inverter";

export interface SldDecoration {
  id: string;
  kind: DecorationKind;
  x: number;
  y: number;
  /** Breaker only — open vs closed glyph. Default closed. */
  state?: "closed" | "open";
}

export type DeviceRole = "poi" | "dlr-badge" | null;

export interface SldNode {
  id: string;
  template: string;
  kind: "module" | "leaf";
  role: DeviceRole;
  displayName: string;
  /** Center coordinates. */
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SldLayout {
  width: number;
  height: number;
  nodes: SldNode[];
  conductors: SldConductor[];
  decorations: SldDecoration[];
}
