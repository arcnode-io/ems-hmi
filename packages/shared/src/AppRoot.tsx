/**
 * Cross-platform app entry. Mounts the same provider tree + NavigationRoot on
 * web and native; each platform's `main` feeds it cfg loaded from its own
 * cfg.yml.
 *
 * Real-backend modes (beta, device-demo) gate the shell behind AuthProvider + a
 * login screen; mock modes (local, ai-demo) bypass auth entirely (offline,
 * deterministic — the public demo and the Playwright specs depend on instant
 * entry).
 */

import React from "react";
import { ThemeProvider } from "./theme/ThemeProvider";
import { DeploymentIdentityProvider } from "./data/deployment/DeploymentIdentityProvider";
import { AuthProvider } from "./data/auth/AuthProvider";
import { useAuth } from "./data/auth/useAuth";
import { TopologyProvider } from "./data/topology/TopologyProvider";
import { MockMqttProvider } from "./data/mqtt/MockMqttProvider";
import { RealMqttProvider } from "./data/mqtt/RealMqttProvider";
import { AnalystConversationProvider } from "./data/analyst/AnalystConversationProvider";
import { DerEventNoticeProvider } from "./data/grid/DerEventNoticeProvider";
import {
  usesRealBackend,
  type DeploymentMode,
} from "./data/deployment/deploymentMode";
import { analystStream } from "./data/analyst/sse/analystStream";
import { mockAnalystStream } from "./data/analyst/mockAnalystStream";
import { NavigationRoot } from "./navigation/NavigationRoot";
import { LoginScreen } from "./navigation/screens/Login/LoginScreen";

export interface AppRootCfg {
  deploymentName: string;
  deploymentHost: string;
  siteId: string;
  mode: DeploymentMode;
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
  // Static fixtures are served as JSON files in the mock modes; real-backend
  // modes talk to a device-api that responds at /topology/view.
  return `${cfg.deviceApiUri}/topology/view${usesRealBackend(cfg.mode) ? "" : ".json"}`;
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

/**
 * The authenticated app: topology + MQTT + analyst + navigation. Real broker in
 * beta (the gateway publishes live telemetry); deterministic Mock in demo/local.
 */
function AppShell({ cfg }: { cfg: AppRootCfg }): React.ReactElement {
  const inner = (
    <AnalystConversationProvider stream={resolveAnalystStream()}>
      <DerEventNoticeProvider>
        <NavigationRoot />
      </DerEventNoticeProvider>
    </AnalystConversationProvider>
  );
  return (
    <TopologyProvider viewUrl={topologyUrl(cfg)}>
      {usesRealBackend(cfg.mode) ? (
        <RealMqttProvider>{inner}</RealMqttProvider>
      ) : (
        <MockMqttProvider siteId={cfg.siteId}>{inner}</MockMqttProvider>
      )}
    </TopologyProvider>
  );
}

/** Login gate — render the shell only once a session token exists. */
function AuthGate({ cfg }: { cfg: AppRootCfg }): React.ReactElement | null {
  const { status } = useAuth();
  if (status === "loading") return null; // brief; avoids a gate flash on reload
  if (status !== "authenticated") return <LoginScreen />;
  return <AppShell cfg={cfg} />;
}

export function AppRoot({
  cfg,
  errorBoundary: Boundary,
}: AppRootProps): React.ReactElement {
  // Real-backend modes require a human login; mock modes enter straight in.
  const requiresAuth = usesRealBackend(cfg.mode);
  const inner = requiresAuth ? (
    <AuthProvider>
      <AuthGate cfg={cfg} />
    </AuthProvider>
  ) : (
    <AppShell cfg={cfg} />
  );
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
      {inner}
    </DeploymentIdentityProvider>
  );
  return (
    <ThemeProvider>
      {Boundary ? <Boundary>{tree}</Boundary> : tree}
    </ThemeProvider>
  );
}
