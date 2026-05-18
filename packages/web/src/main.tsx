/**
 * App entry. Provider order (outer → inner):
 *   ThemeProvider                  — tokens + theme switch
 *     ErrorBoundary                — catches render errors
 *       DeploymentIdentityProvider — name + host + mode from cfg.yml
 *         TopologyProvider         — fetches /topology/view at boot
 *           MqttRoot               — MockMqttProvider in demo mode
 *             App                  — chrome + routes + screens
 *
 * SLD is rendered client-side from the topology view via layoutSld +
 * SldRenderer (no fetched SVG fixture).
 */

import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./theme/fonts.css";
import { ThemeProvider } from "@ems-hmi/shared/theme/ThemeProvider";
import { DeploymentIdentityProvider } from "@ems-hmi/shared/data/deployment/DeploymentIdentityProvider";
import { TopologyProvider } from "@ems-hmi/shared/data/topology/TopologyProvider";
import { MockMqttProvider } from "@ems-hmi/shared/data/mqtt/MockMqttProvider";
import { ErrorBoundary } from "./components/features";
import App from "./App";
import { loadConfig } from "./config";

const cfg = loadConfig();

console.info(`Running with config: ${JSON.stringify(cfg)}`);

// Reason: local + demo both serve static JSON fixtures under public/api; only
// beta talks to a real device-api. Append `.json` for the static cases so the
// dev server / S3 serve the file directly.
const topologyViewUrl = `${cfg.deviceApiUri}/topology/view${cfg.mode === "beta" ? "" : ".json"}`;

/**
 * MQTT provider chosen by deployment mode. Demo wires MockMqttProvider; other
 * modes are TBD (RealMqttProvider lands later).
 * @param props children subtree to wrap with MQTT context
 * @param props.children subtree to wrap with MQTT context
 * @returns MockMqttProvider element wrapping children
 */
function MqttRoot({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  if (cfg.mode === "demo") {
    return <MockMqttProvider siteId={cfg.siteId}>{children}</MockMqttProvider>;
  }
  // Reason: RealMqttProvider not yet implemented. Until it lands, treat
  // non-demo modes as demo too so the app boots — replace this branch when
  // the real impl arrives.
  return <MockMqttProvider siteId="demo_site">{children}</MockMqttProvider>;
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <ErrorBoundary>
      <DeploymentIdentityProvider
        identity={{
          name: cfg.deploymentName,
          host: cfg.deploymentHost,
          siteId: cfg.siteId,
          mode: cfg.mode,
          chatApiUri: cfg.chatApiUri,
          deviceApiUri: cfg.deviceApiUri,
        }}
      >
        <TopologyProvider viewUrl={topologyViewUrl}>
          <MqttRoot>
            <App />
          </MqttRoot>
        </TopologyProvider>
      </DeploymentIdentityProvider>
    </ErrorBoundary>
  </ThemeProvider>,
);
