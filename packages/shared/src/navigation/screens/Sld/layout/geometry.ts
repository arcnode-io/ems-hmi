/** Geometry helpers: particle factory + device → positioned node. */

import type { TopologyViewType } from "../../../../data/topology/topology.schema";
import type { SldDevice } from "./classify";
import type { DeviceRole, ParticleSpec, SldNode } from "./types";

const DROP_PARTICLE_RADIUS = 2;

export function dropParticle(durationSec: number, beginOffsetSec = 0): ParticleSpec[] {
  return [{ durationSec, beginOffsetSec, radius: DROP_PARTICLE_RADIUS }];
}

export interface NodeSpot {
  x: number;
  y: number;
  width: number;
  height: number;
  role?: DeviceRole;
}

/** Position a device; `kind` comes from its template (module vs leaf). */
export function nodeFor(view: TopologyViewType, device: SldDevice, spot: NodeSpot): SldNode {
  return {
    id: device.device_id,
    template: device.template,
    kind: view.templates_used[device.template]?.kind ?? "leaf",
    role: spot.role ?? null,
    displayName: device.display_name ?? device.device_id,
    x: spot.x,
    y: spot.y,
    width: spot.width,
    height: spot.height,
  };
}
