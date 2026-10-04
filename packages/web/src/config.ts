/**
 * Web config I/O: the bundled cfg.yml (baked mock profiles) + the runtime
 * `/cfg.customer.yml` overlay, resolved by resolveConfig (pure, tested).
 */

import { z } from "zod";
import { parse } from "yaml";
import { parseDeploymentMode } from "@ems-hmi/shared/data/deployment/deploymentMode";
import configYamlRaw from "../cfg.yml?raw";
import { Config, resolveConfig, type ConfigType } from "./resolveConfig";

const BakedProfiles = z.object({ local: Config, "ai-demo": Config });

/** Path the deployed nginx serves the per-deployment runtime overlay from. */
const OVERLAY_URL = "/cfg.customer.yml";

/**
 * Fetch + parse the runtime overlay. Null when absent (404), unreachable
 * (offline/dev), or not an object — resolveConfig decides what that means:
 * fine for a baked build, fatal for `deployed`.
 * @returns parsed overlay object, or null
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
 * Load the active config for this build (`VITE_ENV`: local | ai-demo | deployed).
 * @returns Active config with `mode` attached
 * @throws if cfg.yml is unparseable, VITE_ENV names no web build, or a
 * deployed build has no complete /cfg.customer.yml
 */
export async function loadConfig(): Promise<ConfigType> {
  const baked = BakedProfiles.parse(parse(configYamlRaw));
  const build = parseDeploymentMode(import.meta.env.VITE_ENV);
  return resolveConfig(
    build,
    baked,
    await fetchOverlay(),
    window.location.host,
  );
}
