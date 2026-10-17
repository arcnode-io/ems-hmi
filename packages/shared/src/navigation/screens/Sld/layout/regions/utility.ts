/**
 * POI meter + main breaker, and the POI → site-bus drop split around
 * it. POI is the topmost node, feeding the site bus.
 */

import {
  NODE_H_POI,
  NODE_W_POI,
  RING_RADIUS_BREAKER,
  Y_SITE_BUS,
  Y_BREAKER,
  Y_POI,
} from "../constants";
import { dropParticle } from "../geometry";
import type { SldPlan } from "../classify";
import type { ViewportMetrics, RegionOutput } from "./types";

const POI_DROP_DURATION_SEC = 3;
const POI_DROP_BOTTOM_OFFSET_SEC = -POI_DROP_DURATION_SEC / 2;

export function placePoiAndBreaker(
  plan: SldPlan,
  ctx: ViewportMetrics,
): RegionOutput {
  const { poi } = plan;
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
    y2: Y_SITE_BUS,
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
