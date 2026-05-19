/**
 * Top of the canvas: utility-feed leaves, POI revenue meter, dotted info
 * conductors between them, and the POI → AC-bus drop split around the
 * main breaker.
 */

import {
  NODE_H,
  NODE_H_POI,
  NODE_W_POI,
  RING_RADIUS_BREAKER,
  UTILITY_HALF_SPAN_PER_COL,
  Y_AC_BUS,
  Y_BREAKER,
  Y_POI,
  Y_UTILITY,
} from "../constants";
import { dropParticle, nodeHeightFor, nodeWidthFor, spreadX } from "../geometry";
import type { ClassifiedDevices } from "../classify";
import type { ViewportMetrics, RegionOutput } from "./types";
import type { DeviceRole } from "../types";

const POI_DROP_DURATION_SEC = 3;
const POI_DROP_BOTTOM_OFFSET_SEC = -POI_DROP_DURATION_SEC / 2;

function roleForUtilityFeed(template: string): DeviceRole {
  return template === "line_rating" ? "dlr-badge" : null;
}

interface UtilityRowOutput {
  output: RegionOutput;
  /** X positions of utility feeds, aligned with classified.utilityFeeds. */
  utilXs: number[];
}

export function placeUtilityRow(
  classified: ClassifiedDevices,
  cols: number,
  ctx: ViewportMetrics,
): UtilityRowOutput {
  const halfSpan = cols * UTILITY_HALF_SPAN_PER_COL;
  const utilXs = spreadX(classified.utilityFeeds.length, ctx.midX - halfSpan, ctx.midX + halfSpan);
  const nodes = classified.utilityFeeds.map((device, index) => {
    const role = roleForUtilityFeed(device.template);
    return {
      id: device.device_id,
      template: device.template,
      kind: "leaf" as const,
      role,
      displayName: device.display_name ?? device.device_id,
      x: utilXs[index] ?? 0,
      y: Y_UTILITY,
      width: nodeWidthFor(device.template, role),
      height: nodeHeightFor(role, device.template),
    };
  });
  return { output: { nodes, conductors: [], decorations: [] }, utilXs };
}

export function placePoiAndBreaker(
  classified: ClassifiedDevices,
  utilXs: number[],
  ctx: ViewportMetrics,
): RegionOutput {
  const { poi, utilityFeeds } = classified;
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

  const utilityBottomY = Y_UTILITY + NODE_H / 2;
  const poiTopY = Y_POI - NODE_H_POI / 2;
  const infoBendY = (utilityBottomY + poiTopY) / 2;
  const infoConductors = utilityFeeds.map((device, index) => {
    const ux = utilXs[index] ?? ctx.midX;
    return {
      id: `info_${device.device_id}`,
      x1: ux,
      y1: utilityBottomY,
      x2: ctx.midX,
      y2: poiTopY,
      points: [
        { x: ux, y: infoBendY },
        { x: ctx.midX, y: infoBendY },
      ],
      kind: "info" as const,
      flowSource: null,
      particles: [],
      dashed: true,
    };
  });

  const poiBottomY = Y_POI + NODE_H_POI / 2;
  const dropTop = {
    id: "poi_drop_top",
    x1: ctx.midX,
    y1: poiBottomY,
    x2: ctx.midX,
    y2: Y_BREAKER - RING_RADIUS_BREAKER,
    kind: "drop" as const,
    flowSource: { kind: "envelope" as const },
    particles: dropParticle(POI_DROP_DURATION_SEC),
  };
  const dropBot = {
    id: "poi_drop_bot",
    x1: ctx.midX,
    y1: Y_BREAKER + RING_RADIUS_BREAKER,
    x2: ctx.midX,
    y2: Y_AC_BUS,
    kind: "drop" as const,
    flowSource: { kind: "envelope" as const },
    particles: dropParticle(POI_DROP_DURATION_SEC, POI_DROP_BOTTOM_OFFSET_SEC),
  };

  return {
    nodes: [poiNode],
    conductors: [...infoConductors, dropTop, dropBot],
    decorations: [
      { id: "main_breaker", kind: "breaker", x: ctx.midX, y: Y_BREAKER, state: "closed" },
    ],
  };
}
