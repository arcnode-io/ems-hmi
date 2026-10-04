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
import { z } from "zod";
import type { DeploymentMode } from "@ems-hmi/shared/data/deployment/deploymentMode";

export const Config = z.object({
  logLevel: z.enum(["ERROR", "WARN", "INFO", "DEBUG"]),
  e2e: z.boolean(),
  /** Human-readable deployment / site name. Shown in chrome (TopBar, Sidebar). */
  deploymentName: z.string(),
  /** Deployment hostname / URL fragment. Shown under the deployment name. */
  deploymentHost: z.string(),
  /** Site identifier — MUST match analyst-server's `SITE_ID` env var. Sent in `context.siteId`. */
  siteId: z.string(),
  /** MQTT broker URL — `ws://` / `wss://`; empty = same-origin ws(s)://<host>/mqtt. */
  mqttUri: z.string(),
  /** Base URL for ems-device-api (`/topology/view`, `/asyncapi`). */
  deviceApiUri: z.string(),
  /** Base URL for the analyst backend; empty = same-origin /analyst/. */
  chatApiUri: z.string(),
  /** Demo login prefilled on the sign-in form. Only ever from the device-demo launcher's overlay. */
  loginPrefill: z
    .object({ username: z.string(), password: z.string() })
    .optional(),
});

export type ConfigBlock = z.infer<typeof Config>;
export type BakedProfiles = Record<"local" | "ai-demo", ConfigBlock>;
export type ConfigType = ConfigBlock & { mode: DeploymentMode };

const OVERLAY_PATH = "/cfg.customer.yml";

/**
 * Overlay → config, with every missing/invalid key named (not a raw zod dump).
 * @param raw overlay merged over the deployment-agnostic defaults
 * @returns the validated config block
 * @throws Error naming each missing/invalid key
 */
function parseOrExplain(raw: Record<string, unknown>): ConfigBlock {
  const parsed = Config.safeParse(raw);
  if (parsed.success) return parsed.data;
  const keys = parsed.error.issues
    .map((issue) => issue.path.join("."))
    .join(", ");
  throw new Error(
    `${OVERLAY_PATH} is incomplete — missing or invalid: ${keys}`,
  );
}

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
    .with("deployed", () => {
      if (overlay === null) {
        throw new Error(
          `no ${OVERLAY_PATH} — this HMI image has no baked site; mount the deployment's config`,
        );
      }
      // Reason: only deployment-agnostic keys get defaults. Site + URIs must
      // come from the deployer, or the HMI would render someone else's site.
      return {
        ...parseOrExplain({
          logLevel: "INFO",
          e2e: false,
          deploymentHost: host,
          ...overlay,
        }),
        mode: build,
      };
    })
    .with("local", () => withDevOverlay(baked.local, overlay, build))
    .with("ai-demo", () => withDevOverlay(baked["ai-demo"], overlay, build))
    .with("beta", "device-demo", (profile) => {
      throw new Error(
        `'${profile}' is a mobile-only profile; web real-backend builds are 'deployed'`,
      );
    })
    .exhaustive();
}
