/** DerRequestBanner — approve goes through the two-step confirm, then publishes. AAA. */

import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { DerRequestBanner } from "./DerRequestBanner";
import { ThemeProvider } from "../../../../theme/ThemeProvider";
import { DeploymentIdentityProvider } from "../../../../data/deployment/DeploymentIdentityProvider";
import { TopologyContext } from "../../../../data/topology/TopologyProvider";
import { MqttClientContext } from "../../../../data/mqtt/MqttProvider";
import { TopologyView } from "../../../../data/topology/topology.schema";
import type { MqttClient, MqttMessage } from "../../../../data/mqtt/MqttClient";
import type { GridState } from "../../../../data/grid/useGridState";

// Reason: RN-web reports a 0-width window under jsdom (always "phone"); drive the layout explicitly.
let layout: "desktop" | "phone" = "desktop";
jest.mock("../../../../hooks/useBreakpoint", () => ({ useBreakpoint: () => ({ layout }) }));

beforeEach(() => {
  layout = "desktop";
});

const VIEW = TopologyView.parse({
  deployment_uuid: "u", ems_mode: "sim", sizing_ref: null, buses: [], templates_used: {},
  sizing_params: { P_compute_total_kW: 1, E_BESS_total_kWh: 1, T_coolant_setpoint_C: 1, ride_through_hours: 1, bess_reserve_floor_mwh: 1 },
  devices: { der_dispatch: { device_id: "der_dispatch", template: "der_dispatch", parent: null, display_name: null, extra_measurements: null } },
});

const BASE = { name: "T", host: "localhost", siteId: "s1", mode: "device-demo" as const, chatApiUri: "", deviceApiUri: "/api" };

const PENDING: GridState = {
  mode: "GRID", islandQualifier: null, breakerState: null, frequencyHz: null, netActivePowerW: null,
  curtailmentActive: false, derDispatchState: "PENDING", pvOutputW: null,
};

function renderBanner(state: GridState, published: [string, MqttMessage<unknown>][]): ReturnType<typeof render> {
  const client: MqttClient = { subscribe: () => () => undefined, publish: (topic, msg) => void published.push([topic, msg]) };
  return render(
    <ThemeProvider>
      <DeploymentIdentityProvider base={BASE}>
        <TopologyContext.Provider value={{ status: "ready", view: VIEW, error: null, refetch: () => undefined }}>
          <MqttClientContext.Provider value={client}>
            <DerRequestBanner state={state} />
          </MqttClientContext.Provider>
        </TopologyContext.Provider>
      </DeploymentIdentityProvider>
    </ThemeProvider>,
  );
}

describe("DerRequestBanner", () => {
  it("publishes approve only after the operator confirms", () => {
    // Arrange
    const published: [string, MqttMessage<unknown>][] = [];
    const { getByText } = renderBanner(PENDING, published);

    // Act
    fireEvent.click(getByText("Approve"));
    const beforeConfirm = published.length;
    fireEvent.click(getByText("Send"));

    // Assert
    expect({ beforeConfirm, topic: published[0]?.[0], value: published[0]?.[1].value }).toEqual({
      beforeConfirm: 0,
      topic: "sites/s1/devices/der_dispatch/commands/enable/event_active/none",
      value: true,
    });
  });

  it("keeps phones read-only: no Approve/Reject below desktop (Rule 3.1)", () => {
    // Arrange
    layout = "phone";

    // Act
    const { queryByText } = renderBanner(PENDING, []);

    // Assert
    expect([queryByText("Approve"), queryByText("Approve at the desk console") !== null]).toEqual([null, true]);
  });

  it("shows the rejection outcome with no controls, and nothing when idle", () => {
    // Arrange / Act
    const rejected = renderBanner({ ...PENDING, derDispatchState: "REJECTED" }, []);
    const rejectedText = [rejected.queryByText("Dispatch rejected") !== null, rejected.queryByText("Approve")];
    rejected.unmount();
    const idle = renderBanner({ ...PENDING, derDispatchState: "IDLE" }, []);

    // Assert
    expect([...rejectedText, idle.container.textContent]).toEqual([true, null, ""]);
  });
});
