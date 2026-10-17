/**
 * Pure layout orchestrator. Gives each site-bus branch one column per load
 * (feeder) or child (battery pad), left→right in bus order, then merges the
 * region helpers' outputs.
 */

import { match } from "ts-pattern";
import type { TopologyViewType } from "../../../../data/topology/topology.schema";
import type { SldLayout } from "./types";
import { planSld, type Branch } from "./classify";
import { COLUMN_PITCH, HEIGHT, MIN_WIDTH } from "./constants";
import { placePoiAndBreaker } from "./regions/utility";
import { placeSiteBus } from "./regions/site";
import { placeFeeder } from "./regions/feeder";
import { placeStorage } from "./regions/storage";
import { mergeRegions, EMPTY_OUTPUT, type PlacedBranch, type RegionOutput } from "./regions/types";

function columnsOf(branch: Branch): number {
  const leaves = branch.kind === "feeder" ? branch.loads.length : branch.children.length;
  return Math.max(1, leaves);
}

/** Lay columns out centered in `width`, starting at the left edge of the band. */
function placeBranches(branches: Branch[], width: number, totalCols: number): PlacedBranch[] {
  let col = 0;
  const left = (width - totalCols * COLUMN_PITCH) / 2 + COLUMN_PITCH / 2;
  return branches.map((branch) => {
    const n = columnsOf(branch);
    const xs = Array.from({ length: n }, (_, i) => left + (col + i) * COLUMN_PITCH);
    col += n;
    return { branch, xs, x: (xs[0]! + xs[n - 1]!) / 2 };
  });
}

function placeBranch(view: TopologyViewType, p: PlacedBranch): RegionOutput {
  return match(p.branch)
    .with({ kind: "feeder" }, (branch) => placeFeeder(view, { ...p, branch }))
    .with({ kind: "storage" }, (branch) => placeStorage(view, { ...p, branch }))
    .exhaustive();
}

/** Lay out an SLD from a topology view. */
export function layoutSld(view: TopologyViewType): SldLayout {
  const plan = planSld(view);
  const totalCols = plan.branches.reduce((sum, b) => sum + columnsOf(b), 0);
  const width = Math.max(MIN_WIDTH, totalCols * COLUMN_PITCH);
  const metrics = { width, midX: width / 2 };
  const placed = placeBranches(plan.branches, width, totalCols);

  const merged = mergeRegions(
    placePoiAndBreaker(plan, metrics),
    plan.siteBus ? placeSiteBus(view, plan.siteBus, placed, metrics) : EMPTY_OUTPUT,
    ...placed.map((p) => placeBranch(view, p)),
  );
  return { width, height: HEIGHT, ...merged };
}
