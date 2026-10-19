/**
 * owningModule — which module a device's alarms roll up to: the nearest
 * `kind: module` device up its parent chain (itself if it is one). A PDU
 * under a compute container counts against that container.
 */

import type { TopologyViewType } from "../topology/topology.schema";

export type ModuleTree = Pick<TopologyViewType, "devices" | "templates_used">;

/**
 * @returns the owning module's device id, or null when no module owns it
 * @example owningModule(view, "pdu_1") // "compute_module_h100_1"
 */
export function owningModule(view: ModuleTree, deviceId: string): string | null {
  // Reason: a set guards a cyclic parent chain from a bad DTM — no hang.
  const seen = new Set<string>();
  let id: string | null = deviceId;
  while (id !== null && !seen.has(id)) {
    seen.add(id);
    const device: TopologyViewType["devices"][string] | undefined = view.devices[id];
    if (!device) return null;
    if (view.templates_used[device.template]?.kind === "module") return id;
    id = device.parent;
  }
  return null;
}
