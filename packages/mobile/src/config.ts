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
  mqttUri: z.string().url(),
  fooApiUri: z.string().url(),
  chatApiUri: z.string().url(),
});

export type ConfigType = z.infer<typeof Config>;
export const ConfigMap = z.object({
  local: Config,
  beta: Config,
});

/**
 * Loads configuration from cfg.yml file based on environment.
 * @returns Config object for current environment (ENV var or 'local' default)
 * @throws Error if cfg.yml cannot be parsed or validated
 * @example loadConfig() // { logLevel: 'INFO', mqttUri: 'mqtt://localhost:1883', fooApiUri: 'http://localhost:3000/api' }
 */
export function loadConfig(): ConfigType {
  const configYaml: unknown = parse(configYamlRaw as string);
  const config = ConfigMap.parse(configYaml);
  const environment = (ENV as string | undefined) ?? "local";
  return match(environment)
    .with("beta", () => config.beta)
    .otherwise(() => config.local);
}
