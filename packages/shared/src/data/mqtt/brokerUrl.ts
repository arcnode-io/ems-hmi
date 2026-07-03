/**
 * Broker URL resolution. The credential service ships `url` empty in v1 → the
 * HMI derives `ws(s)://<host>/mqtt` by convention (same-origin via nginx). A
 * non-empty `url` means "convention won't reach me, use this" and wins.
 *
 * The scheme must follow the page transport: a plain-http v1 stack has nothing
 * on :443, so a hardcoded wss:// dials a dead port and mqtt.js retries
 * silently forever (caught by the browser dispatch e2e). The fallback host +
 * scheme differ per platform — supplied by the caller, see brokerHost.*.
 */

const MQTT_PATH = "/mqtt";

export interface BrokerFallback {
  host: string;
  /** true → wss (page is https / TLS rollout); false → ws (plain-http v1). */
  secure: boolean;
}

/**
 * @param serverUrl `url` field from /auth/mqtt-credentials ("" → derive)
 * @param fallback host + scheme to derive from when serverUrl is empty
 * @returns a `ws(s)://…` broker URL
 */
export function resolveBrokerUrl(serverUrl: string, fallback: BrokerFallback): string {
  const trimmed = serverUrl.trim();
  if (trimmed.length > 0) return trimmed;
  return `${fallback.secure ? "wss" : "ws"}://${fallback.host}${MQTT_PATH}`;
}
