/**
 * Site MV bus + each branch's node (switchgear / battery pad) and the drop
 * from the bus to it. The bus itself stays still: per-branch direction isn't
 * measured, so only the POI drops and the load side carry particles.
 */

import { match } from "ts-pattern";
import type { TopologyViewType, BusType } from "../../../../../data/topology/topology.schema";
import { BUS_OVERSHOOT_PX, NODE_H, NODE_W_MODULE, Y_BRANCH, Y_SITE_BUS } from "../constants";
import { dropParticle, nodeFor } from "../geometry";
import type { SldDevice } from "../classify";
import type { SldConductor } from "../types";
import type { PlacedBranch, RegionOutput, ViewportMetrics } from "./types";

const SITE_DROP_PARTICLE_DUR_SEC = 2;

function branchDevice(p: PlacedBranch): SldDevice {
  return match(p.branch)
    .with({ kind: "feeder" }, (b) => b.switchgear)
    .with({ kind: "storage" }, (b) => b.module)
    .exhaustive();
}

function siteDrop(p: PlacedBranch, device: SldDevice): SldConductor {
  // Reason: compute always draws, so a feeder drop runs load-ward. A battery
  // pad charges or discharges and nothing reports which — leave it still.
  const particles = p.branch.kind === "feeder" ? dropParticle(SITE_DROP_PARTICLE_DUR_SEC) : [];
  return {
    id: `site_drop_${device.device_id}`,
    x1: p.x,
    y1: Y_SITE_BUS,
    x2: p.x,
    y2: Y_BRANCH - NODE_H / 2,
    kind: "drop",
    flowSource: null,
    particles,
  };
}

export function placeSiteBus(
  view: TopologyViewType,
  siteBus: BusType,
  placed: PlacedBranch[],
  ctx: ViewportMetrics,
): RegionOutput {
  const xs = placed.map((p) => p.x);
  const bus: SldConductor = {
    id: siteBus.bus_id,
    x1: Math.min(...xs, ctx.midX) - BUS_OVERSHOOT_PX,
    y1: Y_SITE_BUS,
    x2: Math.max(...xs, ctx.midX) + BUS_OVERSHOOT_PX,
    y2: Y_SITE_BUS,
    kind: "ac",
    flowSource: null,
    particles: [],
  };
  const devices = placed.map(branchDevice);
  return {
    nodes: placed.map((p, i) =>
      nodeFor(view, devices[i]!, { x: p.x, y: Y_BRANCH, width: NODE_W_MODULE, height: NODE_H }),
    ),
    conductors: [bus, ...placed.map((p, i) => siteDrop(p, devices[i]!))],
    decorations: [],
  };
}
