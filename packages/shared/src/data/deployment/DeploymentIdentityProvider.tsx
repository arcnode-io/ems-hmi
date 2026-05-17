/**
 * DeploymentIdentityProvider — exposes the deployment's display name,
 * hostname, and build-target mode to descendants.
 *
 * These values come from the platform-specific `cfg.yml` (web reads via
 * `import.meta.env.VITE_ENV`; mobile reads via `react-native-dotenv`).
 * The shared package doesn't know about cfg.yml — consumers wire the
 * identity at App root via this provider.
 *
 * Use `useDeploymentIdentity()` to read.
 */

import React, { createContext } from "react";

export type DeploymentMode = "local" | "beta" | "demo";

export interface DeploymentIdentity {
  /** Human-readable site name shown in chrome (TopBar, Sidebar). */
  name: string;
  /** Deployment hostname / URL fragment, shown under the site name. */
  host: string;
  /** Site identifier — MUST match analyst-server's `SITE_ID` env var. Sent in `context.siteId`. */
  siteId: string;
  /** Build-target mode — `demo` swaps in MockMqttProvider; others use real broker. */
  mode: DeploymentMode;
  /** Analyst-agent chat API base URL. Used by Settings' connection test. */
  chatApiUri: string;
  /** Device-API base URL. Used by Settings' connection test. */
  deviceApiUri: string;
}

export const DeploymentIdentityContext =
  createContext<DeploymentIdentity | null>(null);

interface DeploymentIdentityProviderProps {
  identity: DeploymentIdentity;
  children: React.ReactNode;
}

/**
 * React provider for deployment identity.
 * @param props identity + children
 * @param props.identity The deployment identity object loaded from cfg.yml
 * @param props.children Subtree that consumes via useDeploymentIdentity()
 * @returns Context provider element
 */
export function DeploymentIdentityProvider({
  identity,
  children,
}: DeploymentIdentityProviderProps): React.ReactElement {
  return (
    <DeploymentIdentityContext.Provider value={identity}>
      {children}
    </DeploymentIdentityContext.Provider>
  );
}
