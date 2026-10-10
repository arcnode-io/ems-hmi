import React from "react";
import { act, renderHook } from "@testing-library/react";
import { DeploymentIdentityProvider, type DeploymentIdentityBase } from "../deployment/DeploymentIdentityProvider";
import type { DeploymentMode } from "../deployment/deploymentMode";
import { AuthContext, type AuthState } from "../auth/AuthProvider";
import type { AuthRole } from "../auth/authClient";
import { MqttProvider } from "../mqtt/MqttProvider";
import { MockMqttClientImpl } from "../mqtt/MockMqttProvider";
import { TopologyContext, type TopologyContextValue } from "../topology/TopologyProvider";
import type { TopologyViewType } from "../topology/topology.schema";
import { systemTopic } from "../topics/topicBuilder";
import type { LotoFetch } from "./lotoApi";
import { LotoProvider } from "./LotoProvider";
import { useLoto } from "./useLoto";

const TOPOLOGY = {
  status: "ready",
  error: null,
  refetch: () => undefined,
  view: { devices: { bess_module_01: { parent: null }, bess_rack_01: { parent: "bess_module_01" } } } as unknown as TopologyViewType,
} satisfies TopologyContextValue;

const auth = (role: AuthRole): AuthState => ({
  status: "authenticated", token: "tok", role, login: () => Promise.resolve(), logout: () => undefined,
});

function wrapperFor(opts: { mode: DeploymentMode; auth: AuthState | null; client: MockMqttClientImpl; fetchFn?: LotoFetch }) {
  const base: DeploymentIdentityBase = {
    name: "T", host: "h", siteId: "s", mode: opts.mode, chatApiUri: "", deviceApiUri: "/api", derControlUri: "",
  };
  return ({ children }: { children: React.ReactNode }): React.ReactElement => (
    <DeploymentIdentityProvider base={base}>
      <AuthContext.Provider value={opts.auth}>
        <TopologyContext.Provider value={TOPOLOGY}>
          <MqttProvider client={opts.client}>
            <LotoProvider fetchFn={opts.fetchFn}>{children}</LotoProvider>
          </MqttProvider>
        </TopologyContext.Provider>
      </AuthContext.Provider>
    </DeploymentIdentityProvider>
  );
}

const flush = async (): Promise<void> => {
  await act(async () => {
    for (let i = 0; i < 6; i++) await Promise.resolve();
  });
};

describe("LotoProvider", () => {
  it("locks a module in a mock build and padlocks its racks", async () => {
    // Arrange
    const { result } = renderHook(() => useLoto(), {
      wrapper: wrapperFor({ mode: "local", auth: null, client: new MockMqttClientImpl() }),
    });
    await flush();

    // Act
    await act(() => result.current.lock("bess_module_01", { holder_name: "Ann", permit_ref: null }));
    await flush();

    // Assert
    expect([...result.current.lockedDevices]).toEqual(["bess_module_01", "bess_rack_01"]);
  });

  it("re-reads GET /loto when the loto_changed beacon arrives", async () => {
    // Arrange
    const client = new MockMqttClientImpl();
    const urls: string[] = [];
    const fetchFn: LotoFetch = (url) => {
      urls.push(url);
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ locks: [], locked_devices: [] }) });
    };
    renderHook(() => useLoto(), { wrapper: wrapperFor({ mode: "deployed", auth: auth("operator"), client, fetchFn }) });
    await flush();

    // Act
    act(() => client.broadcast(systemTopic("loto_changed"), { ts: "2026-10-10T19:04:12.345Z", value: undefined }));
    await flush();

    // Assert
    expect(urls).toEqual(["/api/loto", "/api/loto"]);
  });

  it("lets operators write and viewers only read", async () => {
    // Arrange
    const client = new MockMqttClientImpl();
    const fetchFn: LotoFetch = () =>
      Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ locks: [], locked_devices: [] }) });

    // Act
    const roles = (["operator", "viewer"] as const).map(
      (role) =>
        renderHook(() => useLoto(), { wrapper: wrapperFor({ mode: "deployed", auth: auth(role), client, fetchFn }) }).result
          .current.canWrite,
    );
    await flush();

    // Assert
    expect(roles).toEqual([true, false]);
  });
});
