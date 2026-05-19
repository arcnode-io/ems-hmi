/**
 * Module-children band: AC-module-attached leaves like CDU under compute,
 * rendered below the parent with a dashed informational drop. No flow
 * particles — these conductors don't carry energy.
 */

import { NODE_H, Y_AC_CHILD, Y_AC_MODULE } from "../constants";
import { nodeHeightFor, nodeWidthFor } from "../geometry";
import type { ClassifiedDevices } from "../classify";
import type { AcContext, RegionOutput } from "./types";

export function placeModuleChildren(
  classified: ClassifiedDevices,
  acCtx: AcContext,
): RegionOutput {
  const nodes: RegionOutput["nodes"] = [];
  const conductors: RegionOutput["conductors"] = [];
  for (const child of classified.moduleChildren) {
    const parentIdx = acCtx.acMembers.findIndex((m) => m.device_id === child.parent);
    if (parentIdx < 0) continue;
    const parentX = acCtx.anchor.acXs[parentIdx] ?? acCtx.midX;
    const width = nodeWidthFor(child.template, null);
    const height = nodeHeightFor(null, child.template);
    nodes.push({
      id: child.device_id,
      template: child.template,
      kind: "leaf",
      role: null,
      displayName: child.display_name ?? child.device_id,
      x: parentX,
      y: Y_AC_CHILD,
      width,
      height,
    });
    conductors.push({
      id: `child_drop_${child.device_id}`,
      x1: parentX,
      y1: Y_AC_MODULE + NODE_H / 2,
      x2: parentX,
      y2: Y_AC_CHILD - height / 2,
      kind: "info",
      flowSource: null,
      particles: [],
      dashed: true,
    });
  }
  return { nodes, conductors, decorations: [] };
}
