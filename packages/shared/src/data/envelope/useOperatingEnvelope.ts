/**
 * useOperatingEnvelope — surface utility-side feeds (DOE + grid mode) for
 * the chrome + Overview surfaces. Subscribes to:
 *
 *   - `operating_envelope_*.import_limit` / `export_limit` / `status`
 *   - `grid_module_*.mode`  (GRID vs ISLAND)
 *   - `grid_module_*.net_active_power` (for headroom delta vs import_limit)
 *
 * Output is the shape the new DOEHeadroomRow + Stranded Capacity Grid row
 * + Status Strip GRID segment consume. Per constitution 3.11 ISLAND
 * mode marks the constraint as `n/a`, never `—` (semantically distinct
 * from missing data).
 */

import { useMemo } from "react";
import { useTopologyView } from "../topology/useTopologyView";
import { useAggregateMeasurements } from "../mqtt/useAggregateMeasurements";
import { measurementTopic, type TopicUnit } from "../topics/topicBuilder";
import type { DOEState } from "../../components/composed/DOEHeadroomRow/DOEHeadroomRow";

const SITE_ID = "demo-site";

export type GridMode = "GRID" | "ISLAND";

export interface OperatingEnvelope {
  /** Site mode — GRID (utility-tied) vs ISLAND (utility severed). */
  mode: GridMode | null;
  /** DOE state — collapses the enum into the DOEHeadroomRow domain. */
  doeState: DOEState;
  /** Currently active flow direction. null when net-zero or unknown. */
  direction: "IMP" | "EXP" | null;
  /** Pre-formatted active-direction headroom magnitude (e.g. "3.2 MW"). */
  headroom: string;
  /** Pre-formatted counter-direction headroom magnitude. */
  counterHeadroom: string;
  /** Fraction of import_limit consumed, [0..1]. Null when n/a. */
  usedFraction: number | null;
  /**
   * Pre-formatted settlement reading at the POI revenue meter, e.g.
   * "+142 kW IMPORT". Empty string when no revenue_meter subscription.
   * Used by the SLD POI node primary-value slot.
   */
  settlement: string;
  /** Raw import_limit in kW. Used as a chart threshold by Energy. */
  importLimitKw: number | null;
  /** Raw export_limit in kW (negative = export ceiling). */
  exportLimitKw: number | null;
}

const DEFAULT_ENVELOPE: OperatingEnvelope = {
  mode: null,
  doeState: "ok",
  direction: null,
  headroom: "—",
  counterHeadroom: "—",
  usedFraction: null,
  settlement: "",
  importLimitKw: null,
  exportLimitKw: null,
};

/**
 * Map enum string to canonical DOEState.
 */
function asDoeState(raw: string | undefined): DOEState {
  if (raw === "STALE") return "stale";
  if (raw === "INVALID") return "invalid";
  if (raw === "COMM_FAIL") return "comm-fail";
  return "ok";
}

/**
 * Format watts to either MW (>=1MW) or kW (smaller) with 1 decimal.
 */
