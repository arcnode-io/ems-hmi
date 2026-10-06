import { act, renderHook } from "@testing-library/react";
import { useRealDispatch } from "./useRealDispatch";
import type { MqttClient } from "./MqttClient";
import type { DispatchProposal } from "../dispatch/dispatch.types";

describe("useRealDispatch", () => {
  it("releases its dispatch-state subscription when the provider unmounts mid-dispatch", () => {
    // Arrange — a client that records live subscriptions
    const live = new Set<string>();
    const client: MqttClient = {
      subscribe: (topic) => {
        live.add(topic);
        return () => live.delete(topic);
      },
      publish: () => undefined,
    };
    const proposal: DispatchProposal = { deviceId: "bess_module_01", setpointKw: 500, priceUsdPerMwh: 120, reason: "test" };
    const { result, unmount } = renderHook(() => useRealDispatch(client, () => undefined, "s1"));
    act(() => result.current.confirm(proposal, 50));
    const duringDispatch = live.size;

    // Act
    unmount();

    // Assert
    expect([duringDispatch, live.size]).toEqual([1, 0]);
  });
});
