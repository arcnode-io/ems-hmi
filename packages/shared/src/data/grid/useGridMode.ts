/**
 * useGridMode — PCC breaker, site GRID/ISLAND mode, and net power at the
 * POI. Subscribes to:
 *
 *   - `protective_relay_*.breaker_closed` / `trip_status` (the SEL relay's
 *     52A + trip flag — the PCC breaker; GRID/ISLAND derives from it)
 *   - `poi_meter_*.active_power` (net at the POI, + import / − export)
 *
 * This hook is the single source for the breaker: useGridState reads
 * breakerState from here. The utility's operating envelope lives in
 * useOperatingEnvelope.
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
export type BreakerState = "OPEN" | "CLOSED" | "TRIPPED";

export interface GridModeState {
  /** GRID (breaker closed) vs ISLAND (open). */
  mode: GridMode | null;
  /** Planned (opened, no trip) vs fault (tripped). Null unless islanded. */
  islandQualifier: IslandQualifier | null;
  /**
   * PCC breaker as three states — collapsing to open/closed would render a
   * real trip as a plain "OPEN", hiding the distinction that matters most.
   */
  breakerState: BreakerState | null;
  /** Net flow direction at the POI; null when ~zero or unknown. */
  direction: "IMP" | "EXP" | null;
  /** Pre-formatted net-at-POI reading, e.g. "+142 kW IMPORT"; "" until known. */
  netAtMeter: string;
  /** Raw poi_meter active_power in watts, signed (+import/−export). */
  netActivePowerW: number | null;
}

const DEFAULT_STATE: GridModeState = {
  mode: null,
  islandQualifier: null,
  breakerState: null,
  direction: null,
  netAtMeter: "",
  netActivePowerW: null,
};

type Breaker = Pick<GridModeState, "mode" | "islandQualifier" | "breakerState">;

/**
 * Derive the PCC breaker from the relay's two flags. A closed breaker is
 * GRID whatever the (latched) trip flag says; a trip only matters once the
 * breaker is open, where it separates a fault island from a planned one.
 * @param closed breaker_closed, undefined until it arrives
 * @param tripped trip_status, undefined if not (yet) reported
 * @returns breaker + mode, or null while breaker_closed is unknown
 */
export function fromBreaker(closed: boolean | undefined, tripped: boolean | undefined): Breaker | null {
  if (closed === undefined) return null;
  if (closed) return { mode: "GRID", islandQualifier: null, breakerState: "CLOSED" };
  return tripped === true
    ? { mode: "ISLAND", islandQualifier: "fault", breakerState: "TRIPPED" }
    : { mode: "ISLAND", islandQualifier: "planned", breakerState: "OPEN" };
}

/** Watts → "+142 kW IMPORT" / "−1.2 MW EXPORT". */
function fmtNetAtMeter(watts: number): string {
  const abs = Math.abs(watts);
  const magnitude = abs >= 1_000_000 ? `${(abs / 1_000_000).toFixed(1)} MW` : `${(abs / 1000).toFixed(0)} kW`;
  return `${watts >= 0 ? "+" : "−"}${magnitude} ${watts >= 0 ? "IMPORT" : "EXPORT"}`;
}

const SOURCES: Readonly<Record<string, readonly string[]>> = {
  protective_relay: ["breaker_closed", "trip_status"],
  poi_meter: ["active_power"],
};

/**
 * Subscribe to the relay + POI meter and produce the site's grid state.
 * @returns GridModeState (always defined; null fields when not yet wired)
 */
export function useGridMode(): GridModeState {
  const { view } = useTopologyView();
  const { siteId } = useDeploymentIdentity();

  const topics = useMemo(() => {
    if (!view) return [];
    const list: string[] = [];
    for (const [deviceId, device] of Object.entries(view.devices)) {
      const tpl = view.templates_used[device.template];
      for (const meas of SOURCES[device.template] ?? []) {
        const m = tpl?.measurements[meas];
        if (m) list.push(measurementTopic(siteId, deviceId, meas, m.unit as TopicUnit));
      }
    }
    return list;
  }, [view, siteId]);

  const messages = useAggregateMeasurements<number | boolean>(topics);

  return useMemo(() => {
    if (!view || topics.length === 0) return DEFAULT_STATE;

    let closed: boolean | undefined;
    let tripped: boolean | undefined;
    let netPower: number | null = null;
    for (const topic of topics) {
      const v = messages[topic]?.value;
      if (topic.endsWith("/breaker_closed/none") && typeof v === "boolean") closed = v;
      else if (topic.endsWith("/trip_status/none") && typeof v === "boolean") tripped = v;
      else if (topic.endsWith("/active_power/watts") && typeof v === "number") netPower = v;
    }

    const breaker = fromBreaker(closed, tripped);
    const islanded = breaker?.mode === "ISLAND";
    const direction: "IMP" | "EXP" | null =
      islanded || netPower === null || Math.abs(netPower) < 100 ? null : netPower > 0 ? "IMP" : "EXP";

    return {
      mode: breaker?.mode ?? null,
      islandQualifier: breaker?.islandQualifier ?? null,
      breakerState: breaker?.breakerState ?? null,
      direction,
      netAtMeter: netPower === null ? "" : fmtNetAtMeter(netPower),
      netActivePowerW: netPower,
    };
  }, [view, topics, messages]);
}
