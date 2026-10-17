/**
 * Shared types for region placement helpers — each returns a slice of
 * positioned nodes / conductors / decorations that the orchestrator merges.
 */

import type { SldConductor, SldDecoration, SldNode } from "../types";
import type { Branch } from "../classify";

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

/** Common viewport metrics passed to every region. */
export interface ViewportMetrics {
  width: number;
  midX: number;
}

/** A site-bus branch with the columns it owns (one per load / child). */
export interface PlacedBranch<B extends Branch = Branch> {
  branch: B;
  /** Column center Xs, left→right. */
  xs: number[];
  /** Branch node X — centered over its columns. */
  x: number;
}
