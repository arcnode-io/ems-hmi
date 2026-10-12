/** Native broker fallback — the site host the app reached (no page origin). */

import type { BrokerFallback } from "./brokerUrl";

/**
 * @param identityHost the site host
 * @param deviceApiUri device-api base; its scheme says whether the site is TLS
 */
export function brokerFallbackHost(identityHost: string, deviceApiUri: string): BrokerFallback {
  // Reason: the broker sits behind the same nginx as device-api, so it
  // shares its transport — https site → wss, plain-http stack → ws.
  return { host: identityHost, secure: deviceApiUri.startsWith("https:") };
}
