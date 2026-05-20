/**
 * useAlarms — derive the active-alarm list from topology + live values.
 *
 * Two classifier paths, one unified list:
 *
 *   Float-threshold: per-measurement `thresholds` envelope
 *     value ∈ (alarm_min, warn_min) ∪ (warn_max, alarm_max) → "warn"
 *     value <= alarm_min OR value >= alarm_max              → "alarm"
 *
 *   Enum-status: utility-side feed `status` enums (DOE / DLR)
 *     "OK"                  → no alarm
 *     "STALE"               → "warn"
 *     "INVALID" / "COMM_FAIL" → "alarm"
 *
 * Per constitution rule 3.12 the row label is still the device ID;
 * alarms from utility-side feeds carry `category: "UTILITY"` so the
 * AlarmRow surface can render the small category chip.
 *
 * Deferred:
 *  - Ack state — needs a per-alarm acknowledgement store.
 *  - Fire severity — explicit enum value or template-level metadata.
 *  - Latency / debounce — hysteresis / cool-down per measurement.
 */

import { useMemo } from "react";
import { match } from "ts-pattern";
import { useTopologyView } from "../topology/useTopologyView";
import { useAggregateMeasurements } from "../mqtt/useAggregateMeasurements";
import { useDeploymentIdentity } from "../deployment/useDeploymentIdentity";
import { measurementTopic, type TopicUnit } from "../topics/topicBuilder";

export type AlarmSeverity = "warn" | "alarm";

export interface ActiveAlarm {
  /** Owning device id (DTM slug). */
  deviceId: string;
  /** Display name from `/topology/view`, fall back to device_id. */
  deviceDisplayName: string;
  /** Measurement name (per template). */
  measurementName: string;
  /** Humanized measurement label, from `display_name_default`. */
  measurementLabel: string;
  /** Severity derived from threshold/status. */
  severity: AlarmSeverity;
  /** Pre-formatted display value (e.g. "4.21 V" or "STALE"). */
  displayValue: string;
  /** Most-recent message timestamp (ISO). */
  ts: string;
  /**
   * Optional origin category — "UTILITY" for DOE / DLR feeds. Renders
   * as a small chip in AlarmRow per rule 3.12 (label is index,
   * diagnosis lives in the runbook).
   */
  category?: string;
}

interface FloatWatch {
  kind: "float";
  topic: string;
  deviceId: string;
  deviceDisplayName: string;
  measurementName: string;
  measurementLabel: string;
  unit: string;
  thresholds: { warn_min: number; warn_max: number; alarm_min: number; alarm_max: number };
  category?: string;
}

interface EnumWatch {
  kind: "status-enum";
  topic: string;
  deviceId: string;
  deviceDisplayName: string;
  measurementName: string;
  measurementLabel: string;
  category?: string;
}

type Watch = FloatWatch | EnumWatch;

/**
 * Templates that surface as UTILITY alarms per rule 3.12.
 */
const UTILITY_TEMPLATES = new Set(["operating_envelope", "line_rating", "revenue_meter"]);

/**
 * Build the watch list: every float measurement with thresholds, plus
 * every `status` enum on a utility-side feed template.
 */
function buildWatchList(
  view: ReturnType<typeof useTopologyView>["view"],
  siteId: string,
): Watch[] {
  if (!view) return [];
  const list: Watch[] = [];
  for (const [deviceId, device] of Object.entries(view.devices)) {
    const tpl = view.templates_used[device.template];
    if (!tpl) continue;
    const category = UTILITY_TEMPLATES.has(device.template) ? "UTILITY" : undefined;
    for (const [measName, meas] of Object.entries(tpl.measurements)) {
      if (meas.type === "float" && meas.thresholds) {
        list.push({
          kind: "float",
          topic: measurementTopic(siteId, deviceId, measName, meas.unit as TopicUnit),
          deviceId,
          deviceDisplayName: device.display_name ?? deviceId,
          measurementName: measName,
          measurementLabel: meas.display_name_default ?? measName,
          unit: meas.unit,
          thresholds: meas.thresholds,
          category,
        });
      } else if (
        meas.type === "enum" &&
        measName === "status" &&
        category === "UTILITY"
      ) {
        list.push({
          kind: "status-enum",
          topic: measurementTopic(siteId, deviceId, measName, meas.unit as TopicUnit),
          deviceId,
          deviceDisplayName: device.display_name ?? deviceId,
          measurementName: measName,
          measurementLabel: meas.display_name_default ?? measName,
          category,
        });
      }
    }
  }
  return list;
}

/**
 * Classify a numeric value against a threshold envelope.
 * @returns 'alarm' | 'warn' | null when within the warn band
 */
function classifyFloat(
  value: number,
  th: FloatWatch["thresholds"],
): AlarmSeverity | null {
  if (value < th.alarm_min || value > th.alarm_max) return "alarm";
  if (value < th.warn_min || value > th.warn_max) return "warn";
  return null;
}

/**
 * Classify a status-enum string per UTILITY-FEEDS §7 severity mapping.
 */
function classifyStatus(value: string): AlarmSeverity | null {
  return match(value)
    .with("STALE", () => "warn" as const)
    .with("INVALID", () => "alarm" as const)
    .with("COMM_FAIL", () => "alarm" as const)
    .otherwise(() => null);
}

/**
 * Hook returning the active alarms, sorted alarm-first.
 * @returns Array of active alarms; empty when nothing is tripping
 */
export function useAlarms(): ActiveAlarm[] {
  const { view } = useTopologyView();
  const { siteId } = useDeploymentIdentity();
  const watchList = useMemo(() => buildWatchList(view, siteId), [view, siteId]);
  const topics = useMemo(() => watchList.map((w) => w.topic), [watchList]);
  const messages = useAggregateMeasurements<number | string>(topics);

  return useMemo(() => {
    const active: ActiveAlarm[] = [];
    for (const w of watchList) {
      const msg = messages[w.topic];
      if (!msg) continue;
      if (w.kind === "float" && typeof msg.value === "number") {
        const severity = classifyFloat(msg.value, w.thresholds);
        if (!severity) continue;
        active.push({
          deviceId: w.deviceId,
          deviceDisplayName: w.deviceDisplayName,
          measurementName: w.measurementName,
          measurementLabel: w.measurementLabel,
          severity,
          displayValue: `${msg.value.toFixed(2)} ${w.unit}`,
          ts: msg.ts,
          category: w.category,
        });
      } else if (w.kind === "status-enum" && typeof msg.value === "string") {
        const severity = classifyStatus(msg.value);
        if (!severity) continue;
        active.push({
          deviceId: w.deviceId,
          deviceDisplayName: w.deviceDisplayName,
          measurementName: w.measurementName,
          measurementLabel: `${w.measurementLabel} ${msg.value.replace("_", " ").toLowerCase()}`,
          severity,
          displayValue: msg.value,
          ts: msg.ts,
          category: w.category,
        });
      }
    }
    // Sort alarms before warns; keep stable order otherwise.
    return active.sort((a, b) =>
      a.severity === b.severity ? 0 : a.severity === "alarm" ? -1 : 1,
    );
  }, [watchList, messages]);
}
