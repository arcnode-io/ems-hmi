import React from "react";
import { act, renderHook } from "@testing-library/react";
import { MqttClientContext } from "./MqttProvider";
import type { MqttClient, MqttMessage } from "./MqttClient";
import { DEFAULT_FLUSH_MS, useAggregateMeasurements } from "./useAggregateMeasurements";
import { MockMqttClientImpl } from "./MockMqttProvider";

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

function wrapperFor(client: MqttClient) {
  return ({ children }: { children: React.ReactNode }): React.ReactElement => (
    <MqttClientContext.Provider value={client}>{children}</MqttClientContext.Provider>
  );
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe("useAggregateMeasurements flushMs", () => {
  it("batches a burst of messages into one render per flush window", () => {
    // Arrange — ~1k GPU msgs/s would otherwise mean ~1k renders/s
    const client = fakeClient();
    let renders = 0;
    const { result } = renderHook(
      () => {
        renders += 1;
        return useAggregateMeasurements<number>(["a", "b"], { flushMs: 1000 });
      },
      { wrapper: wrapperFor(client) },
    );
    const before = renders;

    // Act — each wire message is its own event, so its own act()
    for (let i = 0; i < 50; i++) {
      act(() => client.emit("a", i));
      act(() => client.emit("b", i * 2));
    }
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Assert
    expect({ a: result.current.a?.value, b: result.current.b?.value, rendersAdded: renders - before }).toEqual({
      a: 49,
      b: 98,
      rendersAdded: 1,
    });
  });
});

describe("useAggregateMeasurements wildcard", () => {
  it("keys messages by the concrete topic they arrived on, not the filter", () => {
    // Arrange — one node-level filter, two measurements under it
    const client = new MockMqttClientImpl();
    const { result } = renderHook(() => useAggregateMeasurements<number>(["sites/s/devices/+/measurements/p/watts"]), {
      wrapper: wrapperFor(client),
    });

    // Act
    act(() => client.broadcast("sites/s/devices/n1/measurements/p/watts", { ts: "t", value: 8000 }));
    act(() => client.broadcast("sites/s/devices/n2/measurements/p/watts", { ts: "t", value: 1000 }));
    act(() => { jest.advanceTimersByTime(DEFAULT_FLUSH_MS); });

    // Assert
    expect(Object.fromEntries(Object.entries(result.current).map(([topic, msg]) => [topic, msg.value]))).toEqual({
      "sites/s/devices/n1/measurements/p/watts": 8000,
      "sites/s/devices/n2/measurements/p/watts": 1000,
    });
  });
});

describe("useAggregateMeasurements unmount", () => {
  it("unsubscribes every filter and stops its flush timer when the component unmounts", () => {
    // Arrange
    const live = new Set<string>();
    const client = {
      subscribe: (topic: string) => {
        live.add(topic);
        return () => live.delete(topic);
      },
      publish: () => undefined,
    } as MqttClient;
    const { unmount } = renderHook(() => useAggregateMeasurements<number>(["a", "b"], { flushMs: 1000 }), {
      wrapper: wrapperFor(client),
    });
    const mounted = live.size;

    // Act
    unmount();

    // Assert
    expect([mounted, live.size, jest.getTimerCount()]).toEqual([2, 0, 0]);
  });
});

describe("useAggregateMeasurements default batching", () => {
  it("batches by default — a burst re-renders once per window, not once per message", () => {
    // Arrange — no options: root-level hooks (fleet KPIs, alarms) used to re-render the whole app per message
    const client = fakeClient();
    let renders = 0;
    const { result } = renderHook(
      () => {
        renders += 1;
        return useAggregateMeasurements<number>(["a", "b"]);
      },
      { wrapper: wrapperFor(client) },
    );
    const before = renders;

    // Act
    for (let i = 0; i < 20; i++) {
      act(() => client.emit("a", i));
      act(() => client.emit("b", i));
    }
    act(() => { jest.advanceTimersByTime(DEFAULT_FLUSH_MS); });

    // Assert
    expect({ a: result.current.a?.value, rendersAdded: renders - before }).toEqual({ a: 19, rendersAdded: 1 });
  });

  it("updates per message only when explicitly asked (flushMs: 0)", () => {
    // Arrange
    const client = fakeClient();
    const { result } = renderHook(() => useAggregateMeasurements<number>(["a"], { flushMs: 0 }), { wrapper: wrapperFor(client) });

    // Act
    act(() => client.emit("a", 7));

    // Assert
    expect(result.current.a?.value).toBe(7);
  });
});
