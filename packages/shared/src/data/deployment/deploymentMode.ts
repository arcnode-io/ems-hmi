/**
 * Deployment mode — chosen at build time (VITE_ENV on web, ENV on mobile).
 *
 *   local        dev server, in-browser mock + fixture (baked profile)
 *   ai-demo      public S3 demo: mock devices + hosted analyst (baked profile)
 *   deployed     web container image: NO baked site — real broker + device-api,
 *                config from the runtime /cfg.customer.yml mounted by whoever
 *                deploys it (platform for cloud/ISO, the device-demo launcher)
 *   beta         mobile only: baked real-backend profile (a native app can't
 *   device-demo  receive a mounted config file)
 */

import { match } from "ts-pattern";

export type DeploymentMode = "local" | "beta" | "ai-demo" | "device-demo" | "deployed";

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
    .with("local", "beta", "ai-demo", "device-demo", "deployed", (m) => m)
    .otherwise((m) => {
      throw new Error(`no '${m}' profile in cfg.yml`);
    });
}

/**
 * True when the mode talks to a real broker + device-api (login, live
 * MQTT, served topology) rather than the in-browser mock + fixture.
 */
export function usesRealBackend(mode: DeploymentMode): boolean {
  return mode === "beta" || mode === "device-demo" || mode === "deployed";
}
