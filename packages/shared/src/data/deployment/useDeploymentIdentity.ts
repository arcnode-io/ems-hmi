/**
 * useDeploymentIdentity — access the deployment identity from any descendant
 * of DeploymentIdentityProvider.
 *
 * Returns name + host + mode. Throws if used outside the provider.
 */

import { useContext } from "react";
import {
  DeploymentIdentityContext,
  type DeploymentIdentity,
} from "./DeploymentIdentityProvider";

/**
 * Hook for accessing deployment identity. Throws outside DeploymentIdentityProvider.
 * @returns DeploymentIdentity
 * @throws Error if invoked outside a DeploymentIdentityProvider
 */
export function useDeploymentIdentity(): DeploymentIdentity {
  const ctx = useContext(DeploymentIdentityContext);
  if (ctx === null) {
    throw new Error(
      "useDeploymentIdentity must be used within DeploymentIdentityProvider",
    );
  }
  return ctx;
}
