/**
 * Deployment mode — chosen at build time (VITE_ENV on web, ENV on mobile).
 *
 *   local        dev server against a local stack (baked profile)
 *   deployed     NO baked site — real broker + device-api, config from the
 *                site's /cfg.customer.yml written by whoever deploys it
 *                (platform for cloud/ISO, the device-demo launcher). Web reads
 *                it same-origin; the customer APK downloads it from the site
 *                address the operator enters (SiteRoot)
 *   device-demo  mobile only: baked real-backend profile (a native app can't
 *                receive a mounted config file); Settings repoints its host
 */

import { match } from "ts-pattern";

export type DeploymentMode = "local" | "device-demo" | "deployed";

/**
 * Resolve the build-time env var to a deployment mode.
 * @param raw VITE_ENV / ENV value; undefined when unset
 * @returns the matching mode, `local` when unset
 * @throws Error when set to a name with no cfg.yml profile
 */
export function parseDeploymentMode(raw: string | undefined): DeploymentMode {
  // Reason: a stale or typo'd name used to fall through to `local`, which
  // silently ships a build pointed at localhost. Fail the build instead.
  return match<string | undefined, DeploymentMode>(raw)
    .with(undefined, "", () => "local")
    .with("local", "device-demo", "deployed", (m) => m)
    .otherwise((m) => {
      throw new Error(`no '${m}' profile in cfg.yml`);
    });
}
