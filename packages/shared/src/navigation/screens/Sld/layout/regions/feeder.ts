/**
 * One grid container below its switchgear: transformer glyph, LV board,
 * the board's LV bus, and the compute modules on it. Compute always draws
 * power, so every conductor here animates load-ward (flowSource null).
 */

import type { TopologyViewType } from "../../../../../data/topology/topology.schema";
import {
  BUS_OVERSHOOT_PX,
  NODE_H,
  NODE_W_COMPUTE,
  NODE_W_MODULE,
  XFMR_HALF_H,
  Y_BOARD,
  Y_BRANCH,
  Y_LOAD,
  Y_LV_BUS,
  Y_XFMR,
} from "../constants";
import { dropParticle, nodeFor } from "../geometry";
import type { Feeder } from "../classify";
import type { SldConductor, SldDecoration, SldNode } from "../types";
import type { PlacedBranch, RegionOutput } from "./types";

const FEED_PARTICLE_DUR_SEC = 2;

function loadDrop(id: string, x: number, y1: number, y2: number): SldConductor {
  return { id, x1: x, y1, x2: x, y2, kind: "drop", flowSource: null, particles: dropParticle(FEED_PARTICLE_DUR_SEC) };
}

/** Switchgear → (transformer) → board, as one or two drops. */
function mvToLv(p: PlacedBranch<Feeder>): { conductors: SldConductor[]; decorations: SldDecoration[] } {
  const { switchgear, transformer } = p.branch;
  const top = Y_BRANCH + NODE_H / 2;
  const boardTop = Y_BOARD - NODE_H / 2;
  if (!transformer) {
    return { conductors: [loadDrop(`feeder_${switchgear.device_id}`, p.x, top, boardTop)], decorations: [] };
  }
  return {
    conductors: [
      loadDrop(`xfmr_hv_${transformer.device_id}`, p.x, top, Y_XFMR - XFMR_HALF_H),
      loadDrop(`xfmr_lv_${transformer.device_id}`, p.x, Y_XFMR + XFMR_HALF_H, boardTop),
    ],
    decorations: [{ id: transformer.device_id, kind: "transformer", x: p.x, y: Y_XFMR }],
  };
}

export function placeFeeder(view: TopologyViewType, p: PlacedBranch<Feeder>): RegionOutput {
  const { board, lvBus, loads } = p.branch;
  if (!board) return { nodes: [], conductors: [], decorations: [] };
  const mv = mvToLv(p);
  const boardNode = nodeFor(view, board, { x: p.x, y: Y_BOARD, width: NODE_W_MODULE, height: NODE_H });
  if (!lvBus || loads.length === 0) return { nodes: [boardNode], ...mv };

  const bus: SldConductor = {
    id: lvBus.bus_id,
    x1: Math.min(...p.xs) - BUS_OVERSHOOT_PX,
    y1: Y_LV_BUS,
    x2: Math.max(...p.xs) + BUS_OVERSHOOT_PX,
    y2: Y_LV_BUS,
    kind: "ac",
    flowSource: null,
    particles: [],
  };
  const loadNodes: SldNode[] = loads.map((d, i) =>
    nodeFor(view, d, { x: p.xs[i]!, y: Y_LOAD, width: NODE_W_COMPUTE, height: NODE_H }),
  );
  return {
    nodes: [boardNode, ...loadNodes],
    conductors: [
      ...mv.conductors,
      loadDrop(`board_drop_${board.device_id}`, p.x, Y_BOARD + NODE_H / 2, Y_LV_BUS),
      bus,
      ...loads.map((d, i) => loadDrop(`lv_drop_${d.device_id}`, p.xs[i]!, Y_LV_BUS, Y_LOAD - NODE_H / 2)),
    ],
    decorations: mv.decorations,
  };
}
