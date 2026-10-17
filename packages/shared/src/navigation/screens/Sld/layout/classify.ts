/**
 * Fold a TopologyView into the SLD's electrical plan: the POI, the site MV
 * bus, and its branches in bus order. Pure — no React.
 *
 * Branch shapes (edp-api a4dd812):
 * - feeder: a switchgear on the site bus. Its grid container (shared
 *   parent) holds the transformer + LV board; the board's LV bus feeds
 *   the compute modules. MV→LV is implied by parentage, not a bus.
 * - storage: any other site-bus member (battery pad), with its children.
 */

import type { BusType, TopologyViewType } from "../../../../data/topology/topology.schema";
import {
  LV_BOARD_TEMPLATE,
  POI_TEMPLATE,
  SITE_BUS_PREFIX,
  SWITCHGEAR_TEMPLATE,
  TRANSFORMER_TEMPLATE,
} from "./constants";

export type SldDevice = TopologyViewType["devices"][string];

export interface Feeder {
  kind: "feeder";
  switchgear: SldDevice;
  transformer: SldDevice | null;
  board: SldDevice | null;
  /** LV bus the board feeds; null when the container has no compute. */
  lvBus: BusType | null;
  /** lvBus members minus the board, in bus (C) order. */
  loads: SldDevice[];
}

export interface Storage {
  kind: "storage";
  module: SldDevice;
  children: SldDevice[];
}

export type Branch = Feeder | Storage;

export interface SldPlan {
  /** Multi-POI sites get the first one. */
  poi: SldDevice | null;
  siteBus: BusType | null;
  branches: Branch[];
}

function isDevice(d: SldDevice | undefined): d is SldDevice {
  return Boolean(d);
}

function devicesOn(view: TopologyViewType, bus: BusType): SldDevice[] {
  return bus.members.map((m) => view.devices[m.device_id]).filter(isDevice);
}

/** Same-container device of `template` (e.g. switchgear → its transformer). */
function sibling(view: TopologyViewType, of: SldDevice, template: string): SldDevice | null {
  if (!of.parent) return null;
  return Object.values(view.devices).find((d) => d.parent === of.parent && d.template === template) ?? null;
}

function feederOf(view: TopologyViewType, switchgear: SldDevice): Feeder {
  const board = sibling(view, switchgear, LV_BOARD_TEMPLATE);
  const lvBus = board
    ? view.buses.find((b) => b.members.some((m) => m.device_id === board.device_id)) ?? null
    : null;
  return {
    kind: "feeder",
    switchgear,
    transformer: sibling(view, switchgear, TRANSFORMER_TEMPLATE),
    board,
    lvBus,
    loads: lvBus ? devicesOn(view, lvBus).filter((d) => d !== board) : [],
  };
}

function storageOf(view: TopologyViewType, module: SldDevice): Storage {
  const children = Object.values(view.devices).filter((d) => d.parent === module.device_id);
  return { kind: "storage", module, children };
}

export function planSld(view: TopologyViewType): SldPlan {
  const poi = Object.values(view.devices).find((d) => d.template === POI_TEMPLATE) ?? null;
  const siteBus = view.buses.find((b) => b.bus_id.startsWith(SITE_BUS_PREFIX)) ?? null;
  const branches = siteBus
    ? devicesOn(view, siteBus).map((d) =>
        d.template === SWITCHGEAR_TEMPLATE ? feederOf(view, d) : storageOf(view, d),
      )
    : [];
  return { poi, siteBus, branches };
}
