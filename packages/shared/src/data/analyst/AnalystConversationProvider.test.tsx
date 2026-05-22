/**
 * Tests for AnalystConversationProvider — drives a streamed turn through an
 * injected fake stream and asserts the conversation settles.
 */

import React from "react";
import { render, act, waitFor } from "@testing-library/react";
import { AnalystConversationProvider } from "./AnalystConversationProvider";
import { useAnalystConversation } from "./useAnalystConversation";
import { DeploymentIdentityProvider } from "../deployment/DeploymentIdentityProvider";
import type { AnalystStreamFn } from "./sse/analystStream";
import type { AnalystConversation } from "./AnalystConversationContext";

/** Fake stream — emits a tool step, a text+nothing result, then done. */
const fakeStream: AnalystStreamFn = async (_baseUrl, _req, handlers) => {
  handlers.onEvent({ kind: "tool_start", seq: 1, tool: "describe_site", label: "Inventory" });
  handlers.onEvent({ kind: "tool_end", seq: 1, tool: "describe_site", outcome: "ok", ms: 12 });
  handlers.onEvent({
    kind: "result",
    message: { role: "assistant", content: [{ type: "text", text: "Here you go." }] },
  });
  handlers.onEvent({ kind: "done" });
};

const BASE = {
  name: "Test Site",
  host: "localhost",
  siteId: "demo-site",
  mode: "local" as const,
  chatApiUri: "http://localhost:8000",
  deviceApiUri: "/api",
};

function Probe({ onState }: { onState: (s: AnalystConversation) => void }): null {
  const conv = useAnalystConversation();
  React.useEffect(() => {
    onState(conv);
  }, [conv, onState]);
  return null;
}

describe("AnalystConversationProvider", () => {
  it("settles a streamed turn into user + assistant messages", async () => {
    // Arrange
    const states: AnalystConversation[] = [];
    render(
      <DeploymentIdentityProvider base={BASE}>
        <AnalystConversationProvider stream={fakeStream}>
          <Probe onState={(s) => states.push(s)} />
        </AnalystConversationProvider>
      </DeploymentIdentityProvider>,
    );
    await waitFor(() => expect(states.length).toBeGreaterThan(0));

    // Act
    await act(async () => {
      states[states.length - 1].send("show me prices");
    });

    // Assert
    await waitFor(() => {
      expect(states[states.length - 1].status).toBe("idle");
    });
    const final = states[states.length - 1];
    const messages = final.items.filter((it) => it.kind === "message");
    expect(messages).toHaveLength(2);
    expect(final.pending).toBeNull();
  });
});
