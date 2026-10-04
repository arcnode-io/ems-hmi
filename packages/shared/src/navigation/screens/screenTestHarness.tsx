/** Test harness for screen parts: theme + identity + topology + a recording MQTT client. */

import React from "react";
import { render } from "@testing-library/react";
import { ThemeProvider } from "../../theme/ThemeProvider";
import { DeploymentIdentityProvider } from "../../data/deployment/DeploymentIdentityProvider";
import { TopologyContext } from "../../data/topology/TopologyProvider";
import { MqttClientContext } from "../../data/mqtt/MqttProvider";
import { TopologyView, type TopologyViewType } from "../../data/topology/topology.schema";
import type { MqttClient, MqttMessage } from "../../data/mqtt/MqttClient";

export const SITE_ID = "s1";

export const BASE_VIEW: TopologyViewType = TopologyView.parse({
  deployment_uuid: "u", ems_mode: "sim", sizing_ref: null, buses: [], templates_used: {},
  sizing_params: { P_compute_total_kW: 1, E_BESS_total_kWh: 1, T_coolant_setpoint_C: 1, ride_through_hours: 1, bess_reserve_floor_mwh: 1 },
  devices: { der_dispatch: { device_id: "der_dispatch", template: "der_dispatch", parent: null, display_name: null, extra_measurements: null } },
});

const BASE = { name: "T", host: "localhost", siteId: SITE_ID, mode: "device-demo" as const, chatApiUri: "", deviceApiUri: "/api" };

export type Published = [string, MqttMessage<unknown>][];

/**
 * Render inside the providers screen parts need. `retained` replays a value to
 * any subscriber of that topic (like the broker's retained state).
 */
export function renderWithScreen(
  node: React.ReactElement,
  published: Published,
  retained: Record<string, unknown> = {},
  view: TopologyViewType = BASE_VIEW,
): ReturnType<typeof render> {
  const client: MqttClient = {
    subscribe: (topic, listener) => {
      if (topic in retained) listener({ ts: "t", value: retained[topic] as never }, topic);
      return () => undefined;
    },
    publish: (topic, msg) => void published.push([topic, msg]),
  };
  return render(
    <ThemeProvider>
      <DeploymentIdentityProvider base={BASE}>
        <TopologyContext.Provider value={{ status: "ready", view, error: null, refetch: () => undefined }}>
          <MqttClientContext.Provider value={client}>{node}</MqttClientContext.Provider>
        </TopologyContext.Provider>
      </DeploymentIdentityProvider>
    </ThemeProvider>,
  );
}
