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
  mqttUri: z.string().url(),
  fooApiUri: z.string().url(),
  chatApiUri: z.string().url(),
});

export type ConfigType = z.infer<typeof Config>;
const ConfigMap = z.object({
  local: Config,
  beta: Config,
});

/**
 * Loads configuration from cfg.yml file based on environment.
 * @returns Config object for current environment (VITE_ENV var or 'local' default)
 * @throws Error if cfg.yml cannot be parsed or validated
 * @example loadConfig() // { logLevel: 'INFO', mqttUri: 'mqtt://localhost:1883', fooApiUri: 'http://localhost:3000/api' }
 */
export function loadConfig(): ConfigType {
  const configYaml: unknown = parse(configYamlRaw);
  const config = ConfigMap.parse(configYaml);
  const environment = import.meta.env.VITE_ENV ?? "local";
  return match(environment)
    .with("beta", () => config.beta)
    .otherwise(() => config.local);
}
