/**
 * useModuleRows — derive the per-device rows the Modules screen renders.
 * Walks the topology view, maps each device to its ModuleType, pulls the
 * three template-specific metrics from live MQTT, and folds in alarm
 * severity + counts from useAlarms().
 *
 * The metric set per template is hand-curated — operators want THREE
 * signals at a glance, chosen per device class. Extend the METRIC_SPEC
 * table when a new template lands.
 */

import { useMemo } from "react";
import { match } from "ts-pattern";
import { useTopologyView } from "../../../data/topology/useTopologyView";
import { useAlarms, type ActiveAlarm } from "../../../data/alarms/useAlarms";
import { useAggregateMeasurements } from "../../../data/mqtt/useAggregateMeasurements";
import { measurementTopic, type TopicUnit } from "../../../data/topics/topicBuilder";
import type { ModuleType, ModuleMeasurement } from "../../../components/composed/ModuleCard/ModuleCard";
import type { StatusVariant } from "../../../components/composed/StatusBadge/StatusBadge";

const SITE_ID = "demo_site";

export interface ModuleRow {
  id: string;
  moduleType: ModuleType;
  displayName: string;
  sub: string;
  status: StatusVariant;
  alarmCount: number;
  measurements: ModuleMeasurement[];
}

interface MetricSpec {
  label: string;
  measurementName: string;
  unit: string;
  colorHint?: string;
  /** Override formatter; default Math.round(value). */
  format?: (v: number) => string;
}

/**
 * Per-template: the three at-a-glance metrics to display. Each entry's
 * `measurementName` MUST exist on the template (else cell renders as "—").
 */
const METRIC_SPEC: Record<string, MetricSpec[]> = {
  bess_module: [
    { label: "SoC", measurementName: "state_of_charge", unit: "%", colorHint: "bess" },
    { label: "Power", measurementName: "active_power", unit: "kW", format: (v) => `${(v / 1000).toFixed(1)}` },
    { label: "Headroom", measurementName: "import_headroom", unit: "MW", format: (v) => `${(v / 1_000_000).toFixed(1)}` },
  ],
  compute_module: [
    { label: "Util", measurementName: "gpu_utilization", unit: "%", colorHint: "compute" },
    { label: "Draw", measurementName: "active_power", unit: "kW", format: (v) => `${(v / 1000).toFixed(1)}` },
  ],
  grid_module: [
    { label: "Net", measurementName: "net_active_power", unit: "kW", colorHint: "grid", format: (v) => `${(v / 1000).toFixed(1)}` },
    { label: "Freq", measurementName: "grid_frequency", unit: "Hz", format: (v) => v.toFixed(2) },
  ],
};

function templateToModuleType(templateName: string): ModuleType | null {
  return match(templateName)
    .with("bess_module", () => "bess" as const)
    .with("compute_module", () => "compute" as const)
    .with("grid_module", () => "grid" as const)
    .otherwise(() => null);
}

function statusFromAlarms(alarms: ActiveAlarm[]): StatusVariant {
  if (alarms.some((a) => a.severity === "alarm")) return "alarm";
  if (alarms.some((a) => a.severity === "warn")) return "warn";
  return "ok";
}

/**
 * Hook returning the rows the Modules screen renders, derived from live
 * topology + measurements + alarms.
 * @returns ModuleRow[] — empty until topology loads
 */
export function useModuleRows(): ModuleRow[] {
  const { view } = useTopologyView();
  const allAlarms = useAlarms();

  // Build the union of topics this screen needs (one per displayed metric).
  const topics = useMemo(() => {
    if (!view) return [];
    const list: string[] = [];
    for (const [deviceId, device] of Object.entries(view.devices)) {
      const tpl = view.templates_used[device.template];
      if (!tpl) continue;
      const specs = METRIC_SPEC[device.template] ?? [];
      for (const s of specs) {
        const meas = tpl.measurements[s.measurementName];
        if (!meas) continue;
        list.push(
          measurementTopic(SITE_ID, deviceId, s.measurementName, meas.unit as TopicUnit),
        );
      }
    }
    return list;
  }, [view]);

  const messages = useAggregateMeasurements<number>(topics);

  return useMemo(() => {
    if (!view) return [];
    const out: ModuleRow[] = [];
    for (const [deviceId, device] of Object.entries(view.devices)) {
      const tpl = view.templates_used[device.template];
      if (!tpl) continue;
      // Reason: constitution rule 3.15 — /modules shows operator-owned
      // hardware only. `kind: leaf` devices (utility-side feeds, sub-
      // component sensors) surface contextually elsewhere.
      if (tpl.kind !== "module") continue;
      const moduleType = templateToModuleType(device.template);
      if (!moduleType) continue;
      const deviceAlarms = allAlarms.filter((a) => a.deviceId === deviceId);
      const specs = METRIC_SPEC[device.template] ?? [];
      const measurements: ModuleMeasurement[] = specs.map((s) => {
        const meas = tpl.measurements[s.measurementName];
        if (!meas) {
          return { label: s.label, value: "—", unit: "", colorHint: "soft" };
        }
        const topic = measurementTopic(
          SITE_ID,
          deviceId,
          s.measurementName,
          meas.unit as TopicUnit,
        );
        const msg = messages[topic];
        if (!msg) {
          return { label: s.label, value: "—", unit: s.unit, colorHint: "soft" };
        }
        const value = s.format ? s.format(msg.value) : Math.round(msg.value).toString();
        return { label: s.label, value, unit: s.unit, colorHint: s.colorHint };
      });
      out.push({
        id: deviceId,
        moduleType,
        displayName: device.display_name ?? deviceId,
        sub: tpl.description ?? `${moduleType} module`,
        status: statusFromAlarms(deviceAlarms),
        alarmCount: deviceAlarms.length,
        measurements,
      });
    }
    // Sort alarms first, then warns, then ok.
    const rank: Record<StatusVariant, number> = {
      fire: 0,
      alarm: 1,
      invalid: 1,
      "comm-fail": 1,
      warn: 2,
      stale: 2,
      maintenance: 3,
      sim: 4,
      ok: 5,
      offline: 6,
    };
    return out.sort((a, b) => rank[a.status] - rank[b.status]);
  }, [view, allAlarms, messages]);
}
