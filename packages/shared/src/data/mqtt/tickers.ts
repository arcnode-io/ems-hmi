/**
 * Ticker plan + random-walk maths for MockMqttProvider's rAF loop.
 *
 * One ticker per float measurement the catalog rates (has `bounds`): a
 * mean-reverting walk around nominal, clamped inside the warn band. Anything
 * the catalog gives no basis for — unrated floats, bools, enums — isn't
 * simulated and stays unknown ("—"), same as an unreporting real device.
 */

import { measurementTopic, type TopicUnit } from "../topics/topicBuilder";
import type { TopologyViewType, MeasurementViewType } from "../topology/topology.schema";

export interface Ticker {
  topic: string;
  intervalMs: number;
  nextDueAt: number;
  bounds: { min: number; max: number; nominal: number };
  safeMin: number;
  safeMax: number;
  current: number;
}

const DEFAULT_POLL_HZ = 1;
const MEAN_REVERSION = 0.05; // 5% pull toward nominal per tick
const STEP_FRACTION = 0.02; // step magnitude as fraction of the safe band

/** Build the ticker plan once from a ready topology view. */
export function buildTickerPlan(view: TopologyViewType, siteId: string): Ticker[] {
  const now = performance.now();
  const tickers: Ticker[] = [];
  for (const [deviceId, device] of Object.entries(view.devices)) {
    const tpl = view.templates_used[device.template];
    if (!tpl) continue;
    for (const [measName, meas] of Object.entries(tpl.measurements)) {
      const topic = measurementTopic(siteId, deviceId, measName, meas.unit as TopicUnit);
      const ticker = buildTicker(topic, meas, now);
      if (ticker) tickers.push(ticker);
    }
  }
  return tickers;
}

function buildTicker(topic: string, meas: MeasurementViewType, now: number): Ticker | null {
  if (meas.type !== "float" || !meas.bounds) return null;
  const bounds = meas.bounds;
  // Clamp to inside warn band so the sim never alarms (constitution Rule 1).
  const safeMin = meas.thresholds ? Math.max(bounds.min, meas.thresholds.warn_min) : bounds.min;
  const safeMax = meas.thresholds ? Math.min(bounds.max, meas.thresholds.warn_max) : bounds.max;
  return {
    topic,
    intervalMs: 1000 / (meas.poll_rate_hz ?? DEFAULT_POLL_HZ),
    nextDueAt: now,
    bounds,
    safeMin,
    safeMax,
    current: bounds.nominal,
  };
}

/** Compute the next value for a ticker — mean-reverting Gaussian step. */
export function nextFloatValue(t: Ticker): number {
  // Reason: scale noise to the band the walk may use — full scale (55–65 Hz)
  // made every step 0.2 Hz and pinned frequency to the 60.5 warn edge.
  const range = t.safeMax - t.safeMin;
  const drift = (t.bounds.nominal - t.current) * MEAN_REVERSION;
  const noise = (Math.random() - 0.5) * 2 * range * STEP_FRACTION;
  const next = t.current + drift + noise;
  return Math.max(t.safeMin, Math.min(t.safeMax, next));
}
