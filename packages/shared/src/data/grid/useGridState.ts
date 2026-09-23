/**
 * useGridState — real data for the Grid screen (`/modules/grid`, site/PCC
 * scope). Interconnect + curtailment concerns; power quality lives in
 * useGridPowerQuality and protection state in useGridProtection
 * (panel-shaped hooks, kept separate to stay under the 200-line budget).
 * Composes useGridMode (mode, island qualifier, net-at-meter) with:
 *
 *   - `grid_module_*.grid_frequency`
 *   - `der_dispatch_*.target_active_power` / `event_active` (utility
 *     curtailment: the event-scoped cap and whether one is active —
 *     confirmed against backend-engineer 2026-09-13, no new channel)
 *   - `pv_inverter_*.active_power` (summed — generation is never signed,
 *     so no sign-convention risk the way BESS/site-load would carry)
 *
 * No DOE (operating_envelope) or DLR (line_rating) fields here — the
 * utility interconnect is IEEE 2030.5, and ArcNode has no visibility into
 * either concept on the wire (see ~/arcnode/ems/readme.md). Both were
 * removed from the demo fixture and data layer 2026-09-23, per Joe.
 *
 * Site load and BESS aren't included: deriving load algebraically
 * (load = net − bess + pv) needs bess_module.active_power's charge/
 * discharge sign convention, which isn't documented anywhere in this
 * codebase — guessing it wrong would silently show a plausible-looking
 * but backwards number, so it's deferred rather than risked.
 */

import { useMemo } from "react";
import { useTopologyView } from "../topology/useTopologyView";
import { useAggregateMeasurements } from "../mqtt/useAggregateMeasurements";
import { useDeploymentIdentity } from "../deployment/useDeploymentIdentity";
import { measurementTopic, type TopicUnit } from "../topics/topicBuilder";
import { useGridMode } from "./useGridMode";
import type { GridMode, IslandQualifier } from "./useGridMode";

export type BreakerState = "OPEN" | "CLOSED" | "TRIPPED";
/**
 * der_dispatch's real der_event_state enum. Fixed 2026-09-22 — this was
 * wrongly named "dispatch_state" here; the real measurement (and topic)
 * has always been der_event_state (edp-api's der_dispatch.yaml: named that
 * way specifically to avoid colliding with ems-industrial-gateway's own,
 * unrelated dispatch_state). Verified against DerEventState.java directly
 * — 5 values, no SCHEDULED (a stale claim in an unrelated handoff doc).
 */
export type DerDispatchState = "IDLE" | "PENDING" | "ARMED" | "ACTIVE" | "REJECTED";

const DER_DISPATCH_STATES: readonly DerDispatchState[] = [
  "IDLE",
  "PENDING",
  "ARMED",
  "ACTIVE",
  "REJECTED",
];

export interface GridState {
  /** GRID vs ISLAND, and planned/fault qualifier — from useGridMode. */
  mode: GridMode | null;
  islandQualifier: IslandQualifier | null;
  /**
   * Raw PCC breaker position. Same source topic as `mode`
   * (grid_module.interconnect_state) but kept as the full three-value
   * enum — collapsing it to a GRID/ISLAND boolean would render an actual
   * TRIPPED fault as "OPEN", hiding the one distinction that matters most.
   */
  breakerState: BreakerState | null;
  /** Site frequency, Hz. */
  frequencyHz: number | null;
  /** Net power at the meter, watts signed (+import / −export). */
  netActivePowerW: number | null;
  /** Utility curtailment: active flag + the event-scoped cap (watts). */
  curtailmentActive: boolean | null;
  curtailmentCapW: number | null;
  /** der_dispatch's real dispatch_state enum. Null until a value arrives. */
  derDispatchState: DerDispatchState | null;
  /** Summed pv_inverter active_power, watts. Null when no PV is registered. */
  pvOutputW: number | null;
}

function topicsFor(
  view: ReturnType<typeof useTopologyView>["view"],
  siteId: string,
  templateName: string,
  measurementNames: readonly string[],
): string[] {
  if (!view) return [];
  const list: string[] = [];
  for (const [deviceId, device] of Object.entries(view.devices)) {
    if (device.template !== templateName) continue;
    const tpl = view.templates_used[device.template];
    if (!tpl) continue;
    for (const name of measurementNames) {
      const m = tpl.measurements[name];
      if (m) list.push(measurementTopic(siteId, deviceId, name, m.unit as TopicUnit));
    }
  }
  return list;
}

/**
 * Subscribe to the Grid page's real feeds and produce its data shape.
 * @returns GridState — envelope-sourced fields plus the page's own additions
 */
export function useGridState(): GridState {
  const gridMode = useGridMode();
  const { view } = useTopologyView();
  const { siteId } = useDeploymentIdentity();

  const topics = useMemo(() => {
    return [
      ...topicsFor(view, siteId, "grid_module", [
        "grid_frequency",
        "interconnect_state",
      ]),
      ...topicsFor(view, siteId, "der_dispatch", [
        "target_active_power",
        "event_active",
        "der_event_state",
      ]),
      ...topicsFor(view, siteId, "pv_inverter", ["active_power"]),
    ];
  }, [view, siteId]);

  const messages = useAggregateMeasurements<number | string | boolean>(topics);

  return useMemo(() => {
    let frequencyHz: number | null = null;
    let breakerState: BreakerState | null = null;
    let curtailmentActive: boolean | null = null;
    let curtailmentCapW: number | null = null;
    let pvOutputW: number | null = null;
    let derDispatchState: DerDispatchState | null = null;

    for (const topic of topics) {
      const msg = messages[topic];
      if (!msg) continue;
      if (topic.endsWith("/grid_frequency/hertz")) {
        if (typeof msg.value === "number") frequencyHz = msg.value;
      } else if (
        topic.includes("/grid_module") &&
        topic.endsWith("/interconnect_state/none")
      ) {
        if (msg.value === "OPEN" || msg.value === "CLOSED" || msg.value === "TRIPPED") {
          breakerState = msg.value;
        }
      } else if (topic.endsWith("/target_active_power/watts")) {
        if (typeof msg.value === "number") curtailmentCapW = msg.value;
      } else if (topic.endsWith("/event_active/none")) {
        if (typeof msg.value === "boolean") curtailmentActive = msg.value;
      } else if (topic.endsWith("/der_event_state/none")) {
        const match = DER_DISPATCH_STATES.find((s) => s === msg.value);
        if (match) derDispatchState = match;
      } else if (
        topic.includes("/pv_inverter") &&
        topic.endsWith("/active_power/watts")
      ) {
        if (typeof msg.value === "number") pvOutputW = (pvOutputW ?? 0) + msg.value;
      }
    }

    return {
      mode: gridMode.mode,
      islandQualifier: gridMode.islandQualifier,
      breakerState,
      frequencyHz,
      netActivePowerW: gridMode.netActivePowerW,
      curtailmentActive,
      curtailmentCapW: curtailmentActive ? curtailmentCapW : null,
      pvOutputW,
      derDispatchState,
    };
  }, [gridMode, topics, messages]);
}
