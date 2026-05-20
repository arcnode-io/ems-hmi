/**
 * useFleetKpis — derive the 4-6 status-strip values from topology + live
 * MQTT subscriptions. Constitution rule 3.5: every label here is a fleet
 * aggregate, so each carries a FLEET / GPU UTIL / GRID qualifier.
 *
 * Aggregations (initial set; more land as device templates grow):
 *  - FLEET SoC   — average of every bess_rack `state_of_charge`
 *  - GPU UTIL    — average of every compute_pod `gpu_utilization`
 *  - GRID        — label from grid_tap `active_power` sign + frequency
 *  - SITE        — `Nominal` when alarms = 0, otherwise highest-severity label
 *
 * Deferred (need history / out-of-scope this batch):
 *  - PUE 24h  — needs timeseries history
 *  - CLOCK    — needs incident tracking
 *
 * The hook is **topology-driven** — no hardcoded device IDs. If new BESS
 * devices land in the DTM, they participate in the FLEET SoC average
 * automatically on the next render.
 */

import { useMemo } from "react";
import { useTopologyView } from "../topology/useTopologyView";
import { useAggregateMeasurements } from "../mqtt/useAggregateMeasurements";
import { useDeploymentIdentity } from "../deployment/useDeploymentIdentity";
import { useAlarms } from "../alarms/useAlarms";
import { measurementTopic, type TopicUnit } from "../topics/topicBuilder";

export interface FleetKpis {
  /** Site-level status — highest active alarm severity, else "Nominal". */
  site: { label: "Nominal" | "Warn" | "Alarm" | "Fire" };
  /** Fleet average state-of-charge across all BESS racks. */
  fleetSoc: { value: number | null };
  /** Fleet average GPU utilization across all compute pods. */
  gpuUtil: { value: number | null };
  /**
   * Grid telemetry. `label` is the direction; `powerKw` is the magnitude
   * (positive = import / consuming from grid; negative = export / pushing back).
   */
  grid: {
    label: "Import" | "Export" | "Hold" | null;
    powerKw: number | null;
    frequencyHz: number | null;
  };
}

/**
 * Collect all topics that match `(templateKind, measurementName, unit)` for
 * a given template's devices.
 */
function topicsForMeasurement(
  view: ReturnType<typeof useTopologyView>["view"],
  siteId: string,
  templateName: string,
  measurementName: string,
): string[] {
  if (!view) return [];
  const tpl = view.templates_used[templateName];
  if (!tpl) return [];
  const meas = tpl.measurements[measurementName];
  if (!meas) return [];
  const matches: string[] = [];
  for (const [deviceId, dev] of Object.entries(view.devices)) {
    if (dev.template !== templateName) continue;
    matches.push(
      measurementTopic(siteId, deviceId, measurementName, meas.unit as TopicUnit),
    );
  }
  return matches;
}

/**
 * Average non-null numbers; null if no contributing values yet.
 */
function avg(values: (number | null)[]): number | null {
  const filtered = values.filter((v): v is number => v !== null);
  if (filtered.length === 0) return null;
  return filtered.reduce((a, b) => a + b, 0) / filtered.length;
}

/**
 * Hook returning the live fleet KPIs.
 * @returns FleetKpis object with each field nullable until first message arrives
 */
export function useFleetKpis(): FleetKpis {
  const { view } = useTopologyView();
  const { siteId } = useDeploymentIdentity();
  const alarms = useAlarms();

  // Fleet aggregates come from module-tier rollup measurements, not the
  // underlying leaf devices. useMemo keeps the topic lists stable so the
  // inner useAggregateMeasurements doesn't resubscribe on every render.
  const socTopics = useMemo(
    () => topicsForMeasurement(view, siteId, "bess_module", "state_of_charge"),
    [view, siteId],
  );
  const gpuTopics = useMemo(
    () => topicsForMeasurement(view, siteId, "compute_module", "gpu_utilization"),
    [view, siteId],
  );
  const gridPowerTopics = useMemo(
    () => topicsForMeasurement(view, siteId, "grid_module", "net_active_power"),
    [view, siteId],
  );
  const gridFreqTopics = useMemo(
    () => topicsForMeasurement(view, siteId, "grid_module", "grid_frequency"),
    [view, siteId],
  );

  const socMessages = useAggregateMeasurements<number>(socTopics);
  const gpuMessages = useAggregateMeasurements<number>(gpuTopics);
  const gridPowerMessages = useAggregateMeasurements<number>(gridPowerTopics);
  const gridFreqMessages = useAggregateMeasurements<number>(gridFreqTopics);

  const fleetSocAvg = avg(
    socTopics.map((t) => socMessages[t]?.value ?? null),
  );
  const gpuUtilAvg = avg(
    gpuTopics.map((t) => gpuMessages[t]?.value ?? null),
  );

  // Grid: take the sign of the first grid_tap's active_power. Positive =
  // power flowing INTO the site from the grid (Import). Negative = export.
  const gridPower = gridPowerTopics
    .map((t) => gridPowerMessages[t]?.value ?? null)
    .find((v): v is number => v !== null);
  const gridFreq = gridFreqTopics
    .map((t) => gridFreqMessages[t]?.value ?? null)
    .find((v): v is number => v !== null);
  const gridLabel =
    gridPower === undefined
      ? null
      : gridPower > 100
        ? "Import"
        : gridPower < -100
          ? "Export"
          : "Hold";

  const siteLabel: FleetKpis["site"]["label"] = alarms.some(
    (a) => a.severity === "alarm",
  )
    ? "Alarm"
    : alarms.some((a) => a.severity === "warn")
      ? "Warn"
      : "Nominal";

  return {
    site: { label: siteLabel },
    fleetSoc: { value: fleetSocAvg },
    gpuUtil: { value: gpuUtilAvg },
    grid: {
      label: gridLabel,
      powerKw: gridPower === undefined ? null : gridPower / 1000,
      frequencyHz: gridFreq ?? null,
    },
  };
}
