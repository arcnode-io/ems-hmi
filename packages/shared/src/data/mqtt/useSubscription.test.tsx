import React from "react";
import { renderHook } from "@testing-library/react";
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
