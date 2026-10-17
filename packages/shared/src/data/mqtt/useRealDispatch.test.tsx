import { act, renderHook } from "@testing-library/react";
import { useRealDispatch } from "./useRealDispatch";
import type { MessageListener, MqttClient } from "./MqttClient";
import type { DispatchCommand } from "../dispatch/dispatch.types";

const COMMAND: DispatchCommand = { deviceId: "bess_module_1", setpointKw: 500 };
const STATE_TOPIC = "sites/s1/devices/bess_module_1/events/dispatch_state";

function recordingClient(): { client: MqttClient; live: Map<string, MessageListener<unknown>> } {
  const live = new Map<string, MessageListener<unknown>>();
  const client: MqttClient = {
    subscribe: (topic, listener) => {
      live.set(topic, listener as MessageListener<unknown>);
      return () => live.delete(topic);
    },
    publish: () => undefined,
  };
  return { client, live };
}

describe("useRealDispatch", () => {
  it("publishes the setpoint in watts with a command id, and settles on the gateway's done", () => {
    // Arrange
    const { client, live } = recordingClient();
    const frames: Array<[string, Record<string, string | number>]> = [];
    const { result } = renderHook(() => useRealDispatch(client, (topic, frame) => frames.push([topic, frame]), "s1"));
    const before = result.current.state.phase;

    // Act
    act(() => result.current.confirm(COMMAND));
    const pending = result.current.state.phase;
    const commandId = frames[0]![1].command_id;
    act(() => live.get(STATE_TOPIC)!({ ts: "t", command_id: commandId, phase: "done" } as never, STATE_TOPIC));

    // Assert
    expect([before, pending, result.current.state.phase]).toEqual(["idle", "pending", "settled"]);
    expect([frames[0]![0], frames[0]![1].value]).toEqual(["sites/s1/devices/bess_module_1/commands/set/active_power/watts", 500_000]);
  });

  it("releases its dispatch-state subscription when the provider unmounts mid-dispatch", () => {
    // Arrange
    const { client, live } = recordingClient();
    const { result, unmount } = renderHook(() => useRealDispatch(client, () => undefined, "s1"));
    act(() => result.current.confirm(COMMAND));
    const duringDispatch = live.size;

    // Act
    unmount();

    // Assert
    expect([duringDispatch, live.size]).toEqual([1, 0]);
  });
});
