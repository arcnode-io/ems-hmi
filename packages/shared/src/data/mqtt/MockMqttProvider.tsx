/**
 * MockMqttProvider — drop-in for RealMqttProvider in demo mode.
 *
 * Behavior:
 *  - Reads TopologyContext to build a tick plan (see ./tickers): one ticker
 *    per (device, measurement). A single rAF loop services all tickers and
 *    auto-pauses when the tab is hidden.
 *  - Owns the dispatch lifecycle (DispatchSimulator). The rAF loop advances
 *    it and, while a dispatch is executing, lets the simulator override the
 *    dispatched device's active_power + state_of_charge tickers.
 *
 * NEVER alarms — random walks stay inside [warn_min, warn_max] by clamp.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MqttProvider } from "./MqttProvider";
import type {
  MqttClient,
  MessageListener,
  MqttMessage,
  Unsubscribe,
} from "./MqttClient";
import { useTopologyView } from "../topology/useTopologyView";
import { buildTickerPlan, nextFloatValue, type Ticker } from "./tickers";
import { DispatchSimulator } from "../dispatch/DispatchSimulator";
import {
  DispatchContext,
  type DispatchControls,
} from "../dispatch/DispatchContext";
import type {
  DispatchProposal,
  DispatchState,
} from "../dispatch/dispatch.types";

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
    // Commands flow through DispatchContext in demo mode, not the wire.
  }

  broadcast(topic: string, msg: MqttMessage<unknown>): void {
    const set = this.listeners.get(topic);
    if (!set) return;
    for (const listener of set) listener(msg);
  }
}

/**
 * Demo-mode alarm injection: measurement-topic suffix → stuck value. Tickers
 * matching the suffix bypass the safe-band clamp so threshold-derivation in
 * useAlarms trips. Suffix match so we don't hardcode the site id.
 */
const DEMO_ALARM_INJECTIONS: Readonly<Record<string, number>> = {
  // bess_module_02 SoC stuck at 12% — below warn_min (15) → trips warn.
  "devices/bess_module_02/measurements/state_of_charge/percent": 12,
};

/** Find a demo-injection stuck value for a topic, if any. */
function demoInjectionFor(topic: string): number | null {
  for (const [suffix, value] of Object.entries(DEMO_ALARM_INJECTIONS)) {
    if (topic.endsWith(suffix)) return value;
  }
  return null;
}

const INITIAL_DISPATCH: DispatchState = {
  phase: "proposed",
  proposal: null,
  executingStartedAt: null,
  executingEndsAt: null,
  reason: null,
};

/** Mirror the simulator's slow-changing state for the context. */
function snapshot(sim: DispatchSimulator): DispatchState {
  const w = sim.executingWindow();
  return {
    phase: sim.phase(),
    proposal: sim.proposal(),
    executingStartedAt: w?.startedAt ?? null,
    executingEndsAt: w?.endsAt ?? null,
    reason: null, // the demo simulator never fails
  };
}

interface MockMqttProviderProps {
  /** Site id used in topic strings. Demo default is "demo-site". */
  siteId?: string;
  /** Pass `false` to disable the canned demo alarms. Default `true`. */
  demoAlarms?: boolean;
  children: React.ReactNode;
}

/**
 * Provider — wires Topology + Mock client + rAF tick loop + dispatch
 * lifecycle. Renders children inside MqttProvider + DispatchContext.
 */
export function MockMqttProvider({
  siteId = "demo-site",
  demoAlarms = true,
  children,
}: MockMqttProviderProps): React.ReactElement {
  const { status, view } = useTopologyView();
  const client = useMemo(() => new MockMqttClientImpl(), []);
  const tickersRef = useRef<Ticker[]>([]);
  const simRef = useRef<DispatchSimulator>(new DispatchSimulator());
  const rafRef = useRef<number | null>(null);
  const [, force] = useState(0); // force re-render once tickers are armed
  const [dispatchState, setDispatchState] =
    useState<DispatchState>(INITIAL_DISPATCH);

  const confirm = useCallback(
    (proposal: DispatchProposal, socStartPct: number): void => {
      simRef.current.confirm(proposal, socStartPct, performance.now());
      setDispatchState(snapshot(simRef.current));
    },
    [],
  );
  const cancel = useCallback((): void => {
    simRef.current.cancel();
    setDispatchState(snapshot(simRef.current));
  }, []);

  useEffect(() => {
    if (status !== "ready" || !view) return;
    tickersRef.current = buildTickerPlan(view, siteId);
    force((n) => n + 1);

    const tick = (): void => {
      const now = performance.now();
      const sim = simRef.current;
      if (sim.tick(now)) setDispatchState(snapshot(sim));
      for (const t of tickersRef.current) {
        if (now < t.nextDueAt) continue;
        t.nextDueAt = now + t.intervalMs;
        let value: unknown;
        if (t.kind === "float") {
          // Priority: dispatch override > demo alarm injection > random walk.
          const override = sim.overrideFor(t.deviceId, t.measurement, now);
          const stuck = demoAlarms ? demoInjectionFor(t.topic) : null;
          if (override !== null) t.current = override;
          else if (stuck !== null) t.current = stuck;
          else t.current = nextFloatValue(t);
          value = t.current;
        } else if (t.kind === "bool") {
          if (Math.random() < 0.01) t.current = !t.current;
          value = t.current;
        } else {
          if (Math.random() < 0.05) t.index = (t.index + 1) % t.values.length;
          value = t.values[t.index];
        }
        client.broadcast(t.topic, { ts: new Date().toISOString(), value });
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      tickersRef.current = [];
    };
  }, [status, view, siteId, client, demoAlarms]);

  const controls = useMemo<DispatchControls>(
    () => ({ state: dispatchState, confirm, cancel }),
    [dispatchState, confirm, cancel],
  );

  return (
    <MqttProvider client={client}>
      <DispatchContext.Provider value={controls}>
        {children}
      </DispatchContext.Provider>
    </MqttProvider>
  );
}
