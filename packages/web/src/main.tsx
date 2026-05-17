/**
 * App entry. Provider order (outer → inner):
 *   ThemeProvider                  — tokens + theme switch
 *     ErrorBoundary                — catches render errors
 *       DeploymentIdentityProvider — name + host + mode from cfg.yml
 *         TopologyProvider         — fetches /topology/view at boot
 *           SldProvider            — fetches /topology/sld.svg at boot
 *             MqttRoot             — MockMqttProvider in demo mode
 *               App                — chrome + routes + screens
 *
 * MQTT provider impl is selected by `cfg.mode`. Demo mode swaps in
 * MockMqttProvider; other modes will use RealMqttProvider once it lands.
 */

import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./theme/fonts.css";
import { ThemeProvider } from "@ems-hmi/shared/theme/ThemeProvider";
import { DeploymentIdentityProvider } from "@ems-hmi/shared/data/deployment/DeploymentIdentityProvider";
import { TopologyProvider } from "@ems-hmi/shared/data/topology/TopologyProvider";
import { SldProvider } from "@ems-hmi/shared/data/sld/SldProvider";
import { useBreakpoint } from "@ems-hmi/shared/hooks/useBreakpoint";
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
 * Pick the SLD SVG URL by breakpoint. Phone → portrait (vertical stack),
 * everything else → landscape (horizontal row). edp-api emits both via the
 * `orientation` query/arg on /edp-api/sld-hmi-svg; local + demo serve them
 * as static fixtures.
 * @param layout breakpoint layout (phone or desktop)
 * @returns absolute or same-origin URL for the SVG fixture/endpoint
 */
function sldSvgUrlFor(layout: "phone" | "desktop"): string {
  if (cfg.mode === "beta") {
    return `${cfg.deviceApiUri}/topology/sld.svg?orientation=${layout === "phone" ? "portrait" : "landscape"}`;
  }
  return `${cfg.deviceApiUri}/topology/sld${layout === "phone" ? "-portrait" : ""}.svg`;
}

/**
 * Wraps SldProvider with a breakpoint-aware URL. Re-fetches on rotate/resize.
 * @param props children subtree
 * @param props.children subtree to wrap
 * @returns SldProvider element
 */
function SldRoot({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const { layout } = useBreakpoint();
  return <SldProvider svgUrl={sldSvgUrlFor(layout)}>{children}</SldProvider>;
}

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
    return <MockMqttProvider siteId="demo_site">{children}</MockMqttProvider>;
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
          mode: cfg.mode,
          chatApiUri: cfg.chatApiUri,
          deviceApiUri: cfg.deviceApiUri,
        }}
      >
        <TopologyProvider viewUrl={topologyViewUrl}>
          <SldRoot>
            <MqttRoot>
              <App />
            </MqttRoot>
          </SldRoot>
        </TopologyProvider>
      </DeploymentIdentityProvider>
    </ErrorBoundary>
  </ThemeProvider>,
);
