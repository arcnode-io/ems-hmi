/**
 * Deployment mode — the cfg.yml profile name, chosen at build time
 * (VITE_ENV on web, ENV on mobile).
 *
 *   local        dev server, in-browser mock + fixture
 *   beta         real broker + device-api (the image the cloud/ISO stacks run)
 *   ai-demo      public S3 demo: mock devices + hosted analyst
 *   device-demo  end-to-end device demo against the local compose stack
 */

import { match } from "ts-pattern";

export type DeploymentMode = "local" | "beta" | "ai-demo" | "device-demo";

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
    .with("local", "beta", "ai-demo", "device-demo", (m) => m)
    .otherwise((m) => {
      throw new Error(`no '${m}' profile in cfg.yml`);
    });
}

/**
 * True when the mode talks to a real broker + device-api (login, live
 * MQTT, served topology) rather than the in-browser mock + fixture.
 */
export function usesRealBackend(mode: DeploymentMode): boolean {
  return mode === "beta" || mode === "device-demo";
}
