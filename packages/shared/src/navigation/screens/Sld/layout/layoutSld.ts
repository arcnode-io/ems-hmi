/**
 * layoutSld — pure layout algorithm. Takes a TopologyView and emits an
 * SldLayout: positioned nodes + conductors + decorations. SLD-specific
 * grammar (utility feeds on top, POI above AC bus, BESS on DC bus, etc.)
 * rather than a general-purpose graph layout — this is what makes the
 * output look correct for arbitrary device counts.
 *
 * Y bands are fixed constants; X positions scale with device count via
 * SPREAD helpers so 2 BESS modules and 16 BESS modules both look right.
 */

import type { TopologyViewType } from "../../../../data/topology/topology.schema";
import type {
  SldLayout,
  SldNode,
  SldConductor,
  SldDecoration,
  ParticleSpec,
} from "./types";

// ── Fixed y-bands (top to bottom) ──────────────────────────────────────
const Y_UTILITY = 50;
const Y_POI = 130;
const Y_BREAKER = 195;
const Y_AC_BUS = 240;
const Y_AC_MODULE = 305;
const Y_INVERTER = 360;
const Y_DC_BUS = 410;
const Y_DC_MODULE = 452;
const Y_AC_CHILD = 380;

// ── Sizing constants ───────────────────────────────────────────────────
const MIN_WIDTH = 720;
const HEIGHT = 480;
const COLUMN_PITCH = 180;
const NODE_W_MODULE = 124;
const NODE_W_COMPUTE = 156;
const NODE_W_LEAF = 130;
const NODE_W_DLR = 110;
const NODE_W_POI = 144;
const NODE_W_CHILD = 96;
const NODE_H = 44;
const NODE_H_POI = 52;
const NODE_H_CHILD = 36;

const UTILITY_TEMPLATES = new Set(["operating_envelope", "line_rating"]);
const POI_TEMPLATE = "revenue_meter";

interface ClassifiedDevices {
  poi: TopologyViewType["devices"][string] | null;
  utilityFeeds: TopologyViewType["devices"][string][];
  acMembers: TopologyViewType["devices"][string][];
  dcMembers: TopologyViewType["devices"][string][];
  /** Module-children — leaves with a module parent, excluding utility/POI. */
  moduleChildren: TopologyViewType["devices"][string][];
}

/**
 * Classify topology devices into the SLD grammar's slots.
 */
function classify(view: TopologyViewType): ClassifiedDevices {
  type DeviceT = ClassifiedDevices["acMembers"][number];
  const isDevice = (d: DeviceT | undefined): d is DeviceT => Boolean(d);
  const acBus = view.buses.find((b) => b.type === "ac");
  const dcBus = view.buses.find((b) => b.type === "dc");
  const acMembers: DeviceT[] = acBus
    ? acBus.members.map((m) => view.devices[m.device_id]).filter(isDevice)
    : [];
  const dcMembers: DeviceT[] = dcBus
    ? dcBus.members.map((m) => view.devices[m.device_id]).filter(isDevice)
    : [];
  const acIds = new Set(acMembers.map((d) => d.device_id));
  let poi: ClassifiedDevices["poi"] = null;
  const utilityFeeds: ClassifiedDevices["utilityFeeds"] = [];
  const moduleChildren: ClassifiedDevices["moduleChildren"] = [];
  for (const d of Object.values(view.devices)) {
    if (!d) continue;
    if (d.template === POI_TEMPLATE) {
      poi ??= d;
      continue;
    }
    if (UTILITY_TEMPLATES.has(d.template)) {
      utilityFeeds.push(d);
      continue;
    }
    if (d.parent && acIds.has(d.parent)) {
      moduleChildren.push(d);
    }
  }
  return { poi, utilityFeeds, acMembers, dcMembers, moduleChildren };
}

/**
 * Spread N items evenly across [minX, maxX], returning the center X for each.
 */
function spreadX(count: number, minX: number, maxX: number): number[] {
  if (count === 0) return [];
  if (count === 1) return [(minX + maxX) / 2];
  const step = (maxX - minX) / (count - 1);
  return Array.from({ length: count }, (_, i) => minX + i * step);
}

/**
 * Three particles staggered evenly over the same cycle.
 */
function busParticles(durationSec: number): ParticleSpec[] {
  return [0, 1, 2].map((i) => ({
    durationSec,
    beginOffsetSec: -(durationSec * i) / 3,
    radius: 2.5,
  }));
}

function dropParticle(durationSec: number): ParticleSpec[] {
  return [{ durationSec, beginOffsetSec: 0, radius: 2 }];
}

