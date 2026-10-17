import React from "react";
import { act, renderHook } from "@testing-library/react";
import type { MessageListener } from "./MqttClient";
import { TopologyContext } from "../topology/TopologyProvider";
import { ON_CHANGE_TOPIC, PERIODIC_TOPIC, STALE_TEST_VIEW } from "./staleTestView";
import { MqttClientContext } from "./MqttProvider";
import type { MqttClient } from "./MqttClient";
import { useSubscription } from "./useSubscription";

function fakeClient(): MqttClient & { topics: string[] } {
  const topics: string[] = [];
  return {
    topics,
    subscribe: (topic: string) => {
      topics.push(topic);
      return () => {};
    },
  } as unknown as MqttClient & { topics: string[] };
}

describe("useSubscription", () => {
  it("subscribes to nothing for a null topic (device absent from topology)", () => {
    // Arrange
    const client = fakeClient();
    const wrapper = ({ children }: { children: React.ReactNode }): React.ReactElement => (
      <MqttClientContext.Provider value={client}>{children}</MqttClientContext.Provider>
    );

    // Act
    const { result } = renderHook(() => useSubscription<boolean>(null), { wrapper });

    // Assert
    expect({ latest: result.current, topics: client.topics }).toEqual({ latest: null, topics: [] });
  });
});

describe("useSubscription unmount", () => {
  it("unsubscribes when the component unmounts", () => {
    // Arrange
    const live = new Set<string>();
    const client = {
      subscribe: (topic: string) => {
        live.add(topic);
        return () => live.delete(topic);
      },
      publish: () => undefined,
    } as MqttClient;
    const { unmount } = renderHook(() => useSubscription<number>("sites/s1/devices/d/measurements/p/watts"), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <MqttClientContext.Provider value={client}>{children}</MqttClientContext.Provider>
      ),
    });
    const mounted = live.size;

    // Act
    unmount();

    // Assert
    expect([mounted, live.size]).toEqual([1, 0]);
  });
});

describe("useSubscription stale readings (global policy)", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("reads unknown after 3 missed publishes at the catalog rate, but holds an on-change value", () => {
    // Arrange
    const listeners = new Map<string, MessageListener<unknown>>();
    const client = {
      subscribe: (topic: string, listener: MessageListener<unknown>) => {
        listeners.set(topic, listener);
        return () => listeners.delete(topic);
      },
    } as unknown as MqttClient;
    const wrapper = ({ children }: { children: React.ReactNode }): React.ReactElement => (
      <TopologyContext.Provider value={{ status: "ready", view: STALE_TEST_VIEW, error: null, refetch: () => undefined }}>
        <MqttClientContext.Provider value={client}>{children}</MqttClientContext.Provider>
      </TopologyContext.Provider>
    );
    const { result } = renderHook(
      () => [useSubscription<number>(PERIODIC_TOPIC), useSubscription<number>(ON_CHANGE_TOPIC)],
      { wrapper },
    );
    act(() => listeners.get(PERIODIC_TOPIC)!({ ts: "t", value: 5 }, PERIODIC_TOPIC));
    act(() => listeners.get(ON_CHANGE_TOPIC)!({ ts: "t", value: 1 }, ON_CHANGE_TOPIC));

    // Act
    act(() => { jest.advanceTimersByTime(4000); });

    // Assert
    expect(result.current.map((m) => m?.value ?? null)).toEqual([null, 1]);
  });
});
