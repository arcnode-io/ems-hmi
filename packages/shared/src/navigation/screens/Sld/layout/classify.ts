/**
 * Fold a TopologyView into the SLD's electrical plan: the POI, the site MV
 * bus, and its branches in bus order. Pure — no React.
 *
 * Every link comes from bus membership (edp-api 9155fc1): a bus lists its
 * source first, so "the bus D feeds" is the bus whose first member is D.
 * POI → site bus → switchgear → ac_main feeder (relay, transformer HV) →
 * transformer → LV bus (board, compute). Nothing is inferred from
 * parentage; a missing member ends the trace there.
 * - feeder: a switchgear on the site bus.
 * - storage: any other site-bus member (battery pad), with its children
 *   (containment, drawn dashed — not a conductor).
 */

import type { BusType, TopologyViewType } from "../../../../data/topology/topology.schema";
import { inFamily } from "../../../../data/topology/templateFamily";
import { LV_BOARD_TEMPLATE, POI_TEMPLATE, SWITCHGEAR_TEMPLATE, TRANSFORMER_TEMPLATE } from "./constants";

export type SldDevice = TopologyViewType["devices"][string];

export interface Feeder {
  kind: "feeder";
  switchgear: SldDevice;
  /** Bus the switchgear feeds (ac_main_N); null when it feeds none. */
  feederBus: BusType | null;
  /** Feeder-bus members besides the transformer (protective relay). */
  taps: SldDevice[];
  transformer: SldDevice | null;
  /** Bus the transformer feeds (lv_main_N). */
  lvBus: BusType | null;
  board: SldDevice | null;
  /** lvBus members minus the transformer and board, in bus (C) order. */
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

/** Members after the source, resolved to devices. */
function fedBy(view: TopologyViewType, bus: BusType): SldDevice[] {
  return bus.members.slice(1).map((m) => view.devices[m.device_id]).filter(isDevice);
}

/** The bus `device` sources — its first member. */
function busFedBy(view: TopologyViewType, device: SldDevice | null): BusType | null {
  if (!device) return null;
  return view.buses.find((b) => b.members[0]?.device_id === device.device_id) ?? null;
}

function feederOf(view: TopologyViewType, switchgear: SldDevice): Feeder {
  const feederBus = busFedBy(view, switchgear);
  const onFeeder = feederBus ? fedBy(view, feederBus) : [];
  const transformer = onFeeder.find((d) => inFamily(d.template, TRANSFORMER_TEMPLATE)) ?? null;
  const lvBus = busFedBy(view, transformer);
  const onLv = lvBus ? fedBy(view, lvBus) : [];
  const board = onLv.find((d) => inFamily(d.template, LV_BOARD_TEMPLATE)) ?? null;
  return {
    kind: "feeder",
    switchgear,
    feederBus,
    taps: onFeeder.filter((d) => d !== transformer),
    transformer,
    lvBus,
    board,
    loads: onLv.filter((d) => d !== board),
  };
}

function storageOf(view: TopologyViewType, module: SldDevice): Storage {
  const children = Object.values(view.devices).filter((d) => d.parent === module.device_id);
  return { kind: "storage", module, children };
}

export function planSld(view: TopologyViewType): SldPlan {
  const poi = Object.values(view.devices).find((d) => inFamily(d.template, POI_TEMPLATE)) ?? null;
  const siteBus = busFedBy(view, poi);
  const branches = siteBus
    ? fedBy(view, siteBus).map((d) =>
        inFamily(d.template, SWITCHGEAR_TEMPLATE) ? feederOf(view, d) : storageOf(view, d),
      )
    : [];
  return { poi, siteBus, branches };
}
