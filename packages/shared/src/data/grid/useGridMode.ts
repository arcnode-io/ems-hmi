/**
 * useGridMode — site GRID/ISLAND mode + net-at-meter reading. Subscribes to:
 *
 *   - `grid_module_*.interconnect_state` (breaker position — GRID/ISLAND is
 *     derived from this; the real device catalog has no separate mode
 *     enum, confirmed against edp-api 2026-09-13)
 *   - `grid_module_*.net_active_power` (net-at-meter reading — poi_meter
 *     has no instantaneous power field, only cumulative energy, so this is
 *     the real source)
 *
 * Utility interconnect is IEEE 2030.5 (MirrorUsagePoint compliance
 * reporting via der-control-api → the mock DERMS dispatch_api — see
 * ~/arcnode/ems/readme.md). ArcNode has no visibility into utility-side
 * DOE/DLR concepts; this hook only ever reads grid_module, a real device
 * in our own DTM.
 */

import { useMemo } from "react";
import { useTopologyView } from "../topology/useTopologyView";
import { useAggregateMeasurements } from "../mqtt/useAggregateMeasurements";
import { useDeploymentIdentity } from "../deployment/useDeploymentIdentity";
import { measurementTopic, type TopicUnit } from "../topics/topicBuilder";

export type GridMode = "GRID" | "ISLAND";
/** Only meaningful when mode === "ISLAND". Handoff rule: ISLAND always
 * carries a qualifier, never rendered bare. */
export type IslandQualifier = "planned" | "fault";

export interface GridModeState {
  /** Site mode — GRID (utility-tied) vs ISLAND (utility severed). Derived
   * from grid_module.interconnect_state (breaker position); the real
   * device catalog has no separate mode enum. */
  mode: GridMode | null;
  /** Planned (breaker OPEN, ride-through) vs fault (TRIPPED). Null unless islanded. */
  islandQualifier: IslandQualifier | null;
  /** Currently active flow direction. null when net-zero or unknown. */
  direction: "IMP" | "EXP" | null;
  /**
   * Pre-formatted net-at-meter reading, e.g. "+142 kW IMPORT". Empty
   * string when net power isn't yet wired. Used by the SLD POI node
   * primary-value slot. Derived from grid_module.net_active_power.
   */
  netAtMeter: string;
  /** Raw grid_module net_active_power in watts, signed (+import/−export). */
  netActivePowerW: number | null;
}

const DEFAULT_STATE: GridModeState = {
  mode: null,
  islandQualifier: null,
  direction: null,
  netAtMeter: "",
  netActivePowerW: null,
};

/**
 * Derive site GRID/ISLAND mode + qualifier from the PCC breaker position.
 * OPEN is an operator/utility-initiated island (ride-through); TRIPPED is
 * an unplanned fault island. Neither maps to a "mode" enum on the real
 * device catalog — interconnect_state is the only real source.
 */
function fromInterconnectState(
  raw: string | undefined,
): { mode: GridMode; islandQualifier: IslandQualifier | null } | null {
  if (raw === "CLOSED") return { mode: "GRID", islandQualifier: null };
  if (raw === "OPEN") return { mode: "ISLAND", islandQualifier: "planned" };
  if (raw === "TRIPPED") return { mode: "ISLAND", islandQualifier: "fault" };
  return null;
}

/**
 * Subscribe to grid_module and produce the site's GRID/ISLAND mode.
 * @returns GridModeState (always defined; null fields when not yet wired)
 */
export function useGridMode(): GridModeState {
  const { view } = useTopologyView();
  const { siteId } = useDeploymentIdentity();

  const topics = useMemo(() => {
    if (!view) return [];
    const list: string[] = [];
    for (const [deviceId, device] of Object.entries(view.devices)) {
      if (device.template !== "grid_module") continue;
      const tpl = view.templates_used[device.template];
      if (!tpl) continue;
      for (const meas of ["interconnect_state", "net_active_power"]) {
        const m = tpl.measurements[meas];
        if (m)
          list.push(measurementTopic(siteId, deviceId, meas, m.unit as TopicUnit));
      }
    }
    return list;
  }, [view, siteId]);

  const messages = useAggregateMeasurements<number | string>(topics);

  return useMemo(() => {
    if (!view || topics.length === 0) return DEFAULT_STATE;

    let interconnectRaw: string | undefined;
    let netPower: number | null = null;
    for (const topic of topics) {
      const msg = messages[topic];
      if (!msg) continue;
      if (
        topic.includes("/grid_module") &&
        topic.endsWith("/interconnect_state/none")
      ) {
        if (typeof msg.value === "string") interconnectRaw = msg.value;
      } else if (
        topic.includes("/grid_module") &&
        topic.endsWith("/net_active_power/watts")
      ) {
        if (typeof msg.value === "number") netPower = msg.value;
      }
    }

    const interconnect = fromInterconnectState(interconnectRaw);
    const mode = interconnect?.mode ?? null;

    const netAtMeter = (() => {
      if (netPower === null) return "";
      const direction = netPower >= 0 ? "IMPORT" : "EXPORT";
      const sign = netPower >= 0 ? "+" : "−";
      const abs = Math.abs(netPower);
      const magnitude =
        abs >= 1_000_000
          ? `${(abs / 1_000_000).toFixed(1)} MW`
          : `${(abs / 1000).toFixed(0)} kW`;
      return `${sign}${magnitude} ${direction}`;
    })();

    if (mode === "ISLAND") {
      return {
        mode: "ISLAND",
        islandQualifier: interconnect?.islandQualifier ?? "fault",
        direction: null,
        netAtMeter,
        netActivePowerW: netPower,
      };
    }

    const direction: "IMP" | "EXP" | null =
      netPower === null || Math.abs(netPower) < 100
        ? null
        : netPower > 0
          ? "IMP"
          : "EXP";

    return {
      mode: mode ?? "GRID",
      islandQualifier: null,
      direction,
      netAtMeter,
      netActivePowerW: netPower,
    };
  }, [view, topics, messages]);
}
