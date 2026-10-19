/**
 * MemoryMqttClient — an MqttClient that only talks to local listeners. Unit
 * tests drive hooks with it: `broadcast` delivers a message as if the broker
 * had, matching wildcards the same way the real client does.
 */

import type { MqttClient, MessageListener, MqttMessage, Unsubscribe } from "./MqttClient";
import { assertSubscribable, isWildcard, topicMatches } from "./topicMatches";

export class MemoryMqttClient implements MqttClient {
  /** Keyed by subscribed filter (exact topic or wildcard). */
  private listeners = new Map<string, Set<MessageListener<unknown>>>();
  private wildcards = new Set<string>();

  subscribe<T = unknown>(topic: string, listener: MessageListener<T>): Unsubscribe {
    // Reason: same rule as the real client, so a test can't hide a broad filter.
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
    // Nothing listens for outbound messages in a test.
  }

  broadcast(topic: string, msg: MqttMessage<unknown>): void {
    for (const listener of this.listeners.get(topic) ?? []) listener(msg, topic);
    for (const filter of this.wildcards) {
      if (!topicMatches(filter, topic)) continue;
      for (const listener of this.listeners.get(filter) ?? []) listener(msg, topic);
    }
  }
}
