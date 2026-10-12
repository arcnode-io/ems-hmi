/**
 * Resolve the web HMI's runtime config from the build mode, the baked cfg.yml
 * profiles, and the runtime `/cfg.customer.yml` overlay. Pure — config.ts
 * does the I/O (bundled cfg.yml + overlay fetch).
 *
 * `deployed` is the one container image: no site is baked in, so it MUST be
 * told where it is by whoever deploys it (platform-api UserData for cloud/ISO,
 * the device-demo launcher). A missing or incomplete overlay fails closed —
 * never a fallback to a baked site, and never to a demo login.
 */

import { match } from "ts-pattern";
import type { DeploymentMode } from "@ems-hmi/shared/data/deployment/deploymentMode";
import {
  Config,
  resolveSiteOverlay,
  type ConfigBlock,
} from "@ems-hmi/shared/data/deployment/siteConfig";

export type BakedProfiles = Record<"local" | "ai-demo", ConfigBlock>;
export type ConfigType = ConfigBlock & { mode: DeploymentMode };

/**
 * Baked profile, with an optional dev overlay (e.g. a dev server pointed at a live stack).
 * @param block the baked cfg.yml profile
 * @param overlay parsed /cfg.customer.yml, or null
 * @param mode the build mode to attach
 * @returns the profile, overlaid when an overlay is present
 */
function withDevOverlay(
  block: ConfigBlock,
  overlay: Record<string, unknown> | null,
  mode: DeploymentMode,
): ConfigType {
  return {
    ...(overlay === null ? block : Config.parse({ ...block, ...overlay })),
    mode,
  };
}

/**
 * Resolve the active config for a build.
 * @param build VITE_ENV build mode
 * @param baked cfg.yml's baked profiles (local, ai-demo)
 * @param overlay parsed /cfg.customer.yml, or null when absent
 * @param host the browser's host (location.host) — a deployed site's real host
 * @returns the active config with its mode
 * @throws Error for a deployed build without a complete overlay, or a mobile-only mode
 */
export function resolveConfig(
  build: DeploymentMode,
  baked: BakedProfiles,
  overlay: Record<string, unknown> | null,
  host: string,
): ConfigType {
  return match(build)
    .with("deployed", () => ({
      ...resolveSiteOverlay(overlay, host),
      mode: build,
    }))
    .with("local", () => withDevOverlay(baked.local, overlay, build))
    .with("ai-demo", () => withDevOverlay(baked["ai-demo"], overlay, build))
    .with("device-demo", () => {
      throw new Error(
        "'device-demo' is a mobile-only profile; web real-backend builds are 'deployed'",
      );
    })
    .exhaustive();
}
