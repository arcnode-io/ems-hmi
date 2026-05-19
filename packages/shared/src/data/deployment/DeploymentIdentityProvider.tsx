/**
 * DeploymentIdentityProvider — name + mode + URLs threaded into descendants.
 *
 * Initial values come from each platform's cfg.yml. Native callers can
 * override the host at runtime via `setHost()`; the override persists via
 * `data/storage/persisted` and is applied to chatApiUri + deviceApiUri.
 */

import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { kv } from "../storage/persisted";

const HOST_OVERRIDE_KEY = "@arcnode/host-override";

export type DeploymentMode = "local" | "beta" | "demo";

export interface DeploymentIdentity {
  name: string;
  host: string;
  siteId: string;
  mode: DeploymentMode;
  chatApiUri: string;
  deviceApiUri: string;
  /** Set or clear the runtime host override; persisted across launches. */
  setHost: (host: string | null) => void;
}

export const DeploymentIdentityContext =
  createContext<DeploymentIdentity | null>(null);

export interface DeploymentIdentityBase {
  name: string;
  host: string;
  siteId: string;
  mode: DeploymentMode;
  chatApiUri: string;
  deviceApiUri: string;
}

interface DeploymentIdentityProviderProps {
  base: DeploymentIdentityBase;
  children: React.ReactNode;
}

/**
 * Replace the hostname portion of an absolute URL. Relative URLs are
 * returned unchanged because there's no host to swap.
 */
function applyHostOverride(baseUrl: string, host: string | null): string {
  if (!host) return baseUrl;
  try {
    const url = new URL(baseUrl);
    url.hostname = host;
    return url.toString();
  } catch {
    return baseUrl;
  }
}

export function DeploymentIdentityProvider({
  base,
  children,
}: DeploymentIdentityProviderProps): React.ReactElement {
  const [override, setOverride] = useState<string | null>(null);

  useEffect(() => {
    void kv.get(HOST_OVERRIDE_KEY).then((v) => {
      if (v) setOverride(v);
    });
  }, []);

  const setHost = useCallback((host: string | null): void => {
    setOverride(host);
    if (host === null || host === "") {
      void kv.remove(HOST_OVERRIDE_KEY);
    } else {
      void kv.set(HOST_OVERRIDE_KEY, host);
    }
  }, []);

  const value = useMemo<DeploymentIdentity>(
    () => ({
      name: base.name,
      host: override ?? base.host,
      siteId: base.siteId,
      mode: base.mode,
      chatApiUri: applyHostOverride(base.chatApiUri, override),
      deviceApiUri: applyHostOverride(base.deviceApiUri, override),
      setHost,
    }),
    [base, override, setHost],
  );

  return (
    <DeploymentIdentityContext.Provider value={value}>
      {children}
    </DeploymentIdentityContext.Provider>
  );
}
