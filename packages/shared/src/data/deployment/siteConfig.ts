/**
 * The per-site config every deployed HMI reads: `/cfg.customer.yml`, written
 * by whoever deploys the site (platform-api UserData, the device-demo
 * launcher). The web image gets it same-origin; the native app downloads it
 * from the site address the operator enters.
 */

import { z } from "zod";
import { parse } from "yaml";
import type { DeploymentMode } from "./deploymentMode";

export const Config = z.object({
  logLevel: z.enum(["ERROR", "WARN", "INFO", "DEBUG"]),
  e2e: z.boolean(),
  /** Human-readable deployment / site name. Shown in chrome (TopBar, Sidebar). */
  deploymentName: z.string(),
  /** Deployment hostname / URL fragment. Shown under the deployment name. */
  deploymentHost: z.string(),
  /** Site identifier — part of every MQTT topic; MUST match analyst-server's `SITE_ID`. */
  siteId: z.string(),
  /** MQTT broker URL — `ws://` / `wss://`; empty = ws(s)://<host>/mqtt. */
  mqttUri: z.string(),
  /** Base URL for ems-device-api (`/topology/view`, `/loto`, `/auth`). */
  deviceApiUri: z.string(),
  /** Base URL the analyst's `/analyst/...` routes hang off ("/api" behind nginx). */
  chatApiUri: z.string(),
  /** Base URL for ems-der-control-api reads (`/events`); "/der-control" behind nginx. */
  derControlUri: z.string(),
  /** Demo login prefilled on the sign-in form. Only ever from the device-demo launcher's overlay. */
  loginPrefill: z.object({ username: z.string(), password: z.string() }).optional(),
});

export type ConfigBlock = z.infer<typeof Config>;
export type SiteConfig = ConfigBlock & { mode: DeploymentMode };

/** Fetch subset fetchSiteConfig needs; DI for tests. */
export type SiteFetch = (url: string) => Promise<{ ok: boolean; status: number; text: () => Promise<string> }>;

export const OVERLAY_PATH = "/cfg.customer.yml";

/**
 * Site overlay → config block. Only deployment-agnostic keys get defaults;
 * site + URIs must come from the deployer, or the HMI would render someone
 * else's site.
 * @param overlay parsed cfg.customer.yml, or null when absent
 * @param host default deploymentHost
 * @throws Error when absent, or naming each missing/invalid key
 */
export function resolveSiteOverlay(overlay: Record<string, unknown> | null, host: string): ConfigBlock {
  if (overlay === null) {
    throw new Error(`no ${OVERLAY_PATH} — this HMI image has no baked site; mount the deployment's config`);
  }
  const parsed = Config.safeParse({ logLevel: "INFO", e2e: false, deploymentHost: host, ...overlay });
  if (parsed.success) return parsed.data;
  const keys = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
  throw new Error(`${OVERLAY_PATH} is incomplete — missing or invalid: ${keys}`);
}

/**
 * Native: download a site's config from the address the operator typed and
 * make its same-origin paths absolute under https://<address>.
 * @param address host name, optionally typed as a URL
 * @param fetchFn DI; the platform fetch
 * @returns the site's config, mode `deployed`
 * @throws Error when the site serves no config or it is incomplete
 */
export async function fetchSiteConfig(
  address: string,
  fetchFn: SiteFetch,
): Promise<SiteConfig> {
  const host = normalizeAddress(address);
  const origin = `https://${host}`;
  const res = await fetchFn(`${origin}${OVERLAY_PATH}`);
  if (!res.ok) throw new Error(`${host} has no EMS site config (HTTP ${res.status})`);
  const raw: unknown = parse(await res.text());
  const overlay = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : null;
  const block = resolveSiteOverlay(overlay, host);
  // Reason: absolute URIs are left alone; "/api"-style paths are same-origin
  // on web, so on native they live under the site's own origin.
  const under = (uri: string): string => (uri.startsWith("/") ? `${origin}${uri}` : uri);
  return {
    ...block,
    // Reason: the file says how the server sees itself (often "localhost");
    // the app must use the address it actually reached.
    deploymentHost: host,
    deviceApiUri: under(block.deviceApiUri),
    chatApiUri: under(block.chatApiUri),
    derControlUri: under(block.derControlUri),
    mode: "deployed",
  };
}

/** "  https://ems.acme.example/ " → "ems.acme.example". */
export function normalizeAddress(address: string): string {
  return address.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
}
