/**
 * POI revenue meter + main breaker, and the POI → AC-bus drop split around
 * it. POI is the topmost node in the diagram — no utility-feed row above
 * it; ArcNode has no visibility into DOE/DLR on the real system (utility
 * interconnect is IEEE 2030.5, see ~/arcnode/ems/readme.md). Removed
 * 2026-09-23.
 */

import {
  NODE_H_POI,
  NODE_W_POI,
  RING_RADIUS_BREAKER,
  Y_AC_BUS,
  Y_BREAKER,
  Y_POI,
} from "../constants";
import { dropParticle } from "../geometry";
import type { ClassifiedDevices } from "../classify";
import type { ViewportMetrics, RegionOutput } from "./types";

const POI_DROP_DURATION_SEC = 3;
const POI_DROP_BOTTOM_OFFSET_SEC = -POI_DROP_DURATION_SEC / 2;

export function placePoiAndBreaker(
  classified: ClassifiedDevices,
  ctx: ViewportMetrics,
): RegionOutput {
  const { poi } = classified;
  if (!poi) return { nodes: [], conductors: [], decorations: [] };

  const poiNode = {
    id: poi.device_id,
    template: poi.template,
    kind: "leaf" as const,
    role: "poi" as const,
    displayName: poi.display_name ?? poi.device_id,
    x: ctx.midX,
    y: Y_POI,
    width: NODE_W_POI,
    height: NODE_H_POI,
  };

  const poiBottomY = Y_POI + NODE_H_POI / 2;
  const dropTop = {
    id: "poi_drop_top",
    x1: ctx.midX,
    y1: poiBottomY,
    x2: ctx.midX,
    y2: Y_BREAKER - RING_RADIUS_BREAKER,
    kind: "drop" as const,
    flowSource: { kind: "poi" as const },
    particles: dropParticle(POI_DROP_DURATION_SEC),
  };
  const dropBot = {
    id: "poi_drop_bot",
    x1: ctx.midX,
    y1: Y_BREAKER + RING_RADIUS_BREAKER,
    x2: ctx.midX,
    y2: Y_AC_BUS,
    kind: "drop" as const,
    flowSource: { kind: "poi" as const },
    particles: dropParticle(POI_DROP_DURATION_SEC, POI_DROP_BOTTOM_OFFSET_SEC),
  };

  return {
    nodes: [poiNode],
    conductors: [dropTop, dropBot],
    decorations: [
      { id: "main_breaker", kind: "breaker", x: ctx.midX, y: Y_BREAKER, state: "closed" },
    ],
  };
}
