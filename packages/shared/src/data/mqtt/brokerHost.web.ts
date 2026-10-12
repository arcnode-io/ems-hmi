/** Web broker fallback — the page origin (authoritative for where the SPA loaded). */

import type { BrokerFallback } from "./brokerUrl";

// Reason: the page origin is authoritative on web; deviceApiUri is native's signal.
export function brokerFallbackHost(identityHost: string, _deviceApiUri: string): BrokerFallback {
  const loc = (globalThis as { location?: { host?: string; protocol?: string } })
    .location;
  return {
    host: loc?.host && loc.host.length > 0 ? loc.host : identityHost,
    secure: loc?.protocol === "https:",
  };
}
