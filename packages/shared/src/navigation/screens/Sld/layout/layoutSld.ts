/**
 * Pure layout orchestrator. Each band is placed by a helper in
 * `./regions/`; this file sizes the viewport and merges their outputs.
 */

import type { TopologyViewType } from "../../../../data/topology/topology.schema";
import type { SldLayout } from "./types";
import { classify, type ClassifiedDevices } from "./classify";
import {
  COLUMN_PITCH,
  GRID_MODULE_TEMPLATE,
  HEIGHT,
  MIN_COLS,
  MIN_WIDTH,
} from "./constants";
import { placeUtilityRow, placePoiAndBreaker } from "./regions/utility";
import { placeAcBand } from "./regions/ac";
import { placeDcBand } from "./regions/dc";
import { placeModuleChildren } from "./regions/children";
import { mergeRegions, type ViewportMetrics } from "./regions/types";

// Widest band sets the viewBox width. DC overhang past the AC bus shows up
// when there are many BESS modules anchored to the grid module's x.
function requiredColumns(classified: ClassifiedDevices): number {
  const { acMembers, dcMembers, utilityFeeds } = classified;
  const gridIdx = acMembers.findIndex((d) => d.template === GRID_MODULE_TEMPLATE);
  const dcOverhang =
    dcMembers.length > 0 && gridIdx >= 0 ? gridIdx + dcMembers.length + 1 : 0;
  return Math.max(acMembers.length, dcOverhang, utilityFeeds.length + 1, MIN_COLS);
}

function buildViewport(classified: ClassifiedDevices): {
  cols: number;
  metrics: ViewportMetrics;
} {
  const cols = requiredColumns(classified);
  const width = Math.max(MIN_WIDTH, cols * COLUMN_PITCH);
  return { cols, metrics: { width, midX: width / 2 } };
}

/** Lay out an SLD from a topology view. */
export function layoutSld(view: TopologyViewType): SldLayout {
  const classified = classify(view);
  const { cols, metrics } = buildViewport(classified);

  const utility = placeUtilityRow(classified, cols, metrics);
  const poi = placePoiAndBreaker(classified, utility.utilXs, metrics);
  const ac = placeAcBand(classified, metrics);
  const acContext = {
    ...metrics,
    acMembers: classified.acMembers,
    anchor: ac.anchor,
  };
  const dc = placeDcBand(classified, acContext);
  const children = placeModuleChildren(classified, acContext);

  const merged = mergeRegions(utility.output, poi, ac.output, dc, children);
  return {
    width: metrics.width,
    height: HEIGHT,
    nodes: merged.nodes,
    conductors: merged.conductors,
    decorations: merged.decorations,
  };
}
