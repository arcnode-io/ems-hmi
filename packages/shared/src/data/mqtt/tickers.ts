/**
 * Ticker plan + random-walk maths for MockMqttProvider's rAF loop.
 *
 * One ticker per (device, measurement). Floats follow a mean-reverting walk
 * clamped inside the constitutional safe band; bools flip rarely; enums
 * cycle slowly. The provider services every ticker from a single rAF loop.
 */

import { measurementTopic, type TopicUnit } from "../topics/topicBuilder";
import type {
  TopologyViewType,
  MeasurementViewType,
} from "../topology/topology.schema";

export interface FloatTicker {
  kind: "float";
  topic: string;
  /** Carried so the dispatch simulator can be asked for an override. */
  deviceId: string;
  measurement: string;
  intervalMs: number;
  nextDueAt: number;
  bounds: { min: number; max: number; nominal: number };
  safeMin: number;
  safeMax: number;
  current: number;
}

export interface BoolTicker {
  kind: "bool";
  topic: string;
  intervalMs: number;
  nextDueAt: number;
  current: boolean;
}

export interface EnumTicker {
  kind: "enum";
  topic: string;
  intervalMs: number;
  nextDueAt: number;
  values: string[];
  index: number;
}

export type Ticker = FloatTicker | BoolTicker | EnumTicker;

const DEFAULT_POLL_HZ = 1;
const MEAN_REVERSION = 0.05; // 5% pull toward nominal per tick
const STEP_FRACTION = 0.02; // step magnitude as fraction of (max - min)

/** Build the ticker plan once from a ready topology view. */
export function buildTickerPlan(
  view: TopologyViewType,
  siteId: string,
): Ticker[] {
  const now = performance.now();
  const tickers: Ticker[] = [];
  for (const [deviceId, device] of Object.entries(view.devices)) {
    const tpl = view.templates_used[device.template];
    if (!tpl) continue;
    for (const [measName, meas] of Object.entries(tpl.measurements)) {
      const topic = measurementTopic(
        siteId,
        deviceId,
        measName,
        meas.unit as TopicUnit,
      );
      tickers.push(buildTicker(topic, deviceId, measName, meas, now));
    }
  }
  return tickers;
}

function buildTicker(
  topic: string,
  deviceId: string,
  measurement: string,
  meas: MeasurementViewType,
  now: number,
): Ticker {
  const intervalMs = 1000 / (meas.poll_rate_hz ?? DEFAULT_POLL_HZ);
  if (meas.type === "float" && meas.bounds) {
    const bounds = meas.bounds;
    // Clamp to inside warn band so the sim never alarms (constitution Rule 1).
    const safeMin = meas.thresholds
      ? Math.max(bounds.min, meas.thresholds.warn_min)
      : bounds.min;
    const safeMax = meas.thresholds
      ? Math.min(bounds.max, meas.thresholds.warn_max)
      : bounds.max;
    return {
      kind: "float",
      topic,
      deviceId,
      measurement,
      intervalMs,
      nextDueAt: now,
      bounds,
      safeMin,
      safeMax,
      current: bounds.nominal,
    };
  }
  if (meas.type === "bool") {
    return { kind: "bool", topic, intervalMs, nextDueAt: now, current: true };
  }
  // enum
  const values = meas.values ? Object.values(meas.values) : ["UNKNOWN"];
  return { kind: "enum", topic, intervalMs, nextDueAt: now, values, index: 0 };
}

/** Compute the next value for a float ticker — mean-reverting Gaussian step. */
export function nextFloatValue(t: FloatTicker): number {
  const range = t.bounds.max - t.bounds.min;
  const drift = (t.bounds.nominal - t.current) * MEAN_REVERSION;
  const noise = (Math.random() - 0.5) * 2 * range * STEP_FRACTION;
  const next = t.current + drift + noise;
  return Math.max(t.safeMin, Math.min(t.safeMax, next));
}
