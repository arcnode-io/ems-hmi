/** Web broker host — the page origin (authoritative for where the SPA loaded). */

export function brokerFallbackHost(identityHost: string): string {
  const loc = (globalThis as { location?: { host?: string } }).location;
  return loc?.host && loc.host.length > 0 ? loc.host : identityHost;
}
