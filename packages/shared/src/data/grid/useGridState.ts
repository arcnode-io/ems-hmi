/**
 * useGridState — real data for the Grid screen (`/modules/grid`, site/PCC
 * scope). Interconnect + utility-limits + curtailment concerns; power
 * quality lives in useGridPowerQuality and protection state in
 * useGridProtection (panel-shaped hooks, kept separate to stay under the
 * 200-line budget). Composes useOperatingEnvelope (mode, island qualifier,
 * import/export limit, net-at-meter) with:
 *
 *   - `grid_module_*.grid_frequency`
 *   - `line_rating_*.dynamic_line_rating` / `status` (the DLR feed — the
 *     handoff's "ceiling ... dynamic" caption comes from this, a reading
 *     distinct from the standing operating_envelope import_limit)
 *   - `der_dispatch_*.target_active_power` / `event_active` (utility
 *     curtailment: the event-scoped cap and whether one is active —
 *     confirmed against backend-engineer 2026-09-13, no new channel)
 *   - `pv_inverter_*.active_power` (summed — generation is never signed,
 *     so no sign-convention risk the way BESS/site-load would carry)
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
import { useOperatingEnvelope } from "../envelope/useOperatingEnvelope";
import type {
  GridMode,
  IslandQualifier,
} from "../envelope/useOperatingEnvelope";

export type FeedStatus = "ok" | "stale" | "invalid" | "comm-fail";
export type BreakerState = "OPEN" | "CLOSED" | "TRIPPED";

export interface GridState {
  /** GRID vs ISLAND, and planned/fault qualifier — from useOperatingEnvelope. */
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
  /** Standing DOE import/export limits, kW. */
  importLimitKw: number | null;
  exportLimitKw: number | null;
  /** Dynamic line rating feed — conductor ampacity, distinct from import_limit. */
  dlrAmps: number | null;
  dlrStatus: FeedStatus;
  /** Utility curtailment: active flag + the event-scoped cap (watts). */
  curtailmentActive: boolean | null;
  curtailmentCapW: number | null;
  /** Summed pv_inverter active_power, watts. Null when no PV is registered. */
  pvOutputW: number | null;
}

function asFeedStatus(raw: string | undefined): FeedStatus {
  if (raw === "STALE") return "stale";
  if (raw === "INVALID") return "invalid";
  if (raw === "COMM_FAIL") return "comm-fail";
  return "ok";
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
  const envelope = useOperatingEnvelope();
  const { view } = useTopologyView();
  const { siteId } = useDeploymentIdentity();

  const topics = useMemo(() => {
    return [
      ...topicsFor(view, siteId, "grid_module", [
        "grid_frequency",
        "interconnect_state",
      ]),
      ...topicsFor(view, siteId, "line_rating", [
        "dynamic_line_rating",
        "status",
      ]),
      ...topicsFor(view, siteId, "der_dispatch", [
        "target_active_power",
        "event_active",
      ]),
      ...topicsFor(view, siteId, "pv_inverter", ["active_power"]),
    ];
  }, [view, siteId]);

  const messages = useAggregateMeasurements<number | string | boolean>(topics);

  return useMemo(() => {
    let frequencyHz: number | null = null;
    let breakerState: BreakerState | null = null;
    let dlrAmps: number | null = null;
    let dlrStatusRaw: string | undefined;
    let curtailmentActive: boolean | null = null;
    let curtailmentCapW: number | null = null;
    let pvOutputW: number | null = null;

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
      } else if (topic.endsWith("/dynamic_line_rating/amps")) {
        if (typeof msg.value === "number") dlrAmps = msg.value;
      } else if (topic.includes("/line_rating") && topic.endsWith("/status/none")) {
        if (typeof msg.value === "string") dlrStatusRaw = msg.value;
      } else if (topic.endsWith("/target_active_power/watts")) {
        if (typeof msg.value === "number") curtailmentCapW = msg.value;
      } else if (topic.endsWith("/event_active/none")) {
        if (typeof msg.value === "boolean") curtailmentActive = msg.value;
      } else if (
        topic.includes("/pv_inverter") &&
        topic.endsWith("/active_power/watts")
      ) {
        if (typeof msg.value === "number") pvOutputW = (pvOutputW ?? 0) + msg.value;
      }
    }

    return {
      mode: envelope.mode,
      islandQualifier: envelope.islandQualifier,
      breakerState,
      frequencyHz,
      netActivePowerW: envelope.netActivePowerW,
      importLimitKw: envelope.importLimitKw,
      exportLimitKw: envelope.exportLimitKw,
      dlrAmps,
      dlrStatus: asFeedStatus(dlrStatusRaw),
      curtailmentActive,
      curtailmentCapW: curtailmentActive ? curtailmentCapW : null,
      pvOutputW,
    };
  }, [envelope, topics, messages]);
}
