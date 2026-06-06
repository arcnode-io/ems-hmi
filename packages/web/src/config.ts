import { match } from "ts-pattern";
import { z } from "zod";
import { parse } from "yaml";
import configYamlRaw from "../cfg.yml?raw";

enum LogLevel {
  ERROR = "ERROR",
  WARN = "WARN",
  INFO = "INFO",
  DEBUG = "DEBUG",
}

const Config = z.object({
  logLevel: z.enum([
    LogLevel.ERROR,
    LogLevel.WARN,
    LogLevel.INFO,
    LogLevel.DEBUG,
  ]),
  e2e: z.boolean(),
  /** Human-readable deployment / site name. Shown in chrome (TopBar, Sidebar). */
  deploymentName: z.string(),
  /** Deployment hostname / URL fragment. Shown under the deployment name. */
  deploymentHost: z.string(),
  /** Site identifier — MUST match analyst-server's `SITE_ID` env var. Sent in `context.siteId`. */
  siteId: z.string(),
  /** MQTT broker URL — `ws://` / `wss://` for browser MQTT-over-WebSocket. Empty in demo. */
  mqttUri: z.string(),
  /** Base URL for ems-device-api (`/topology/view`, `/asyncapi`). */
  deviceApiUri: z.string(),
  /** Base URL for the analyst chat backend. */
  chatApiUri: z.string(),
});

export type Mode = "local" | "beta" | "demo";
export type ConfigType = z.infer<typeof Config> & { mode: Mode };

const ConfigMap = z.object({
  local: Config,
  beta: Config,
  demo: Config,
});

/** Path the deployed nginx serves the per-deployment runtime overlay from. */
const OVERLAY_URL = "/cfg.customer.yml";

/**
 * Fetch + parse the runtime overlay. Returns a partial config object, or null
 * when the overlay is absent (404), unreachable (offline/dev), or not an
 * object — every one of which means "use the baked block".
 * @returns parsed overlay object, or null to signal "use baked"
 */
async function fetchOverlay(): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(OVERLAY_URL);
    if (!res.ok) return null;
    const parsed: unknown = parse(await res.text());
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null; // offline / dev server without the overlay route
  }
}

/**
 * Loads configuration from cfg.yml based on `VITE_ENV` (defaults to `local`),
 * then overlays the deployed `/cfg.customer.yml` on top so the running HMI
 * learns its real siteId + same-origin URLs at runtime. Falls back to the baked
 * block when the overlay is absent (demo/local/offline).
 * @returns Active config with `mode` attached
 * @throws if cfg.yml is unparseable or the merged config fails validation
 */
export async function loadConfig(): Promise<ConfigType> {
  const configYaml: unknown = parse(configYamlRaw);
  const map = ConfigMap.parse(configYaml);
  const environment: Mode = match<string | undefined, Mode>(
    import.meta.env.VITE_ENV,
  )
    .with("beta", () => "beta")
    .with("demo", () => "demo")
    .otherwise(() => "local");
  const baked = match(environment)
    .with("beta", () => map.beta)
    .with("demo", () => map.demo)
    .otherwise(() => map.local);

  const overlay = await fetchOverlay();
  const block = overlay ? Config.parse({ ...baked, ...overlay }) : baked;
  return { ...block, mode: environment };
}
