/**
 * MqttClient — interface implemented by RealMqttProvider (mqtt.js over WS)
 * and MockMqttProvider (rAF random-walk for demo mode).
 *
 * Wire envelope shape per system_adr §12: `{ ts, value }`. Status (quality)
 * lives on a separate measurement topic, time-joined at query time.
 *
 * `subscribe` is fire-and-forget — listeners receive every incoming message
 * for a topic until they unsubscribe. The component layer uses the
 * `useSubscription<T>` hook to lifecycle this against React renders.
 */

/** Wire envelope of every measurement message. */
export interface MqttMessage<T = unknown> {
  /** RFC3339 / ISO8601 timestamp string with Z suffix. */
  ts: string;
  /** Decoded value — number for floats, boolean for bools, string for enums. */
  value: T;
}

/** Cleanup callback returned from subscribe(). */
export type Unsubscribe = () => void;

/** Listener signature — receives decoded messages for a single topic. */
export type MessageListener<T = unknown> = (msg: MqttMessage<T>) => void;

/** The wire contract every MqttClient impl satisfies. */
export interface MqttClient {
  /**
   * Subscribe to a topic. The listener fires for every message until the
   * returned Unsubscribe is called. Implementations dedupe on (topic, listener).
   */
  subscribe: <T = unknown>(
    topic: string,
    listener: MessageListener<T>,
  ) => Unsubscribe;

  /**
   * Publish a payload to a topic. QoS / retain are inferred from the topic
   * family per system_adr §18.
   */
  publish: <T = unknown>(topic: string, payload: MqttMessage<T>) => void;
}
