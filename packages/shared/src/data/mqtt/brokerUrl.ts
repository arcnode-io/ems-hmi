/**
 * Broker URL resolution. The credential service ships `url` empty in v1 → the
 * HMI derives `wss://<host>/mqtt` by convention (same-origin via nginx). A
 * non-empty `url` means "convention won't reach me, use this" and wins.
 *
 * The fallback host differs per platform (web: location.host; native: the
 * operator-entered identity host) — supplied by the caller, see brokerHost.*.
 */

const MQTT_PATH = "/mqtt";

/**
 * @param serverUrl `url` field from /auth/mqtt-credentials ("" → derive)
 * @param fallbackHost host to derive from when serverUrl is empty
 * @returns a `wss://…` broker URL
 */
export function resolveBrokerUrl(serverUrl: string, fallbackHost: string): string {
  const trimmed = serverUrl.trim();
  if (trimmed.length > 0) return trimmed;
  return `wss://${fallbackHost}${MQTT_PATH}`;
}
