/**
 * Tests for useAskAnalyst — the dispatch→Analyst hand-off. Navigation is
 * stubbed; the stream is faked so we can inspect the outgoing request. AAA.
 */

import React from "react";
import { render, act, waitFor } from "@testing-library/react";
import { arbitrageQuestion, useAskAnalyst } from "./useAskAnalyst";
import { AnalystConversationProvider } from "./AnalystConversationProvider";
import { DeploymentIdentityProvider } from "../deployment/DeploymentIdentityProvider";
import type { AnalystChatRequest } from "./types";
import type { AnalystStreamFn } from "./sse/analystStream";

const navigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate }),
}));

const BASE = {
  name: "Test Site",
  host: "localhost",
  siteId: "demo-site",
  mode: "local" as const,
  chatApiUri: "http://localhost:8000",
  deviceApiUri: "/api",
};

function Trigger({ deviceId }: { deviceId: string }): React.ReactElement {
  const ask = useAskAnalyst();
  return (
    <button type="button" onClick={() => ask(deviceId)}>
      go
    </button>
  );
}

describe("arbitrageQuestion", () => {
  it("names the device and asks for the week window", () => {
    // Act
    const q = arbitrageQuestion("bess_module_01");

    // Assert
    expect(q).toContain("bess_module_01");
    expect(q).toContain("last week");
  });
});

describe("useAskAnalyst", () => {
  it("sends the device-scoped question with focusedDeviceId, then navigates", async () => {
    // Arrange
    let captured: AnalystChatRequest | null = null;
    const fakeStream: AnalystStreamFn = async (_url, req, handlers) => {
      captured = req;
      handlers.onEvent({
        kind: "result",
        message: { role: "assistant", content: [{ type: "text", text: "ok" }] },
      });
      handlers.onEvent({ kind: "done" });
    };
    const { getByText } = render(
      <DeploymentIdentityProvider base={BASE}>
        <AnalystConversationProvider stream={fakeStream}>
          <Trigger deviceId="bess_module_01" />
        </AnalystConversationProvider>
      </DeploymentIdentityProvider>,
    );

    // Act
    await act(async () => {
      getByText("go").click();
    });

    // Assert
    await waitFor(() => expect(captured).not.toBeNull());
    expect(captured!.message).toBe(arbitrageQuestion("bess_module_01"));
    expect(captured!.context?.focusedDeviceId).toBe("bess_module_01");
    expect(captured!.context?.siteId).toBe("demo-site");
    expect(navigate).toHaveBeenCalledWith("Analyst");
  });
});
