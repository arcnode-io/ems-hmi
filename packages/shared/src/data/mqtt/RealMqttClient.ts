/**
 * RealMqttClient — the measurement-side MqttClient backed by an mqtt.js
 * connection. Mirrors MockMqttClientImpl's per-topic listener map; dedupes
 * broker subscribes (subscribe once per topic, unsubscribe when the last
 * listener drops). Payloads are the `{ ts, value }` envelope per system_adr.
 *
 * The dispatch command/event side is owned by RealMqttProvider directly (the
 * command frame carries an extra command_id that doesn't fit MqttMessage).
 */

import type {
  MqttClient,
  MessageListener,
  MqttMessage,
  Unsubscribe,
} from "./MqttClient";

/** Minimal surface of an mqtt.js client we depend on (injectable for tests). */
export interface RawMqtt {
  subscribe(topic: string, opts: { qos: 0 | 1 | 2 }): void;
  unsubscribe(topic: string): void;
  publish(topic: string, message: string, opts: { qos: 0 | 1 | 2; retain: boolean }): void;
  on(event: "message", cb: (topic: string, payload: Uint8Array) => void): void;
  end(): void;
}

const QOS_MEASUREMENT = 1;

function decode(payload: Uint8Array): string {
  return new TextDecoder().decode(payload);
}

export class RealMqttClient implements MqttClient {
  private listeners = new Map<string, Set<MessageListener<unknown>>>();

  constructor(private readonly raw: RawMqtt) {
    raw.on("message", (topic, payload) => this.dispatch(topic, payload));
  }

  private dispatch(topic: string, payload: Uint8Array): void {
    const set = this.listeners.get(topic);
    if (!set || set.size === 0) return;
    let msg: MqttMessage<unknown>;
    try {
      msg = JSON.parse(decode(payload)) as MqttMessage<unknown>;
    } catch {
      return; // drop unparseable frames rather than throw into the fan-out
    }
    for (const listener of set) listener(msg);
  }

  subscribe<T = unknown>(topic: string, listener: MessageListener<T>): Unsubscribe {
    let set = this.listeners.get(topic);
    if (!set) {
      set = new Set();
      this.listeners.set(topic, set);
      this.raw.subscribe(topic, { qos: QOS_MEASUREMENT });
    }
    set.add(listener as MessageListener<unknown>);
    return (): void => {
      set.delete(listener as MessageListener<unknown>);
      if (set.size === 0) {
        this.listeners.delete(topic);
        this.raw.unsubscribe(topic);
      }
    };
  }

  publish<T = unknown>(topic: string, payload: MqttMessage<T>): void {
    this.raw.publish(topic, JSON.stringify(payload), { qos: QOS_MEASUREMENT, retain: false });
  }
}
