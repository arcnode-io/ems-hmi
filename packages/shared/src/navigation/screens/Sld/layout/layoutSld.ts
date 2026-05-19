/**
 * layoutSld — pure layout orchestrator. Each band (utility row, POI +
 * breaker, AC band, DC band, module-children) is placed by a focused
 * helper in `./regions/`; this file only computes the viewport metrics
 * and merges region outputs.
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

/**
 * The widest band determines viewBox width. The DC band can extend past the
 * AC bus when there are many BESS modules; we account for that overhang via
 * the grid module's AC-bus index.
 */
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

/**
 * Lay out an SLD from a topology view.
 * @param view Parsed TopologyView (output of useTopologyView)
 * @returns SldLayout ready to render
 */
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
