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