function fmtPower(watts: number | null): string {
  if (watts === null || !Number.isFinite(watts)) return "—";
  const abs = Math.abs(watts);
  if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(1)} MW`;
  return `${(abs / 1000).toFixed(0)} kW`;
}

/**
 * Subscribe to utility-side feeds and produce the operating envelope.
 * @returns OperatingEnvelope (always defined; null fields when not yet wired)
 */
export function useOperatingEnvelope(): OperatingEnvelope {
  const { view } = useTopologyView();

  // Build topic list — operating_envelope (import/export/status), grid_module
  // (mode + net_active_power). Topics deduplicated by Set then sorted for
  // stable subscription identity.
  const topics = useMemo(() => {
    if (!view) return [];
    const list: string[] = [];
    for (const [deviceId, device] of Object.entries(view.devices)) {
      const tpl = view.templates_used[device.template];
      if (!tpl) continue;
      if (device.template === "operating_envelope") {
        for (const meas of ["import_limit", "export_limit", "status"]) {
          const m = tpl.measurements[meas];
          if (m) list.push(measurementTopic(SITE_ID, deviceId, meas, m.unit as TopicUnit));
        }
      }
      if (device.template === "grid_module") {
        for (const meas of ["mode", "net_active_power"]) {
          const m = tpl.measurements[meas];
          if (m) list.push(measurementTopic(SITE_ID, deviceId, meas, m.unit as TopicUnit));
        }
      }
      if (device.template === "revenue_meter") {
        const m = tpl.measurements["settlement_power"];
        if (m) list.push(measurementTopic(SITE_ID, deviceId, "settlement_power", m.unit as TopicUnit));
      }
    }
    return list;
  }, [view]);

  const messages = useAggregateMeasurements<number | string>(topics);

  return useMemo(() => {
    if (!view || topics.length === 0) return DEFAULT_ENVELOPE;

    // Resolve mode + DOE state + active power from the first matching topic.
    let mode: GridMode | null = null;
    let doeStatusRaw: string | undefined;
    let netPower: number | null = null;
    let importLimit: number | null = null;
    let exportLimit: number | null = null;
    let settlementW: number | null = null;
    for (const topic of topics) {
      const msg = messages[topic];
      if (!msg) continue;
      if (topic.includes("/grid_module") && topic.endsWith("/mode/none")) {
        mode = msg.value === "ISLAND" ? "ISLAND" : "GRID";
      } else if (topic.includes("/grid_module") && topic.endsWith("/net_active_power/watts")) {
        if (typeof msg.value === "number") netPower = msg.value;
      } else if (topic.includes("/operating_envelope") && topic.endsWith("/status/none")) {
        if (typeof msg.value === "string") doeStatusRaw = msg.value;
      } else if (topic.includes("/operating_envelope") && topic.endsWith("/import_limit/watts")) {
        if (typeof msg.value === "number") importLimit = msg.value;
      } else if (topic.includes("/operating_envelope") && topic.endsWith("/export_limit/watts")) {
        if (typeof msg.value === "number") exportLimit = msg.value;
      } else if (topic.includes("/revenue_meter") && topic.endsWith("/settlement_power/watts")) {
        if (typeof msg.value === "number") settlementW = msg.value;
      }
    }

    // Settlement string: signed kW or MW + direction word.
    const settlement = (() => {
      if (settlementW === null) return "";
      const direction = settlementW >= 0 ? "IMPORT" : "EXPORT";
      const sign = settlementW >= 0 ? "+" : "−";
      const abs = Math.abs(settlementW);
      const magnitude =
        abs >= 1_000_000
          ? `${(abs / 1_000_000).toFixed(1)} MW`
          : `${(abs / 1000).toFixed(0)} kW`;
      return `${sign}${magnitude} ${direction}`;
    })();

    const doeState: DOEState = mode === "ISLAND" ? "island" : asDoeState(doeStatusRaw);

    const importLimitKw = importLimit === null ? null : importLimit / 1000;
    const exportLimitKw = exportLimit === null ? null : -exportLimit / 1000;

    if (doeState === "island") {
      return {
        mode: "ISLAND",
        doeState,
        direction: null,
        headroom: "—",
        counterHeadroom: "—",
        usedFraction: null,
        settlement,
        importLimitKw,
        exportLimitKw,
      };
    }

    // Direction comes from net power sign (positive = import).
    const direction: "IMP" | "EXP" | null =
      netPower === null || Math.abs(netPower) < 100
        ? null
        : netPower > 0
          ? "IMP"
          : "EXP";

    // Headroom = limit - |currentFlow| in active direction.
    const importHeadroomW =
      importLimit !== null && netPower !== null
        ? Math.max(0, importLimit - Math.max(0, netPower))
        : null;
    const exportHeadroomW =
      exportLimit !== null && netPower !== null
        ? Math.max(0, exportLimit + Math.min(0, netPower))
        : null;

    const headroomW = direction === "EXP" ? exportHeadroomW : importHeadroomW;
    const counterW = direction === "EXP" ? importHeadroomW : exportHeadroomW;
    const usedFraction =
      importLimit !== null && netPower !== null && importLimit > 0
        ? Math.min(1, Math.max(0, Math.max(0, netPower) / importLimit))
        : null;

    return {
      mode: mode ?? "GRID",
      doeState,
      direction,
      headroom: fmtPower(headroomW),
      counterHeadroom: fmtPower(counterW),
      usedFraction,
      settlement,
      importLimitKw,
      exportLimitKw,
    };
  }, [view, topics, messages]);
}
