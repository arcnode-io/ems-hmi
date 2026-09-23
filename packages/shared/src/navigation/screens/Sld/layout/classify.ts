/**
 * Classify topology devices into the SLD grammar's row slots: POI,
 * AC bus members, DC bus members, and module-children. Pure function —
 * easy to test, doesn't touch React.
 */

import type { TopologyViewType } from "../../../../data/topology/topology.schema";
import { POI_TEMPLATE } from "./constants";

export type ClassifiedDevice = TopologyViewType["devices"][string];

export interface ClassifiedDevices {
  /** Single POI meter. Multi-POI sites get the first one. */
  poi: ClassifiedDevice | null;
  acMembers: ClassifiedDevice[];
  dcMembers: ClassifiedDevice[];
  /** Leaves with a module parent, excluding POI. */
  moduleChildren: ClassifiedDevice[];
}

function isDevice(d: ClassifiedDevice | undefined): d is ClassifiedDevice {
  return Boolean(d);
}

function membersOf(view: TopologyViewType, busType: "ac" | "dc"): ClassifiedDevice[] {
  const bus = view.buses.find((b) => b.type === busType);
  if (!bus) return [];
  return bus.members.map((m) => view.devices[m.device_id]).filter(isDevice);
}

/**
 * Fold a TopologyView into per-row device groupings.
 */
export function classify(view: TopologyViewType): ClassifiedDevices {
  const acMembers = membersOf(view, "ac");
  const dcMembers = membersOf(view, "dc");
  const acIds = new Set(acMembers.map((d) => d.device_id));
  const poi: ClassifiedDevice | null =
    Object.values(view.devices).find((d) => d?.template === POI_TEMPLATE) ?? null;
  const moduleChildren: ClassifiedDevice[] = [];
  for (const device of Object.values(view.devices)) {
    if (!device || device === poi) continue;
    if (device.parent && acIds.has(device.parent)) {
      moduleChildren.push(device);
    }
  }
  return { poi, acMembers, dcMembers, moduleChildren };
}
