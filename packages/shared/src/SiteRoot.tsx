/**
 * SiteRoot — native entry for the customer build (`deployed`). A native app
 * can't be handed a mounted config file, so the operator types the site
 * address once; the app downloads that site's /cfg.customer.yml (the same
 * file the web image reads) and mounts AppRoot with it. The address is
 * remembered; "Change site" on the sign-in card forgets it.
 */

import React, { useCallback, useEffect, useState } from "react";
import { AppRoot } from "./AppRoot";
import { ThemeProvider } from "./theme/ThemeProvider";
import { kv } from "./data/storage/persisted";
import { fetchSiteConfig, type SiteConfig, type SiteFetch } from "./data/deployment/siteConfig";
import { SiteScreen } from "./navigation/screens/Login/SiteScreen";

const SITE_ADDRESS_KEY = "@arcnode/site-address";

type Phase =
  | { kind: "loading" }
  | { kind: "ask"; address: string; error?: string }
  | { kind: "ready"; cfg: SiteConfig };

interface SiteRootProps {
  /** DI for tests; defaults to the platform fetch. */
  fetchFn?: SiteFetch;
}

export function SiteRoot({ fetchFn = fetch }: SiteRootProps): React.ReactElement | null {
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });

  const connect = useCallback(
    async (address: string): Promise<void> => {
      try {
        const cfg = await fetchSiteConfig(address, fetchFn);
        await kv.set(SITE_ADDRESS_KEY, cfg.deploymentHost);
        setPhase({ kind: "ready", cfg });
      } catch (err) {
        setPhase({ kind: "ask", address, error: err instanceof Error ? err.message : "Site unreachable" });
      }
    },
    [fetchFn],
  );

  useEffect(() => {
    void kv.get(SITE_ADDRESS_KEY).then((saved) =>
      saved === null ? setPhase({ kind: "ask", address: "" }) : connect(saved),
    );
  }, [connect]);

  const changeSite = useCallback((): void => {
    void kv.remove(SITE_ADDRESS_KEY);
    setPhase({ kind: "ask", address: "" });
  }, []);

  if (phase.kind === "loading") return null; // brief; avoids a card flash on launch
  if (phase.kind === "ready") return <AppRoot cfg={phase.cfg} onChangeSite={changeSite} />;
  return (
    <ThemeProvider>
      <SiteScreen initialAddress={phase.address} error={phase.error} onConnect={connect} />
    </ThemeProvider>
  );
}
