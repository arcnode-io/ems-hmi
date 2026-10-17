/**
 * useAggregateMeasurements — subscribe to a dynamic list of topics and return
 * the latest message per topic.
 *
 * `useSubscription<T>(topic)` is the single-topic React hook (one
 * subscription per call). When the number of subscriptions depends on
 * topology (e.g. one per BESS device), hooks rules forbid calling
 * `useSubscription` in a loop with variable count.
 *
 * This hook does the subscribe loop IMPERATIVELY via MqttClientContext
 * inside a single useEffect, so the React-rules-of-hooks constraint is
 * satisfied regardless of topic count.
 */

import { useContext, useEffect, useRef, useState } from "react";
import { MqttClientContext } from "./MqttProvider";
import type { MqttMessage } from "./MqttClient";
import { TopologyContext } from "../topology/TopologyProvider";
import { staleAfterFor } from "./staleness";

export type MessagesByTopic<T = unknown> = Record<string, MqttMessage<T>>;

/**
 * Default batch window. Reason: these hooks sit high in the tree (fleet KPIs,
 * alarms, grid state in AppLayout/Overview), so a render per message
 * re-rendered the whole app ~17×/s at real site rates and pinned the main
 * thread (measured A/B on ems.arcnode.io, 2026-10-06). 500 ms caps it at ~2/s;
 * nothing on these screens needs faster than twice a second.
 */
export const DEFAULT_FLUSH_MS = 500;

export interface AggregateOptions {
  /**
   * Batch window: collect messages and re-render at most once per window.
   * Defaults to DEFAULT_FLUSH_MS. Pass 0 to re-render per message (only for
   * a component that genuinely needs it — never one high in the tree).
   */
  flushMs?: number;
}

/**
 * Subscribe to a list of topics; return a map of latest message per topic.
 * Re-subscribes when the topic list changes (membership-based, not identity).
 *
 * @param topics List of MQTT topic strings to subscribe to
 * @param options flushMs batch window (default DEFAULT_FLUSH_MS; 0 = per message)
 * @returns Map keyed by topic with the latest envelope; topics with no
 *          messages yet are absent from the map
 * @throws Error if used outside MqttProvider
 */
export function useAggregateMeasurements<T = unknown>(
  topics: readonly string[],
  options: AggregateOptions = {},
): MessagesByTopic<T> {
  const { flushMs = DEFAULT_FLUSH_MS } = options;
  // Reason: stale policy is global (staleness.ts) — every reading expires
  // after 3 missed publishes at its catalog rate; on-change never does.
  const view = useContext(TopologyContext)?.view ?? null;
  const staleAfterMs = view ? staleAfterFor(view) : undefined;
  const pending = useRef<MessagesByTopic<T>>({});
  // Local arrival time per topic (not the payload ts — no clock-skew games).
  const receivedAt = useRef<Record<string, number>>({});
  // Reason: read through a ref so a new closure each render doesn't
  // resubscribe everything.
  const maxAge = useRef(staleAfterMs);
  maxAge.current = staleAfterMs;
  const client = useContext(MqttClientContext);
  if (client === null) {
    throw new Error(
      "useAggregateMeasurements must be used within MqttProvider",
    );
  }
  const [messages, setMessages] = useState<MessagesByTopic<T>>({});

  // Reason: serialize the topic list so useEffect's dep array is stable
  // when callers pass a fresh array literal each render.
  const key = topics.join("|");

  useEffect(() => {
    setMessages({});
    pending.current = {};
    receivedAt.current = {};
    // Reason: key by the arrival topic — a wildcard filter fans many
    // concrete topics into one subscription.
    const unsubs = topics.map((filter) =>
      client.subscribe<T>(filter, (msg, topic) => {
        receivedAt.current[topic] = Date.now();
        if (flushMs === 0) setMessages((prev) => ({ ...prev, [topic]: msg }));
        else pending.current[topic] = msg;
      }),
    );
    const expired = (): string[] => {
      const age = maxAge.current;
      if (age === undefined) return [];
      const now = Date.now();
      return Object.entries(receivedAt.current)
        .filter(([topic, at]) => {
          const limit = age(topic);
          return limit !== null && now - at > limit;
        })
        .map(([topic]) => topic);
    };
    // Reason: staleness needs a tick even with per-message renders (flushMs 0).
    const tickMs = flushMs === 0 ? DEFAULT_FLUSH_MS : flushMs;
    // Reason: always tick — the topology (and so the stale limits) can land after subscribing.
    const timer = setInterval(() => {
            const batch = pending.current;
            const gone = expired();
            if (Object.keys(batch).length === 0 && gone.length === 0) return;
            pending.current = {};
            for (const topic of gone) delete receivedAt.current[topic];
            setMessages((prev) => {
              const next = { ...prev, ...batch };
              for (const topic of gone) delete next[topic];
              return next;
            });
          }, tickMs);
    return (): void => {
      clearInterval(timer);
      for (const off of unsubs) off();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, key, flushMs]);

  return messages;
}
