/**
 * MockMqttProvider — drop-in for RealMqttProvider in demo/local mode. Same
 * flow as product: topology → subscribe, and dispatch through
 * useRealDispatch over the wire. Only the far end is simulated:
 *  - tickers (./tickers) publish the catalog-rated floats from a single rAF
 *    loop that auto-pauses with the tab;
 *  - MockGateway answers commands on the gateway's dispatch contract and
 *    holds the commanded measurement at its setpoint.
 *
 * NEVER alarms — random walks stay inside [warn_min, warn_max] by clamp.
 */

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { MqttProvider } from "./MqttProvider";
import type { MqttClient, MessageListener, MqttMessage, Unsubscribe } from "./MqttClient";
import { useTopologyView } from "../topology/useTopologyView";
import { buildTickerPlan, nextFloatValue, type Ticker } from "./tickers";
import { DispatchContext } from "../dispatch/DispatchContext";
import { assertSubscribable, isWildcard, topicMatches } from "./topicMatches";
import { MockGateway } from "./mockGateway";
import { useRealDispatch, type PublishFrame } from "./useRealDispatch";

/** A concrete MqttClient that talks to local listeners only. */
export class MockMqttClientImpl implements MqttClient {
  /** Keyed by subscribed filter (exact topic or wildcard). */
  private listeners = new Map<string, Set<MessageListener<unknown>>>();
  private wildcards = new Set<string>();

  subscribe<T = unknown>(
    topic: string,
    listener: MessageListener<T>,
  ): Unsubscribe {
    // Reason: same rule as the real client, so mock-mode dev can't hide a broad filter.
    assertSubscribable(topic);
    if (!this.listeners.has(topic)) this.listeners.set(topic, new Set());
    if (isWildcard(topic)) this.wildcards.add(topic);
    const set = this.listeners.get(topic)!;
    set.add(listener as MessageListener<unknown>);
    return (): void => {
      set.delete(listener as MessageListener<unknown>);
    };
  }

  publish(): void {
    // Commands go out as raw frames (publishFrame → MockGateway), not envelopes.
  }

  broadcast(topic: string, msg: MqttMessage<unknown>): void {
    for (const listener of this.listeners.get(topic) ?? []) listener(msg, topic);
    for (const filter of this.wildcards) {
      if (!topicMatches(filter, topic)) continue;
      for (const listener of this.listeners.get(filter) ?? []) listener(msg, topic);
    }
  }
}

interface MockMqttProviderProps {
  /** Site id used in topic strings — the active cfg.yml profile's siteId. */
  siteId: string;
  children: React.ReactNode;
}

export function MockMqttProvider({ siteId, children }: MockMqttProviderProps): React.ReactElement {
  const { status, view } = useTopologyView();
  const client = useMemo(() => new MockMqttClientImpl(), []);
  const gateway = useMemo(
    () => new MockGateway((topic, msg) => client.broadcast(topic, msg as MqttMessage<unknown>)),
    [client],
  );
  const tickersRef = useRef<Ticker[]>([]);
  const rafRef = useRef<number | null>(null);

  const publishFrame = useCallback<PublishFrame>(
    (topic, frame) => gateway.command(topic, frame, performance.now()),
    [gateway],
  );
  const dispatch = useRealDispatch(client, publishFrame, siteId);

  useEffect(() => {
    if (status !== "ready" || !view) return;
    tickersRef.current = buildTickerPlan(view, siteId);

    const tick = (): void => {
      const now = performance.now();
      gateway.tick(now);
      for (const t of tickersRef.current) {
        // Reason: a commanded measurement reports its setpoint (gateway-owned), not the walk.
        if (now < t.nextDueAt || gateway.holds(t.topic)) continue;
        t.nextDueAt = now + t.intervalMs;
        t.current = nextFloatValue(t);
        client.broadcast(t.topic, { ts: new Date().toISOString(), value: t.current });
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      tickersRef.current = [];
    };
  }, [status, view, siteId, client, gateway]);

  return (
    <MqttProvider client={client}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </MqttProvider>
  );
}
