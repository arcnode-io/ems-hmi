import { match } from "ts-pattern";
import { z } from "zod";
import { parse } from "yaml";
// @ts-expect-error - babel-plugin-inline-import will transform this
import configYamlRaw from "../cfg.yml";
// @ts-expect-error - react-native-dotenv will provide this
import { ENV } from "@env";
import {
  parseDeploymentMode,
  type DeploymentMode,
} from "@ems-hmi/shared/data/deployment/deploymentMode";

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

export type ConfigType = z.infer<typeof Config> & { mode: DeploymentMode };

export const ConfigMap = z.object({
  local: Config,
  beta: Config,
  "ai-demo": Config,
  "device-demo": Config,
});

/**
 * Loads configuration from cfg.yml based on the active environment.
 * Reads `ENV` from react-native-dotenv; defaults to `local`.
 * Attaches the env name as `mode` so downstream code can branch on
 * deployment identity without reading the env var again.
 * @returns Active environment's config object with `mode` attached
 * @throws Error if cfg.yml cannot be parsed or schema-validated, or ENV
 *   names no profile
 */
export function loadConfig(): ConfigType {
  const configYaml: unknown = parse(configYamlRaw as string);
  const config = ConfigMap.parse(configYaml);
  const environment = parseDeploymentMode(ENV as string | undefined);
  const block = match(environment)
    .with("local", () => config.local)
    .with("beta", () => config.beta)
    .with("ai-demo", () => config["ai-demo"])
    .with("device-demo", () => config["device-demo"])
    .exhaustive();
  return { ...block, mode: environment };
}
