import React from "react";
import { act, renderHook } from "@testing-library/react";
import { MqttClientContext } from "../mqtt/MqttProvider";
import type { MqttClient, MqttMessage } from "../mqtt/MqttClient";
import { DEFAULT_FLUSH_MS } from "../mqtt/useAggregateMeasurements";
import { DeploymentIdentityProvider } from "../deployment/DeploymentIdentityProvider";
import { TopologyContext } from "../topology/TopologyProvider";
import type { TopologyViewType } from "../topology/topology.schema";
import { useSiteHealth } from "./useSiteHealth";

type Listener = (msg: MqttMessage<unknown>, topic: string) => void;

function fakeClient(): MqttClient & { emit: (topic: string, value: number) => void } {
  const listeners = new Map<string, Listener>();
  return {
    subscribe: (topic: string, listener: Listener) => {
      listeners.set(topic, listener);
      return () => listeners.delete(topic);
    },
    emit: (topic: string, value: number) => listeners.get(topic)?.({ ts: "t", value }, topic),
  } as unknown as MqttClient & { emit: (topic: string, value: number) => void };
}

const TEMP = {
  unit: "celsius", type: "float", poll_rate_hz: 1, display_name_default: "Temp", iec_61850_ref: null,
  bounds: null, thresholds: { warn_min: 0, warn_max: 45, alarm_min: -10, alarm_max: 55 }, values: null,
};

function view(provisioned: boolean): TopologyViewType {
  return {
    devices: {
      rack_1: { device_id: "rack_1", template: "rack", parent: null, display_name: "R1", extra_measurements: null, provisioned },
      rack_2: { device_id: "rack_2", template: "rack", parent: null, display_name: "R2", extra_measurements: null, provisioned },
    },
    buses: [],
    templates_used: { rack: { template: "rack", kind: "leaf", measurements: { temp: TEMP }, commands: {} } },
  } as unknown as TopologyViewType;
}

const TOPIC = (id: string): string => `sites/s/devices/${id}/measurements/temp/celsius`;

function wrapperFor(client: MqttClient, v: TopologyViewType) {
  return ({ children }: { children: React.ReactNode }): React.ReactElement => (
    <DeploymentIdentityProvider
      base={{ name: "T", host: "h", siteId: "s", mode: "local", chatApiUri: "", deviceApiUri: "", derControlUri: "" }}
    >
      <TopologyContext.Provider value={{ status: "ready", view: v, error: null, refetch: () => undefined }}>
        <MqttClientContext.Provider value={client}>{children}</MqttClientContext.Provider>
      </TopologyContext.Provider>
    </DeploymentIdentityProvider>
  );
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe("useSiteHealth", () => {
  it("reads an unprovisioned, silent site as unknown", () => {
    // Arrange / Act
    const { result } = renderHook(() => useSiteHealth(), { wrapper: wrapperFor(fakeClient(), view(false)) });

    // Assert
    expect([result.current.level, result.current.reason]).toEqual(["unknown", { kind: "unprovisioned", count: 2 }]);
  });

  it("turns nominal only once every monitored reading is in", () => {
    // Arrange
    const client = fakeClient();
    const { result } = renderHook(() => useSiteHealth(), { wrapper: wrapperFor(client, view(true)) });
    const levels: string[] = [];

    // Act
    act(() => client.emit(TOPIC("rack_1"), 25));
    act(() => { jest.advanceTimersByTime(DEFAULT_FLUSH_MS); });
    levels.push(result.current.level);
    act(() => client.emit(TOPIC("rack_2"), 26));
    act(() => { jest.advanceTimersByTime(DEFAULT_FLUSH_MS); });
    levels.push(result.current.level);

    // Assert
    expect(levels).toEqual(["unknown", "nominal"]);
  });
});
