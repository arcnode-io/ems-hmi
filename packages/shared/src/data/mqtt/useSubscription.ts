/**
 * useSubscription<T>(topic) — subscribe to an MQTT topic for the life of the
 * component. Returns the latest message envelope, or null if nothing has
 * arrived yet — or if the reading has gone stale (global policy, see
 * staleness.ts: 3 missed publishes at its catalog rate; on-change never).
 *
 * Re-subscribes when `topic` changes; unsubscribes on unmount. A null topic
 * (e.g. the device isn't in this site's topology) subscribes to nothing.
 *
 * Wraps MqttClient.subscribe so consumers never see the raw client.
 */

import { useContext, useEffect, useRef, useState } from "react";
import { MqttClientContext } from "./MqttProvider";
import type { MqttMessage } from "./MqttClient";
import { TopologyContext } from "../topology/TopologyProvider";
import { staleAfterFor } from "./staleness";

/** How often a held reading is checked for staleness. */
const STALE_CHECK_MS = 500;

/**
 * Subscribe to a topic for the life of the component.
 * @param topic MQTT topic string, or null for "nothing to subscribe to"
 * @returns Latest message envelope, or null when none arrived or it went stale
 * @throws Error if used outside MqttProvider
 */
export function useSubscription<T = unknown>(
  topic: string | null,
): MqttMessage<T> | null {
  const client = useContext(MqttClientContext);
  if (client === null) {
    throw new Error("useSubscription must be used within MqttProvider");
  }
  const view = useContext(TopologyContext)?.view ?? null;
  const maxAgeMs = view && topic ? staleAfterFor(view)(topic) : null;
  const [latest, setLatest] = useState<MqttMessage<T> | null>(null);
  // Local arrival time (not the payload ts — no clock-skew games).
  const receivedAt = useRef<number | null>(null);

  useEffect(() => {
    setLatest(null);
    receivedAt.current = null;
    if (topic === null) return undefined;
    return client.subscribe<T>(topic, (msg) => {
      receivedAt.current = Date.now();
      setLatest(msg);
    });
  }, [client, topic]);

  useEffect(() => {
    if (maxAgeMs === null) return undefined;
    const timer = setInterval(() => {
      const at = receivedAt.current;
      if (at === null || Date.now() - at <= maxAgeMs) return;
      receivedAt.current = null;
      setLatest(null);
    }, STALE_CHECK_MS);
    return () => clearInterval(timer);
  }, [maxAgeMs]);

  return latest;
}
