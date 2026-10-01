/**
 * useSubscription<T>(topic) — subscribe to an MQTT topic for the life of the
 * component. Returns the latest message envelope, or null if nothing has
 * arrived yet.
 *
 * Re-subscribes when `topic` changes; unsubscribes on unmount. A null topic
 * (e.g. the device isn't in this site's topology) subscribes to nothing.
 *
 * Wraps MqttClient.subscribe so consumers never see the raw client.
 */

import { useContext, useEffect, useState } from "react";
import { MqttClientContext } from "./MqttProvider";
import type { MqttMessage } from "./MqttClient";

/**
 * Subscribe to a topic for the life of the component.
 * @param topic MQTT topic string, or null for "nothing to subscribe to"
 * @returns Latest message envelope or null
 * @throws Error if used outside MqttProvider
 */
export function useSubscription<T = unknown>(
  topic: string | null,
): MqttMessage<T> | null {
  const client = useContext(MqttClientContext);
  if (client === null) {
    throw new Error("useSubscription must be used within MqttProvider");
  }
  const [latest, setLatest] = useState<MqttMessage<T> | null>(null);

  useEffect(() => {
    setLatest(null);
    if (topic === null) return undefined;
    return client.subscribe<T>(topic, (msg) => setLatest(msg));
  }, [client, topic]);

  return latest;
}
