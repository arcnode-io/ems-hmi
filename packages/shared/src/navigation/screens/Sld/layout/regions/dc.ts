/**
 * DC band: inverter glyph between Grid Module and DC bus, the DC bus
 * spreading from gridX to the right viewBox edge, and BESS modules with
 * their drops.
 */

import {
  DC_LEFT_OFFSET_FROM_GRID,
  DC_RIGHT_MARGIN,
  NODE_H,
  NODE_W_MODULE,
  RING_RADIUS_INVERTER,
  Y_AC_MODULE,
  Y_DC_BUS,
  Y_DC_MODULE,
  Y_INVERTER,
} from "../constants";
import { busParticles, dropParticle, spreadX } from "../geometry";
import type { ClassifiedDevices } from "../classify";
import type { ViewportMetrics, RegionOutput, AcContext } from "./types";

const INVERTER_TOP_DROP_DUR_SEC = 2;
const INVERTER_BOT_DROP_DUR_SEC = 2.5;
const DC_BUS_PARTICLE_DUR_SEC = 7;
const DC_DROP_PARTICLE_DUR_SEC = 1.5;

function placeInverter(
  classified: ClassifiedDevices,
  acCtx: AcContext,
): RegionOutput {
  const { gridX } = acCtx.anchor;
  if (gridX === null || classified.dcMembers.length === 0) {
    return { nodes: [], conductors: [], decorations: [] };
  }
  return {
    nodes: [],
    conductors: [
      {
        id: "inverter_top",
        x1: gridX,
        y1: Y_AC_MODULE + NODE_H / 2,
        x2: gridX,
        y2: Y_INVERTER - RING_RADIUS_INVERTER,
        kind: "drop",
        flowSource: { kind: "envelope" },
        particles: dropParticle(INVERTER_TOP_DROP_DUR_SEC),
      },
      {
        id: "inverter_bot",
        x1: gridX,
        y1: Y_INVERTER + RING_RADIUS_INVERTER,
        x2: gridX,
        y2: Y_DC_BUS,
        kind: "drop",
        flowSource: { kind: "envelope" },
        particles: dropParticle(INVERTER_BOT_DROP_DUR_SEC),
      },
    ],
    decorations: [{ id: "main_inverter", kind: "inverter", x: gridX, y: Y_INVERTER }],
  };
}

/** Compute X positions for DC bus members spread between gridX and right margin. */
function buildDcXs(
  dcMemberCount: number,
  gridX: number | null,
  ctx: ViewportMetrics,
): number[] {
  if (dcMemberCount === 0) return [];
  const anchorX = gridX ?? ctx.midX;
  const leftX = anchorX + DC_LEFT_OFFSET_FROM_GRID;
  const rightX = ctx.width - DC_RIGHT_MARGIN;
  if (dcMemberCount === 1) return [(leftX + rightX) / 2];
  return spreadX(dcMemberCount, leftX, rightX);
}

function placeDcBusAndModules(
  classified: ClassifiedDevices,
  acCtx: AcContext,
): RegionOutput {
  const { dcMembers } = classified;
  if (dcMembers.length === 0) return { nodes: [], conductors: [], decorations: [] };

  const dcXs = buildDcXs(dcMembers.length, acCtx.anchor.gridX, acCtx);
  const dcStart = acCtx.anchor.gridX ?? acCtx.midX;
  const busConductor = {
    id: "dc_bus_1",
    x1: dcStart,
    y1: Y_DC_BUS,
    x2: Math.max(...dcXs),
    y2: Y_DC_BUS,
    kind: "dc" as const,
    flowSource: { kind: "envelope" as const },
    particles: busParticles(DC_BUS_PARTICLE_DUR_SEC),
  };
  const nodes = dcMembers.map((device, i) => ({
    id: device.device_id,
    template: device.template,
    kind: "module" as const,
    role: null,
    displayName: device.display_name ?? device.device_id,
    x: dcXs[i] ?? 0,
    y: Y_DC_MODULE,
    width: NODE_W_MODULE,
    height: NODE_H,
  }));
  const drops = dcMembers.map((device, i) => {
    const x = dcXs[i] ?? 0;
    return {
      id: `dc_drop_${device.device_id}`,
      x1: x,
      y1: Y_DC_BUS,
      x2: x,
      y2: Y_DC_MODULE - NODE_H / 2,
      kind: "drop" as const,
      flowSource: { kind: "envelope" as const },
      particles: dropParticle(DC_DROP_PARTICLE_DUR_SEC),
    };
  });
  return { nodes, conductors: [busConductor, ...drops], decorations: [] };
}

/**
 * Lay out inverter + DC bus + DC modules.
 */
export function placeDcBand(
  classified: ClassifiedDevices,
  acCtx: AcContext,
): RegionOutput {
  const inverter = placeInverter(classified, acCtx);
  const bus = placeDcBusAndModules(classified, acCtx);
  return {
    nodes: [...inverter.nodes, ...bus.nodes],
    conductors: [...inverter.conductors, ...bus.conductors],
    decorations: [...inverter.decorations, ...bus.decorations],
  };
}
