/** Web broker fallback — the page origin (authoritative for where the SPA loaded). */

import type { BrokerFallback } from "./brokerUrl";

export function brokerFallbackHost(identityHost: string): BrokerFallback {
  const loc = (globalThis as { location?: { host?: string; protocol?: string } })
    .location;
  return {
    host: loc?.host && loc.host.length > 0 ? loc.host : identityHost,
    secure: loc?.protocol === "https:",
  };
}
