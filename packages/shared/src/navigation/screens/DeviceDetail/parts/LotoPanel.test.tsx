import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "../../../../theme/ThemeProvider";
import { DeploymentIdentityProvider } from "../../../../data/deployment/DeploymentIdentityProvider";
import type { DeploymentMode } from "../../../../data/deployment/deploymentMode";
import { AuthContext, type AuthState } from "../../../../data/auth/AuthProvider";
import { MqttProvider } from "../../../../data/mqtt/MqttProvider";
import { MockMqttClientImpl } from "../../../../data/mqtt/MockMqttProvider";
import { TopologyContext } from "../../../../data/topology/TopologyProvider";
import type { TopologyViewType } from "../../../../data/topology/topology.schema";
import { LotoProvider } from "../../../../data/loto/LotoProvider";
import { createMockLotoFetch } from "../../../../data/loto/mockLotoFetch";
import { setLock, type LotoFetch } from "../../../../data/loto/lotoApi";
import { LotoPanel } from "./LotoPanel";

const DEVICES = { bess_module_01: { parent: null } };
const VIEW = { devices: DEVICES } as unknown as TopologyViewType;
const VIEWER: AuthState = {
  status: "authenticated", token: "tok", role: "viewer", login: () => Promise.resolve(), logout: () => undefined,
};

function renderPanel(opts: { mode: DeploymentMode; auth: AuthState | null; fetchFn?: LotoFetch }): void {
  render(
    <ThemeProvider>
      <DeploymentIdentityProvider
        base={{ name: "T", host: "h", siteId: "s", mode: opts.mode, chatApiUri: "", deviceApiUri: "", derControlUri: "" }}
      >
        <AuthContext.Provider value={opts.auth}>
          <TopologyContext.Provider value={{ status: "ready", view: VIEW, error: null, refetch: () => undefined }}>
            <MqttProvider client={new MockMqttClientImpl()}>
              <LotoProvider fetchFn={opts.fetchFn}>
                <LotoPanel deviceId="bess_module_01" />
              </LotoProvider>
            </MqttProvider>
          </TopologyContext.Provider>
        </AuthContext.Provider>
      </DeploymentIdentityProvider>
    </ThemeProvider>,
  );
}

const settle = async (): Promise<void> => {
  await act(async () => {
    for (let i = 0; i < 10; i++) await Promise.resolve();
  });
};

async function addLock(name: string): Promise<void> {
  fireEvent.change(screen.getByTestId("loto-holder"), { target: { value: name } });
  fireEvent.click(screen.getByRole("button", { name: "Add my lock" }));
  await settle();
}

const holders = (): string[] => screen.queryAllByTestId("loto-active-holder").map((n) => n.textContent ?? "");

describe("LotoPanel", () => {
  it("an operator's lock shows in the active list", async () => {
    // Arrange
    renderPanel({ mode: "local", auth: null });
    await settle();

    // Act
    await addLock("Ann");

    // Assert
    expect(holders()).toEqual(["Ann"]);
  });

  it("clearing one of two locks leaves the device locked", async () => {
    // Arrange
    renderPanel({ mode: "local", auth: null });
    await settle();
    await addLock("Ann");
    await addLock("Bo");

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Clear Ann's lock" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm clear" }));
    await settle();

    // Assert
    expect([holders(), screen.getByTestId("loto-state").textContent]).toEqual([
      ["Bo"],
      "Locked out by 1 person. Commands to this device and everything under it are refused.",
    ]);
  });

  it("refuses a blank name without calling the API", async () => {
    // Arrange
    renderPanel({ mode: "local", auth: null });
    await settle();

    // Act
    await addLock("   ");

    // Assert
    expect([holders(), screen.queryAllByText("Enter the name of the person holding the lock.").length]).toEqual([[], 1]);
  });

  it("a viewer sees the locks but no lock or clear buttons", async () => {
    // Arrange
    const fetchFn = createMockLotoFetch(() => DEVICES);
    await setLock({ baseUri: "", token: "t" }, "bess_module_01", { holder_name: "Ann", permit_ref: "WO-1" }, fetchFn);

    // Act
    renderPanel({ mode: "deployed", auth: VIEWER, fetchFn });
    await settle();

    // Assert
    expect([
      holders(),
      screen.queryByRole("button", { name: "Add my lock" }),
      screen.queryByRole("button", { name: "Clear Ann's lock" }),
    ]).toEqual([["Ann"], null, null]);
  });
});
