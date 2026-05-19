/**
 * AC band: AC bus path, the half-bus segments that flow OUT from the POI
 * tap (left toward grid module, right toward compute load), and the AC
 * modules with their drops.
 */

import {
  BUS_OVERSHOOT_PX,
  COLUMN_PITCH,
  COMPUTE_MODULE_TEMPLATE,
  GRID_MODULE_TEMPLATE,
  Y_AC_BUS,
  Y_AC_MODULE,
} from "../constants";
import { busParticles, dropParticle, nodeHeightFor, nodeWidthFor } from "../geometry";
import type { ClassifiedDevices } from "../classify";
import type { SldConductor } from "../types";
import type { ViewportMetrics, RegionOutput, AcAnchor } from "./types";

const AC_BUS_PARTICLE_DUR_SEC = 3.5;
const AC_DROP_PARTICLE_DUR_SEC = 2;

interface AcRegionOutput {
  output: RegionOutput;
  anchor: AcAnchor;
}

/**
 * Compute X positions for AC bus members; identify gridX if present.
 */
function buildAcAnchor(classified: ClassifiedDevices, ctx: ViewportMetrics): AcAnchor {
  const { acMembers } = classified;
  if (acMembers.length === 0) return { acXs: [], gridX: null };
  const acStart = ctx.midX - ((acMembers.length - 1) * COLUMN_PITCH) / 2;
  const acXs = acMembers.map((_, i) => acStart + i * COLUMN_PITCH);
  const gridIdx = acMembers.findIndex((d) => d.template === GRID_MODULE_TEMPLATE);
  const gridX = gridIdx >= 0 ? acXs[gridIdx] ?? null : null;
  return { acXs, gridX };
}

/**
 * Build the AC bus spanning all members + the half-bus particle segments.
 */
function placeAcBus(anchor: AcAnchor, ctx: ViewportMetrics): RegionOutput {
  const { acXs } = anchor;
  if (acXs.length === 0) return { nodes: [], conductors: [], decorations: [] };
  const acMinX = Math.min(...acXs, ctx.midX) - BUS_OVERSHOOT_PX;
  const acMaxX = Math.max(...acXs, ctx.midX) + BUS_OVERSHOOT_PX;
  const conductors: SldConductor[] = [
    {
      id: "ac_bus_1",
      x1: acMinX,
      y1: Y_AC_BUS,
      x2: acMaxX,
      y2: Y_AC_BUS,
      kind: "ac",
      flowSource: null,
      particles: [],
    },
  ];
  if (acXs.length >= 2) {
    const left = Math.min(...acXs);
    const right = Math.max(...acXs);
    if (left < ctx.midX) {
      conductors.push({
        id: "ac_bus_left",
        x1: ctx.midX,
        y1: Y_AC_BUS,
        x2: left,
        y2: Y_AC_BUS,
        kind: "ac" as const,
        flowSource: { kind: "envelope" as const },
        particles: busParticles(AC_BUS_PARTICLE_DUR_SEC),
      });
    }
    if (right > ctx.midX) {
      conductors.push({
        id: "ac_bus_right",
        x1: ctx.midX,
        y1: Y_AC_BUS,
        x2: right,
        y2: Y_AC_BUS,
        kind: "ac" as const,
        flowSource: null,
        particles: busParticles(AC_BUS_PARTICLE_DUR_SEC),
      });
    }
  }
  return { nodes: [], conductors, decorations: [] };
}

/**
 * Place AC modules (nodes) + their drop conductors from the bus.
 */
function placeAcModules(classified: ClassifiedDevices, anchor: AcAnchor): RegionOutput {
  const { acMembers } = classified;
  const nodes = acMembers.map((device, i) => ({
    id: device.device_id,
    template: device.template,
    kind: "module" as const,
    role: null,
    displayName: device.display_name ?? device.device_id,
    x: anchor.acXs[i] ?? 0,
    y: Y_AC_MODULE,
    width: nodeWidthFor(device.template, null),
    height: nodeHeightFor(null, device.template),
  }));
  const conductors = acMembers.map((device, i) => {
    const x = anchor.acXs[i] ?? 0;
    const isLoadSide = device.template === COMPUTE_MODULE_TEMPLATE;
    return {
      id: `ac_drop_${device.device_id}`,
      x1: x,
      y1: Y_AC_BUS,
      x2: x,
      y2: Y_AC_MODULE - nodeHeightFor(null, device.template) / 2,
      kind: "drop" as const,
      flowSource: isLoadSide ? null : ({ kind: "envelope" as const }),
      particles: dropParticle(AC_DROP_PARTICLE_DUR_SEC),
    };
  });
  return { nodes, conductors, decorations: [] };
}

/**
 * Lay out the entire AC band — bus, halves, and modules. Returns the anchor
 * so downstream regions (DC, children) can reference it.
 */
export function placeAcBand(
  classified: ClassifiedDevices,
  ctx: ViewportMetrics,
): AcRegionOutput {
  const anchor = buildAcAnchor(classified, ctx);
  const busOutput = placeAcBus(anchor, ctx);
  const moduleOutput = placeAcModules(classified, anchor);
  return {
    anchor,
    output: {
      nodes: moduleOutput.nodes,
      conductors: [...busOutput.conductors, ...moduleOutput.conductors],
      decorations: [],
    },
  };
}
