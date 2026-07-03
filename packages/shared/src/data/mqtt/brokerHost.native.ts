/** Native broker fallback — the operator-entered identity host (no page origin). */

import type { BrokerFallback } from "./brokerUrl";

export function brokerFallbackHost(identityHost: string): BrokerFallback {
  // v1 stacks serve plain http/ws; flip to true with the wss/TLS rollout.
  return { host: identityHost, secure: false };
}
