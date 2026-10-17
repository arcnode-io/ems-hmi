/**
 * Battery pad contents (battery, PCS) under the pad. Dashed info links:
 * this is parentage, not a modelled conductor.
 */

import type { TopologyViewType } from "../../../../../data/topology/topology.schema";
import { NODE_H, NODE_H_CHILD, NODE_W_CHILD, Y_BRANCH, Y_CHILD } from "../constants";
import { nodeFor } from "../geometry";
import type { Storage } from "../classify";
import type { PlacedBranch, RegionOutput } from "./types";

export function placeStorage(view: TopologyViewType, p: PlacedBranch<Storage>): RegionOutput {
  const { children } = p.branch;
  return {
    nodes: children.map((c, i) =>
      nodeFor(view, c, { x: p.xs[i]!, y: Y_CHILD, width: NODE_W_CHILD, height: NODE_H_CHILD }),
    ),
    conductors: children.map((c, i) => ({
      id: `child_drop_${c.device_id}`,
      x1: p.x,
      y1: Y_BRANCH + NODE_H / 2,
      x2: p.xs[i]!,
      y2: Y_CHILD - NODE_H_CHILD / 2,
      points: [
        { x: p.x, y: (Y_BRANCH + NODE_H / 2 + Y_CHILD - NODE_H_CHILD / 2) / 2 },
        { x: p.xs[i]!, y: (Y_BRANCH + NODE_H / 2 + Y_CHILD - NODE_H_CHILD / 2) / 2 },
      ],
      kind: "info" as const,
      flowSource: null,
      particles: [],
      dashed: true,
    })),
    decorations: [],
  };
}
