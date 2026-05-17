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

import { useContext, useEffect, useState } from "react";
import { MqttClientContext } from "./MqttProvider";
import type { MqttMessage } from "./MqttClient";

export type MessagesByTopic<T = unknown> = Record<string, MqttMessage<T>>;

/**
 * Subscribe to a list of topics; return a map of latest message per topic.
 * Re-subscribes when the topic list changes (membership-based, not identity).
 *
 * @param topics List of MQTT topic strings to subscribe to
 * @returns Map keyed by topic with the latest envelope; topics with no
 *          messages yet are absent from the map
 * @throws Error if used outside MqttProvider
 */
export function useAggregateMeasurements<T = unknown>(
  topics: readonly string[],
): MessagesByTopic<T> {
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
    const unsubs = topics.map((topic) =>
      client.subscribe<T>(topic, (msg) => {
        setMessages((prev) => ({ ...prev, [topic]: msg }));
      }),
    );
    return (): void => {
      for (const off of unsubs) off();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, key]);

  return messages;
}
