/**
 * useSubscription<T>(topic) — subscribe to an MQTT topic for the life of the
 * component. Returns the latest message envelope, or null if nothing has
 * arrived yet.
 *
 * Re-subscribes when `topic` changes; unsubscribes on unmount.
 *
 * Wraps MqttClient.subscribe so consumers never see the raw client.
 */

import { useContext, useEffect, useState } from "react";
import { MqttClientContext } from "./MqttProvider";
import type { MqttMessage } from "./MqttClient";

/**
 * Subscribe to a topic for the life of the component.
 * @param topic MQTT topic string
 * @returns Latest message envelope or null
 * @throws Error if used outside MqttProvider
 */
export function useSubscription<T = unknown>(
  topic: string,
): MqttMessage<T> | null {
  const client = useContext(MqttClientContext);
  if (client === null) {
    throw new Error("useSubscription must be used within MqttProvider");
  }
  const [latest, setLatest] = useState<MqttMessage<T> | null>(null);

  useEffect(() => {
    setLatest(null);
    const unsubscribe = client.subscribe<T>(topic, (msg) => setLatest(msg));
    return unsubscribe;
  }, [client, topic]);

  return latest;
}
