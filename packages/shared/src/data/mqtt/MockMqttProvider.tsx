/**
 * MockMqttProvider — drop-in for RealMqttProvider in demo mode.
 *
 * Behavior:
 *  - Reads TopologyContext to build a tick plan: one ticker per
 *    (device, measurement). Each ticker fires at the measurement's
 *    poll_rate_hz and emits a value following a mean-reverting random
 *    walk inside the constitutional safe band (clamped between warn_min
 *    and warn_max so the alarm channel stays clean per Rule 1).
 *  - Floats walk; bools flip with low probability; enums cycle slowly.
 *  - Single requestAnimationFrame loop services all tickers — auto-pauses
 *    when the tab is hidden (rAF behavior), saves battery during demos.
 *
 * NEVER alarms — random walks stay inside [warn_min, warn_max] by clamp.
 * Operator commands can later steer tickers toward a target (target-walk
 * mode — to be wired in phase 6).
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { MqttProvider } from "./MqttProvider";
import type {
  MqttClient,
  MessageListener,
  MqttMessage,
  Unsubscribe,
} from "./MqttClient";
import { useTopologyView } from "../topology/useTopologyView";
import { measurementTopic, type TopicUnit } from "../topics/topicBuilder";
import type {
  TopologyViewType,
  MeasurementViewType,
} from "../topology/topology.schema";

interface FloatTicker {
  kind: "float";
  topic: string;
  intervalMs: number;
  nextDueAt: number;
  bounds: { min: number; max: number; nominal: number };
  safeMin: number;
  safeMax: number;
  current: number;
}

interface BoolTicker {
  kind: "bool";
  topic: string;
  intervalMs: number;
  nextDueAt: number;
  current: boolean;
}

interface EnumTicker {
  kind: "enum";
  topic: string;
  intervalMs: number;
  nextDueAt: number;
  values: string[];
  index: number;
}

type Ticker = FloatTicker | BoolTicker | EnumTicker;

const DEFAULT_POLL_HZ = 1;
const MEAN_REVERSION = 0.05; // 5% pull toward nominal per tick
const STEP_FRACTION = 0.02; // step magnitude as fraction of (max - min)

/** Build the ticker plan once from a ready topology view. */
function buildTickerPlan(view: TopologyViewType, siteId: string): Ticker[] {
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
      tickers.push(buildTicker(topic, meas, now));
    }
  }
  return tickers;
}

function buildTicker(
  topic: string,
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
  return {
    kind: "enum",
    topic,
    intervalMs,
    nextDueAt: now,
    values,
    index: 0,
  };
}

/** Compute the next value for a float ticker — mean-reverting Gaussian step. */
function nextFloatValue(t: FloatTicker): number {
  const range = t.bounds.max - t.bounds.min;
  const drift = (t.bounds.nominal - t.current) * MEAN_REVERSION;
  const noise = (Math.random() - 0.5) * 2 * range * STEP_FRACTION;
  const next = t.current + drift + noise;
  return Math.max(t.safeMin, Math.min(t.safeMax, next));
}

/** A concrete MqttClient that talks to local listeners only. */
class MockMqttClientImpl implements MqttClient {
  private listeners = new Map<string, Set<MessageListener<unknown>>>();

  subscribe<T = unknown>(
    topic: string,
    listener: MessageListener<T>,
  ): Unsubscribe {
    if (!this.listeners.has(topic)) this.listeners.set(topic, new Set());
    const set = this.listeners.get(topic)!;
    set.add(listener as MessageListener<unknown>);
    return (): void => {
      set.delete(listener as MessageListener<unknown>);
    };
  }

  publish(): void {
    // No-op for now — phase 6 will wire commands to retarget tickers.
  }

  broadcast(topic: string, msg: MqttMessage<unknown>): void {
    const set = this.listeners.get(topic);
    if (!set) return;
    for (const listener of set) listener(msg);
  }
}

interface MockMqttProviderProps {
  /** Site id used in topic strings. Demo default is "demo_site". */
  siteId?: string;
  children: React.ReactNode;
}

/**
 * Provider — wires Topology + Mock client + rAF tick loop. Renders children
 * inside MqttProvider so useSubscription works.
 * @param props siteId + children
 * @param props.siteId Site id for topic strings (default "demo_site")
 * @param props.children Subtree that consumes via useSubscription
 * @returns Provider element
 */
export function MockMqttProvider({
  siteId = "demo_site",
  children,
}: MockMqttProviderProps): React.ReactElement {
  const { status, view } = useTopologyView();
  const client = useMemo(() => new MockMqttClientImpl(), []);
  const tickersRef = useRef<Ticker[]>([]);
  const rafRef = useRef<number | null>(null);
  const [, force] = useState(0); // force re-render once tickers are armed

  useEffect(() => {
    if (status !== "ready" || !view) return;
    tickersRef.current = buildTickerPlan(view, siteId);
    force((n) => n + 1);

    const tick = (): void => {
      const now = performance.now();
      for (const t of tickersRef.current) {
        if (now < t.nextDueAt) continue;
        t.nextDueAt = now + t.intervalMs;
        let value: unknown;
        if (t.kind === "float") {
          t.current = nextFloatValue(t);
          value = t.current;
        } else if (t.kind === "bool") {
          // Flip with 1% probability per tick — stays mostly stable.
          if (Math.random() < 0.01) t.current = !t.current;
          value = t.current;
        } else {
          // Advance enum once every ~20 ticks.
          if (Math.random() < 0.05) t.index = (t.index + 1) % t.values.length;
          value = t.values[t.index];
        }
        client.broadcast(t.topic, {
          ts: new Date().toISOString(),
          value,
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      tickersRef.current = [];
    };
  }, [status, view, siteId, client]);

  return <MqttProvider client={client}>{children}</MqttProvider>;
}
