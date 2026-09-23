/**
 * useAlarms — derive the active-alarm list from topology + live values.
 *
 * One classifier: per-measurement `thresholds` envelope
 *   value ∈ (alarm_min, warn_min) ∪ (warn_max, alarm_max) → "warn"
 *   value <= alarm_min OR value >= alarm_max              → "alarm"
 *
 * Per constitution rule 3.12 the row label is the device ID.
 *
 * Deferred:
 *  - Ack state — needs a per-alarm acknowledgement store.
 *  - Fire severity — explicit enum value or template-level metadata.
 *  - Latency / debounce — hysteresis / cool-down per measurement.
 */

import { useMemo } from "react";
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
  /** Severity derived from thresholds. */
  severity: AlarmSeverity;
  /** Pre-formatted display value (e.g. "4.21 V"). */
  displayValue: string;
  /** Most-recent message timestamp (ISO). */
  ts: string;
}

interface Watch {
  topic: string;
  deviceId: string;
  deviceDisplayName: string;
  measurementName: string;
  measurementLabel: string;
  unit: string;
  thresholds: { warn_min: number; warn_max: number; alarm_min: number; alarm_max: number };
}

/**
 * Build the watch list: every float measurement with thresholds.
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
    for (const [measName, meas] of Object.entries(tpl.measurements)) {
      if (meas.type !== "float" || !meas.thresholds) continue;
      list.push({
        topic: measurementTopic(siteId, deviceId, measName, meas.unit as TopicUnit),
        deviceId,
        deviceDisplayName: device.display_name ?? deviceId,
        measurementName: measName,
        measurementLabel: meas.display_name_default ?? measName,
        unit: meas.unit,
        thresholds: meas.thresholds,
      });
    }
  }
  return list;
}

/**
 * Classify a numeric value against a threshold envelope.
 * @returns 'alarm' | 'warn' | null when within the warn band
 */
function classifyFloat(value: number, th: Watch["thresholds"]): AlarmSeverity | null {
  if (value < th.alarm_min || value > th.alarm_max) return "alarm";
  if (value < th.warn_min || value > th.warn_max) return "warn";
  return null;
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
  const messages = useAggregateMeasurements<number>(topics);

  return useMemo(() => {
    const active: ActiveAlarm[] = [];
    for (const w of watchList) {
      const msg = messages[w.topic];
      if (!msg || typeof msg.value !== "number") continue;
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
      });
    }
    // Sort alarms before warns; keep stable order otherwise.
    return active.sort((a, b) =>
      a.severity === b.severity ? 0 : a.severity === "alarm" ? -1 : 1,
    );
  }, [watchList, messages]);
}