function nodeWidthFor(template: string, role: "poi" | "dlr-badge" | null): number {
  if (role === "poi") return NODE_W_POI;
  if (role === "dlr-badge") return NODE_W_DLR;
  if (template === "compute_module") return NODE_W_COMPUTE;
  if (template === "cdu") return NODE_W_CHILD;
  if (UTILITY_TEMPLATES.has(template)) return NODE_W_LEAF;
  return NODE_W_MODULE;
}

function nodeHeightFor(role: "poi" | "dlr-badge" | null, template: string): number {
  if (role === "poi") return NODE_H_POI;
  if (template === "cdu") return NODE_H_CHILD;
  return NODE_H;
}

/**
 * Lay out an SLD from a topology view.
 * @param view Parsed TopologyView (output of useTopologyView)
 * @returns SldLayout ready to render
 */
export function layoutSld(view: TopologyViewType): SldLayout {
  const { poi, utilityFeeds, acMembers, dcMembers, moduleChildren } = classify(view);

  // Width grows with the busiest row.
  const cols = Math.max(
    acMembers.length,
    dcMembers.length,
    utilityFeeds.length + 1,
    3,
  );
  const width = Math.max(MIN_WIDTH, cols * COLUMN_PITCH);
  const midX = width / 2;

  const nodes: SldNode[] = [];
  const conductors: SldConductor[] = [];
  const decorations: SldDecoration[] = [];

  // Utility-feed row, centered around midX.
  const utilXs = spreadX(utilityFeeds.length, midX - cols * 60, midX + cols * 60);
  utilityFeeds.forEach((d, i) => {
    const role = d.template === "line_rating" ? ("dlr-badge" as const) : null;
    nodes.push({
      id: d.device_id, template: d.template, kind: "leaf", role,
      displayName: d.display_name ?? d.device_id,
      x: utilXs[i] ?? 0, y: Y_UTILITY,
      width: nodeWidthFor(d.template, role), height: nodeHeightFor(role, d.template),
    });
  });

  if (poi) {
    nodes.push({
      id: poi.device_id, template: poi.template, kind: "leaf", role: "poi",
      displayName: poi.display_name ?? poi.device_id,
      x: midX, y: Y_POI,
      width: NODE_W_POI, height: NODE_H_POI,
    });
    // Dotted info lines from each utility feed to the POI top edge.
    utilityFeeds.forEach((d, i) => {
      conductors.push({
        id: `info_${d.device_id}`,
        x1: utilXs[i] ?? midX, y1: Y_UTILITY + NODE_H / 2,
        x2: midX, y2: Y_POI - NODE_H_POI / 2,
        kind: "info", flowSource: null, particles: [], dashed: true,
      });
    });
    // POI → breaker → AC bus, split around the breaker glyph at midX.
    conductors.push({
      id: "poi_drop_top",
      x1: midX, y1: Y_POI + NODE_H_POI / 2,
      x2: midX, y2: Y_BREAKER - 7,
      kind: "drop", flowSource: { kind: "envelope" }, particles: dropParticle(3),
    });
    decorations.push({ id: "main_breaker", kind: "breaker", x: midX, y: Y_BREAKER, state: "closed" });
    conductors.push({
      id: "poi_drop_bot",
      x1: midX, y1: Y_BREAKER + 7,
      x2: midX, y2: Y_AC_BUS,
      kind: "drop", flowSource: { kind: "envelope" },
      particles: [{ durationSec: 3, beginOffsetSec: -1.5, radius: 2 }],
    });
  }

  // AC bus + module placements.
  const acStart = midX - ((acMembers.length - 1) * COLUMN_PITCH) / 2;
  const acXs = acMembers.map((_, i) => acStart + i * COLUMN_PITCH);
  const acMinX = Math.min(...acXs, midX) - 50;
  const acMaxX = Math.max(...acXs, midX) + 50;
  if (acMembers.length > 0) {
    conductors.push({
      id: "ac_bus_1",
      x1: acMinX, y1: Y_AC_BUS, x2: acMaxX, y2: Y_AC_BUS,
      kind: "ac", flowSource: null, particles: [],
    });
    // AC bus halves: left side flow source = envelope (utility delivers
    // toward Grid Module / reverses on EXP). Right side load-side static.
    if (acMembers.length >= 2) {
      // Find left+right anchors relative to POI tap (midX).
      const left = Math.min(...acXs);
      const right = Math.max(...acXs);
      if (left < midX) {
        conductors.push({
          id: "ac_bus_left",
          x1: midX, y1: Y_AC_BUS, x2: left, y2: Y_AC_BUS,
          kind: "ac", flowSource: { kind: "envelope" }, particles: busParticles(3.5),
        });
      }
      if (right > midX) {
        conductors.push({
          id: "ac_bus_right",
          x1: midX, y1: Y_AC_BUS, x2: right, y2: Y_AC_BUS,
          kind: "ac", flowSource: null, particles: busParticles(3.5),
        });
      }
    }
  }
  acMembers.forEach((d, i) => {
    const role = null;
    const w = nodeWidthFor(d.template, role);
    const h = nodeHeightFor(role, d.template);
    nodes.push({
      id: d.device_id, template: d.template, kind: "module", role,
      displayName: d.display_name ?? d.device_id,
      x: acXs[i] ?? 0, y: Y_AC_MODULE, width: w, height: h,
    });
    // Drop from bus to module top edge.
    const isLoadSide = d.template === "compute_module";
    conductors.push({
      id: `ac_drop_${d.device_id}`,
      x1: acXs[i] ?? 0, y1: Y_AC_BUS, x2: acXs[i] ?? 0, y2: Y_AC_MODULE - h / 2,
      kind: "drop",
      flowSource: isLoadSide ? null : { kind: "envelope" },
      particles: dropParticle(2),
    });
  });

  // Inverter sits between Grid Module and the DC bus.
  const grid = acMembers.find((d) => d.template === "grid_module");
  if (grid && dcMembers.length > 0) {
    const gridX = acXs[acMembers.indexOf(grid)] ?? midX;
    conductors.push({
      id: "inverter_top",
      x1: gridX, y1: Y_AC_MODULE + NODE_H / 2,
      x2: gridX, y2: Y_INVERTER - 9,
      kind: "drop", flowSource: { kind: "envelope" }, particles: dropParticle(2),
    });
    decorations.push({ id: "main_inverter", kind: "inverter", x: gridX, y: Y_INVERTER });
    conductors.push({
      id: "inverter_bot",
      x1: gridX, y1: Y_INVERTER + 9,
      x2: gridX, y2: Y_DC_BUS,
      kind: "drop", flowSource: { kind: "envelope" }, particles: dropParticle(2.5),
    });
  }

  // DC bus + module placements.
  const dcStart = grid ? acXs[acMembers.indexOf(grid)] ?? midX : midX;
  const dcMaxXMember = dcMembers.length > 0
    ? dcStart + (dcMembers.length - 1) * COLUMN_PITCH
    : dcStart;
  const dcXs = dcMembers.map((_, i) => dcStart + (i + 1) * (COLUMN_PITCH * 0.85));
  if (dcMembers.length > 0) {
    conductors.push({
      id: "dc_bus_1",
      x1: dcStart, y1: Y_DC_BUS,
      x2: Math.max(...dcXs), y2: Y_DC_BUS,
      kind: "dc", flowSource: { kind: "envelope" }, particles: busParticles(7),
    });
  }
  dcMembers.forEach((d, i) => {
    nodes.push({
      id: d.device_id, template: d.template, kind: "module", role: null,
      displayName: d.display_name ?? d.device_id,
      x: dcXs[i] ?? 0, y: Y_DC_MODULE, width: NODE_W_MODULE, height: NODE_H,
    });
    conductors.push({
      id: `dc_drop_${d.device_id}`,
      x1: dcXs[i] ?? 0, y1: Y_DC_BUS, x2: dcXs[i] ?? 0, y2: Y_DC_MODULE - NODE_H / 2,
      kind: "drop", flowSource: { kind: "envelope" }, particles: dropParticle(1.5),
    });
  });
  // Suppress unused-var lint for dcMaxXMember (kept for future right-bound expansion).
  void dcMaxXMember;

  // Module-children (CDU below compute, etc.) — dashed informational drops.
  moduleChildren.forEach((d) => {
    const parent = acMembers.find((m) => m.device_id === d.parent);
    if (!parent) return;
    const parentX = acXs[acMembers.indexOf(parent)] ?? midX;
    const w = nodeWidthFor(d.template, null);
    const h = nodeHeightFor(null, d.template);
    nodes.push({
      id: d.device_id, template: d.template, kind: "leaf", role: null,
      displayName: d.display_name ?? d.device_id,
      x: parentX, y: Y_AC_CHILD, width: w, height: h,
    });
    conductors.push({
      id: `child_drop_${d.device_id}`,
      x1: parentX, y1: Y_AC_MODULE + NODE_H / 2,
      x2: parentX, y2: Y_AC_CHILD - h / 2,
      kind: "info", flowSource: null, particles: [], dashed: true,
    });
  });

  return { width, height: HEIGHT, nodes, conductors, decorations };
}
