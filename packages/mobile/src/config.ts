import { match } from "ts-pattern";
import { z } from "zod";
import { parse } from "yaml";
// @ts-expect-error - babel-plugin-inline-import will transform this
import configYamlRaw from "../cfg.yml";
// @ts-expect-error - react-native-dotenv will provide this
import { ENV } from "@env";

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
  deploymentName: z.string(),
  deploymentHost: z.string(),
  siteId: z.string(),
  mqttUri: z.string(),
  deviceApiUri: z.string(),
  chatApiUri: z.string(),
});

export type Mode = "local" | "beta" | "demo";
export type ConfigType = z.infer<typeof Config> & { mode: Mode };

export const ConfigMap = z.object({
  local: Config,
  beta: Config,
  demo: Config,
});

/**
 * Loads configuration from cfg.yml based on the active environment.
 * Reads `ENV` from react-native-dotenv; defaults to `local`.
 * Attaches the env name as `mode` so downstream code can branch on
 * deployment identity without reading the env var again.
 * @returns Active environment's config object with `mode` attached
 * @throws Error if cfg.yml cannot be parsed or schema-validated
 */
export function loadConfig(): ConfigType {
  const configYaml: unknown = parse(configYamlRaw as string);
  const config = ConfigMap.parse(configYaml);
  const environment: Mode = match<string | undefined, Mode>(
    ENV as string | undefined,
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
