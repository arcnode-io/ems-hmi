/**
 * Shared types for region placement helpers — each returns a slice of
 * positioned nodes / conductors / decorations that the orchestrator merges.
 */

import type { SldConductor, SldDecoration, SldNode } from "../types";
import type { ClassifiedDevice } from "../classify";

export interface RegionOutput {
  nodes: SldNode[];
  conductors: SldConductor[];
  decorations: SldDecoration[];
}

export const EMPTY_OUTPUT: RegionOutput = {
  nodes: [],
  conductors: [],
  decorations: [],
};

/**
 * Combine multiple region outputs into one — used by the orchestrator.
 */
export function mergeRegions(...outputs: RegionOutput[]): RegionOutput {
  return outputs.reduce(
    (acc, out) => ({
      nodes: acc.nodes.concat(out.nodes),
      conductors: acc.conductors.concat(out.conductors),
      decorations: acc.decorations.concat(out.decorations),
    }),
    EMPTY_OUTPUT,
  );
}

/** Computed once after AC member placement; reused by DC + children regions. */
export interface AcAnchor {
  /** X positions of every AC bus member, aligned with `acMembers`. */
  acXs: number[];
  /** X of the grid_module device when present (where inverter taps in). */
  gridX: number | null;
}

/** Common viewport metrics passed to every region. */
export interface ViewportMetrics {
  width: number;
  midX: number;
}

/** Convenience bundle handed to AC-band-dependent regions. */
export interface AcContext extends ViewportMetrics {
  acMembers: ClassifiedDevice[];
  anchor: AcAnchor;
}
