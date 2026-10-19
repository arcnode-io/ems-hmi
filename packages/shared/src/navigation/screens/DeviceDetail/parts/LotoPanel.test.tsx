import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "../../../../theme/ThemeProvider";
import { DeploymentIdentityProvider } from "../../../../data/deployment/DeploymentIdentityProvider";
import { AuthContext, type AuthState } from "../../../../data/auth/AuthProvider";
import { MqttProvider } from "../../../../data/mqtt/MqttProvider";
import { MemoryMqttClient } from "../../../../data/mqtt/memoryMqttClient";
import { TopologyContext } from "../../../../data/topology/TopologyProvider";
import type { TopologyViewType } from "../../../../data/topology/topology.schema";
import { LotoProvider } from "../../../../data/loto/LotoProvider";
import { createMemoryLotoFetch } from "../../../../data/loto/memoryLotoFetch";
import { setLock, type LotoFetch } from "../../../../data/loto/lotoApi";
import { LotoPanel } from "./LotoPanel";

const DEVICES = { bess_module_01: { parent: null } };
const VIEW = { devices: DEVICES } as unknown as TopologyViewType;
const session = (role: "operator" | "viewer"): AuthState => ({
  status: "authenticated", token: "tok", role, login: () => Promise.resolve(), logout: () => undefined,
});
const OPERATOR = session("operator");
const VIEWER = session("viewer");

function renderPanel(opts: { auth: AuthState; fetchFn?: LotoFetch }): void {
  render(
    <ThemeProvider>
      <DeploymentIdentityProvider
        base={{ name: "T", host: "h", siteId: "s", mode: "deployed", chatApiUri: "", deviceApiUri: "", derControlUri: "" }}
      >
        <AuthContext.Provider value={opts.auth}>
          <TopologyContext.Provider value={{ status: "ready", view: VIEW, error: null, refetch: () => undefined }}>
            <MqttProvider client={new MemoryMqttClient()}>
              <LotoProvider fetchFn={opts.fetchFn ?? createMemoryLotoFetch(() => DEVICES)}>
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
    renderPanel({ auth: OPERATOR });
    await settle();

    // Act
    await addLock("Ann");

    // Assert
    expect(holders()).toEqual(["Ann"]);
  });

  it("clearing one of two locks leaves the device locked", async () => {
    // Arrange
    renderPanel({ auth: OPERATOR });
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
    renderPanel({ auth: OPERATOR });
    await settle();

    // Act
    await addLock("   ");

    // Assert
    expect([holders(), screen.queryAllByText("Enter the name of the person holding the lock.").length]).toEqual([[], 1]);
  });

  it("a viewer sees the locks but no lock or clear buttons", async () => {
    // Arrange
    const fetchFn = createMemoryLotoFetch(() => DEVICES);
    await setLock({ baseUri: "", token: "t" }, "bess_module_01", { holder_name: "Ann", permit_ref: "WO-1" }, fetchFn);

    // Act
    renderPanel({ auth: VIEWER, fetchFn });
    await settle();

    // Assert
    expect([
      holders(),
      screen.queryByRole("button", { name: "Add my lock" }),
      screen.queryByRole("button", { name: "Clear Ann's lock" }),
    ]).toEqual([["Ann"], null, null]);
  });
});
