/**
 * useFleetKpis — derive the 4-6 status-strip values from topology + live
 * MQTT subscriptions. Constitution rule 3.5: every label here is a fleet
 * aggregate, so each carries a FLEET / GRID qualifier.
 *
 * Aggregations (initial set; more land as device templates grow):
 *  - FLEET SoC   — average of every bess_module `state_of_charge`
 *  - BESS power  — sum of every bess_module `active_power`
 *  - Compute     — sum of every compute_module `total_power`
 *  - GRID        — label from grid_tap `active_power` sign + frequency
 *  - SITE        — siteHealth level (Nominal needs every monitored reading in)
 *
 * Fleet sums/averages are unknown (null) until every device reports.
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
import { useSiteHealth } from "../alarms/useSiteHealth";
import type { SiteHealth } from "../alarms/siteHealth";
import { measurementTopic, type TopicUnit } from "../topics/topicBuilder";

export type SiteLabel = "Nominal" | "Warn" | "Alarm" | "Unknown";

const SITE_LABEL: Record<SiteHealth["level"], SiteLabel> = {
  nominal: "Nominal",
  warn: "Warn",
  alarm: "Alarm",
  unknown: "Unknown",
};

export interface FleetKpis {
  /** Site-level status — see siteHealth: "Nominal" needs proof, else "Unknown". */
  site: { label: SiteLabel };
  /** Fleet average state-of-charge across all BESS racks. */
  fleetSoc: { value: number | null };
  /** Summed bess_module active_power, W (+ discharge / - charge). */
  bess: { powerW: number | null };
  /** Summed compute_module total_power (PDU input — container total), W. */
  compute: { powerW: number | null };
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

/** Sum, or null unless every device has reported (constitution §3.4). */
export function sumIfComplete(values: readonly (number | null)[]): number | null {
  if (values.length === 0 || values.includes(null)) return null;
  return (values as number[]).reduce((a, b) => a + b, 0);
}

/** Average, or null unless every device has reported. */
export function avgIfComplete(values: readonly (number | null)[]): number | null {
  const sum = sumIfComplete(values);
  return sum === null ? null : sum / values.length;
}

/**
 * Hook returning the live fleet KPIs.
 * @returns FleetKpis object with each field nullable until first message arrives
 */
export function useFleetKpis(): FleetKpis {
  const { view } = useTopologyView();
  const { siteId } = useDeploymentIdentity();
  const health = useSiteHealth();

  // Fleet aggregates come from module-tier rollup measurements, not the
  // underlying leaf devices. useMemo keeps the topic lists stable so the
  // inner useAggregateMeasurements doesn't resubscribe on every render.
  const socTopics = useMemo(
    () => topicsForMeasurement(view, siteId, "bess_module", "state_of_charge"),
    [view, siteId],
  );
  const computePowerTopics = useMemo(
    () => topicsForMeasurement(view, siteId, "compute_module", "total_power"),
    [view, siteId],
  );
  const bessPowerTopics = useMemo(
    () => topicsForMeasurement(view, siteId, "bess_module", "active_power"),
    [view, siteId],
  );
  const gridPowerTopics = useMemo(
    () => topicsForMeasurement(view, siteId, "poi_meter", "active_power"),
    [view, siteId],
  );
  const gridFreqTopics = useMemo(
    () => topicsForMeasurement(view, siteId, "grid_module", "grid_frequency"),
    [view, siteId],
  );

  const socMessages = useAggregateMeasurements<number>(socTopics);
  const bessPowerMessages = useAggregateMeasurements<number>(bessPowerTopics);
  const computePowerMessages = useAggregateMeasurements<number>(computePowerTopics);
  const gridPowerMessages = useAggregateMeasurements<number>(gridPowerTopics);
  const gridFreqMessages = useAggregateMeasurements<number>(gridFreqTopics);

  const fleetSocAvg = avgIfComplete(socTopics.map((t) => socMessages[t]?.value ?? null));
  const bessPowerW = sumIfComplete(bessPowerTopics.map((t) => bessPowerMessages[t]?.value ?? null));
  const computePowerW = sumIfComplete(computePowerTopics.map((t) => computePowerMessages[t]?.value ?? null));
  // Grid: net power at the POI meter. Positive = power flowing INTO the
  // site from the grid (Import). Negative = export.
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

  const siteLabel = SITE_LABEL[health.level];

  return {
    site: { label: siteLabel },
    fleetSoc: { value: fleetSocAvg },
    bess: { powerW: bessPowerW },
    compute: { powerW: computePowerW },
    grid: {
      label: gridLabel,
      powerKw: gridPower === undefined ? null : gridPower / 1000,
      frequencyHz: gridFreq ?? null,
    },
  };
}
