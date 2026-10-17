/**
 * One grid container below its switchgear, straight from its buses: the
 * feeder bus (relay hanging off it), transformer glyph, LV board, the LV
 * bus and the compute modules on it. A missing bus member ends the drawing
 * there. Compute always draws power, so every conductor here animates
 * load-ward (flowSource null).
 */

import type { TopologyViewType } from "../../../../../data/topology/topology.schema";
import {
  BUS_OVERSHOOT_PX,
  NODE_H,
  NODE_H_CHILD,
  NODE_W_CHILD,
  NODE_W_COMPUTE,
  NODE_W_MODULE,
  TAP_OFFSET_PX,
  XFMR_HALF_H,
  Y_BOARD,
  Y_BRANCH,
  Y_FEEDER_BUS,
  Y_LOAD,
  Y_LV_BUS,
  Y_XFMR,
} from "../constants";
import { dropParticle, nodeFor } from "../geometry";
import type { Feeder } from "../classify";
import type { SldConductor, SldNode } from "../types";
import { EMPTY_OUTPUT, mergeRegions, type PlacedBranch, type RegionOutput } from "./types";

const FEED_PARTICLE_DUR_SEC = 2;

function loadDrop(id: string, x: number, y1: number, y2: number): SldConductor {
  return { id, x1: x, y1, x2: x, y2, kind: "drop", flowSource: null, particles: dropParticle(FEED_PARTICLE_DUR_SEC) };
}

function hBus(id: string, x1: number, x2: number, y: number): SldConductor {
  return { id, x1, y1: y, x2, y2: y, kind: "ac", flowSource: null, particles: [] };
}

/** Switchgear → feeder bus, its relay taps and the transformer glyph. */
function placeFeederBus(view: TopologyViewType, p: PlacedBranch<Feeder>): RegionOutput {
  const { switchgear, feederBus, taps, transformer } = p.branch;
  if (!feederBus) return EMPTY_OUTPUT;
  const tapXs = taps.map((_, i) => p.x + TAP_OFFSET_PX * (i + 1));
  const xs = [p.x, ...tapXs];
  const tapTop = Y_XFMR - NODE_H_CHILD / 2;
  return {
    nodes: taps.map((d, i) => nodeFor(view, d, { x: tapXs[i]!, y: Y_XFMR, width: NODE_W_CHILD, height: NODE_H_CHILD })),
    conductors: [
      loadDrop(`feeder_${switchgear.device_id}`, p.x, Y_BRANCH + NODE_H / 2, Y_FEEDER_BUS),
      hBus(feederBus.bus_id, Math.min(...xs) - BUS_OVERSHOOT_PX / 2, Math.max(...xs) + BUS_OVERSHOOT_PX / 2, Y_FEEDER_BUS),
      ...taps.map((d, i) => loadDrop(`tap_${d.device_id}`, tapXs[i]!, Y_FEEDER_BUS, tapTop)),
      ...(transformer ? [loadDrop(`xfmr_hv_${transformer.device_id}`, p.x, Y_FEEDER_BUS, Y_XFMR - XFMR_HALF_H)] : []),
    ],
    decorations: transformer ? [{ id: transformer.device_id, kind: "transformer", x: p.x, y: Y_XFMR }] : [],
  };
}

/** Transformer → LV board → LV bus → compute. */
function placeLv(view: TopologyViewType, p: PlacedBranch<Feeder>): RegionOutput {
  const { transformer, board, lvBus, loads } = p.branch;
  if (!transformer || !lvBus || !board) return EMPTY_OUTPUT;
  const boardNode = nodeFor(view, board, { x: p.x, y: Y_BOARD, width: NODE_W_MODULE, height: NODE_H });
  const xfmrLv = loadDrop(`xfmr_lv_${transformer.device_id}`, p.x, Y_XFMR + XFMR_HALF_H, Y_BOARD - NODE_H / 2);
  if (loads.length === 0) return { nodes: [boardNode], conductors: [xfmrLv], decorations: [] };

  const loadNodes: SldNode[] = loads.map((d, i) =>
    nodeFor(view, d, { x: p.xs[i]!, y: Y_LOAD, width: NODE_W_COMPUTE, height: NODE_H }),
  );
  return {
    nodes: [boardNode, ...loadNodes],
    conductors: [
      xfmrLv,
      loadDrop(`board_drop_${board.device_id}`, p.x, Y_BOARD + NODE_H / 2, Y_LV_BUS),
      hBus(lvBus.bus_id, Math.min(...p.xs) - BUS_OVERSHOOT_PX, Math.max(...p.xs) + BUS_OVERSHOOT_PX, Y_LV_BUS),
      ...loads.map((d, i) => loadDrop(`lv_drop_${d.device_id}`, p.xs[i]!, Y_LV_BUS, Y_LOAD - NODE_H / 2)),
    ],
    decorations: [],
  };
}

export function placeFeeder(view: TopologyViewType, p: PlacedBranch<Feeder>): RegionOutput {
  return mergeRegions(placeFeederBus(view, p), placeLv(view, p));
}
