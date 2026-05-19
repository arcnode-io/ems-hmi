/** Geometry helpers: x-spread, particle factories, node sizing. */

import { match } from "ts-pattern";
import type { DeviceRole } from "./types";
import type { ParticleSpec } from "./types";
import {
  CDU_TEMPLATE,
  COMPUTE_MODULE_TEMPLATE,
  NODE_H,
  NODE_H_CHILD,
  NODE_H_POI,
  NODE_W_CHILD,
  NODE_W_COMPUTE,
  NODE_W_DLR,
  NODE_W_LEAF,
  NODE_W_MODULE,
  NODE_W_POI,
  UTILITY_TEMPLATES,
} from "./constants";

const BUS_PARTICLE_COUNT = 3;
const BUS_PARTICLE_RADIUS = 2.5;
const DROP_PARTICLE_RADIUS = 2;

/** Center X of each item spread evenly across [minX, maxX]. */
export function spreadX(count: number, minX: number, maxX: number): number[] {
  if (count === 0) return [];
  if (count === 1) return [(minX + maxX) / 2];
  const step = (maxX - minX) / (count - 1);
  return Array.from({ length: count }, (_, i) => minX + i * step);
}

export function busParticles(durationSec: number): ParticleSpec[] {
  return Array.from({ length: BUS_PARTICLE_COUNT }, (_, i) => ({
    durationSec,
    beginOffsetSec: -(durationSec * i) / BUS_PARTICLE_COUNT,
    radius: BUS_PARTICLE_RADIUS,
  }));
}

export function dropParticle(durationSec: number, beginOffsetSec = 0): ParticleSpec[] {
  return [{ durationSec, beginOffsetSec, radius: DROP_PARTICLE_RADIUS }];
}

export function nodeWidthFor(template: string, role: DeviceRole): number {
  return match<{ template: string; role: DeviceRole }, number>({ template, role })
    .with({ role: "poi" }, () => NODE_W_POI)
    .with({ role: "dlr-badge" }, () => NODE_W_DLR)
    .with({ template: COMPUTE_MODULE_TEMPLATE }, () => NODE_W_COMPUTE)
    .with({ template: CDU_TEMPLATE }, () => NODE_W_CHILD)
    .when(({ template: tpl }) => UTILITY_TEMPLATES.has(tpl), () => NODE_W_LEAF)
    .otherwise(() => NODE_W_MODULE);
}

export function nodeHeightFor(role: DeviceRole, template: string): number {
  return match<{ role: DeviceRole; template: string }, number>({ role, template })
    .with({ role: "poi" }, () => NODE_H_POI)
    .with({ template: CDU_TEMPLATE }, () => NODE_H_CHILD)
    .otherwise(() => NODE_H);
}
