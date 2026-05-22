/**
 * Cross-platform app entry. Mounts the same provider tree + NavigationRoot
 * on web and native; each platform's `main` feeds it cfg loaded from its
 * own cfg.yml.
 */

import React from "react";
import { ThemeProvider } from "./theme/ThemeProvider";
import { DeploymentIdentityProvider } from "./data/deployment/DeploymentIdentityProvider";
import { TopologyProvider } from "./data/topology/TopologyProvider";
import { MockMqttProvider } from "./data/mqtt/MockMqttProvider";
import { AnalystConversationProvider } from "./data/analyst/AnalystConversationProvider";
import { analystStream } from "./data/analyst/sse/analystStream";
import { mockAnalystStream } from "./data/analyst/mockAnalystStream";
import { NavigationRoot } from "./navigation/NavigationRoot";

export interface AppRootCfg {
  deploymentName: string;
  deploymentHost: string;
  siteId: string;
  mode: "local" | "beta" | "demo";
  chatApiUri: string;
  deviceApiUri: string;
  mqttUri: string;
}

export interface AppRootProps {
  cfg: AppRootCfg;
  /** Optional error boundary slot (e.g. web ships one with retry UI). */
  errorBoundary?: React.ComponentType<{ children: React.ReactNode }>;
}

function topologyUrl(cfg: AppRootCfg): string {
  // Static fixtures are served as JSON files in local + demo; only beta
  // talks to a real device-api that responds at /topology/view.
  return `${cfg.deviceApiUri}/topology/view${cfg.mode === "beta" ? "" : ".json"}`;
}

/**
 * Live SSE stream by default; `?mock` in the URL swaps in the canned stream
 * so the Playwright e2e + offline dev get a deterministic, server-free run.
 */
function resolveAnalystStream(): typeof analystStream {
  const search = (globalThis as { location?: { search?: string } }).location
    ?.search;
  return search?.includes("mock") ? mockAnalystStream : analystStream;
}

export function AppRoot({ cfg, errorBoundary: Boundary }: AppRootProps): React.ReactElement {
  const tree = (
    <DeploymentIdentityProvider
      base={{
        name: cfg.deploymentName,
        host: cfg.deploymentHost,
        siteId: cfg.siteId,
        mode: cfg.mode,
        chatApiUri: cfg.chatApiUri,
        deviceApiUri: cfg.deviceApiUri,
      }}
    >
      <TopologyProvider viewUrl={topologyUrl(cfg)}>
        <MockMqttProvider siteId={cfg.siteId}>
          <AnalystConversationProvider stream={resolveAnalystStream()}>
            <NavigationRoot />
          </AnalystConversationProvider>
        </MockMqttProvider>
      </TopologyProvider>
    </DeploymentIdentityProvider>
  );
  return (
    <ThemeProvider>
      {Boundary ? <Boundary>{tree}</Boundary> : tree}
    </ThemeProvider>
  );
}
