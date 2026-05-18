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

/**
 * Loads configuration from cfg.yml based on the active environment.
 * Reads `VITE_ENV` (Vite build-time substitution); defaults to `local`.
 * Attaches the env name as `mode` so downstream code can branch on
 * deployment identity without reading the env var again.
 * @returns Active environment's config object with `mode` attached
 * @throws Error if cfg.yml cannot be parsed or schema-validated
 */
export function loadConfig(): ConfigType {
  const configYaml: unknown = parse(configYamlRaw);
  const config = ConfigMap.parse(configYaml);
  const environment: Mode = match<string | undefined, Mode>(
    import.meta.env.VITE_ENV,
  )
    .with("beta", () => "beta")
    .with("demo", () => "demo")
    .otherwise(() => "local");
  const block = match(environment)
    .with("beta", () => config.beta)
    .with("demo", () => config.demo)
    .otherwise(() => config.local);
  return { ...block, mode: environment };
}
