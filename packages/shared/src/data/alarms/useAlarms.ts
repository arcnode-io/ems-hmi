/**
 * useAlarms — derive the active-alarm list from topology + live values.
 *
 * For every float measurement on every device, compare the latest value
 * against the per-measurement `thresholds` envelope:
 *
 *   value ∈ (alarm_min, warn_min) ∪ (warn_max, alarm_max) → severity "warn"
 *   value <= alarm_min OR value >= alarm_max              → severity "alarm"
 *
 * The hook is topology-driven — no hardcoded device list. Threshold tripping
 * derives from the bounds shipped in `/topology/view`, not from a per-screen
 * config.
 *
 * Deferred:
 *  - Ack state — needs a per-alarm acknowledgement store.
 *  - Fire severity — requires either an explicit enum value (BMS reporting
 *    "thermal_runaway") or template-level metadata declaring which range
 *    promotes to fire. Out of scope until a class YAML demands it.
 *  - Latency / debounce — the same value can flap across the threshold.
 *    Future: hysteresis / cool-down per measurement.
 */

import { useMemo } from "react";
import { useTopologyView } from "../topology/useTopologyView";
import { useAggregateMeasurements } from "../mqtt/useAggregateMeasurements";
import { measurementTopic, type TopicUnit } from "../topics/topicBuilder";

const SITE_ID = "demo_site";

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
  /** Severity derived from threshold envelope. */
  severity: AlarmSeverity;
  /** Latest value that tripped the threshold. */
  value: number;
  /** Display unit. */
  unit: string;
  /** Most-recent message timestamp (ISO). */
  ts: string;
}

interface WatchEntry {
  topic: string;
  deviceId: string;
  deviceDisplayName: string;
  measurementName: string;
  measurementLabel: string;
  unit: string;
  thresholds: { warn_min: number; warn_max: number; alarm_min: number; alarm_max: number };
}

/**
 * Build the list of (topic, threshold) pairs we need to watch for alarm
 * derivation. One entry per float measurement that has thresholds defined.
 */
function buildWatchList(
  view: ReturnType<typeof useTopologyView>["view"],
): WatchEntry[] {
  if (!view) return [];
  const list: WatchEntry[] = [];
  for (const [deviceId, device] of Object.entries(view.devices)) {
    const tpl = view.templates_used[device.template];
    if (!tpl) continue;
    for (const [measName, meas] of Object.entries(tpl.measurements)) {
      if (meas.type !== "float") continue;
      if (!meas.thresholds) continue;
      list.push({
        topic: measurementTopic(
          SITE_ID,
          deviceId,
          measName,
          meas.unit as TopicUnit,
        ),
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
 * Classify a value against a threshold envelope.
 * @param value Latest reading
 * @param th Threshold envelope (warn_min/warn_max/alarm_min/alarm_max)
 * @returns 'alarm' | 'warn' | null when within the warn band
 */
function classify(
  value: number,
  th: WatchEntry["thresholds"],
): AlarmSeverity | null {
  // Reason: strict comparisons. At boundary (value === warn_min) the
  // measurement is at the edge of nominal — not yet tripping. The Mock
  // driver clamps to exactly warn_min/warn_max, so `<=`/`>=` would
  // false-positive alarm/clear every tick → badge flicker. Matches docstring.
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
  const watchList = useMemo(() => buildWatchList(view), [view]);
  const topics = useMemo(() => watchList.map((w) => w.topic), [watchList]);
  const messages = useAggregateMeasurements<number>(topics);

  return useMemo(() => {
    const active: ActiveAlarm[] = [];
    for (const w of watchList) {
      const msg = messages[w.topic];
      if (!msg) continue;
      const severity = classify(msg.value, w.thresholds);
      if (!severity) continue;
      active.push({
        deviceId: w.deviceId,
        deviceDisplayName: w.deviceDisplayName,
        measurementName: w.measurementName,
        measurementLabel: w.measurementLabel,
        severity,
        value: msg.value,
        unit: w.unit,
        ts: msg.ts,
      });
    }
    // Sort alarms before warns; keep stable order otherwise.
    return active.sort((a, b) =>
      a.severity === b.severity ? 0 : a.severity === "alarm" ? -1 : 1,
    );
  }, [watchList, messages]);
}
