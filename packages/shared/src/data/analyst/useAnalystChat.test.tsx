/**
 * Tests for useAnalystChat — focused on the SiteIdChangedError recovery
 * path. Happy-path send behavior is exercised via integration through the
 * AnalystScreen + fixture backend elsewhere.
 */

import React from "react";
import { render, act, waitFor } from "@testing-library/react";
import { useAnalystChat } from "./useAnalystChat";
import { SiteIdChangedError } from "./AnalystClient";
import type { AnalystChatRequest, AnalystMessage } from "./types";

interface ProbeState {
  conversationId: string;
  messages: AnalystMessage[];
  send: (text: string) => Promise<void>;
}

function Probe({
  backend,
  onMount,
}: {
  backend: (req: AnalystChatRequest) => Promise<AnalystMessage>;
  onMount: (s: ProbeState) => void;
}): null {
  const { conversationId, messages, send } = useAnalystChat({ backend });
  React.useEffect(() => {
    onMount({ conversationId, messages, send });
  }, [conversationId, messages, send, onMount]);
  return null;
}

describe("useAnalystChat — site_id_changed recovery", () => {
  it("pushes a synthetic error message + mints a fresh conversationId on next send", async () => {
    // Arrange — first call throws SiteIdChangedError; second returns a normal reply.
    const states: ProbeState[] = [];
    const backend = jest
      .fn<Promise<AnalystMessage>, [AnalystChatRequest]>()
      .mockRejectedValueOnce(new SiteIdChangedError("site mismatch"))
      .mockResolvedValueOnce({
        role: "assistant",
        timestamp: "2026-05-17T12:00:00Z",
        content: [{ type: "text", text: "ok" }],
      });

    render(<Probe backend={backend} onMount={(s) => states.push(s)} />);
    await waitFor(() => expect(states.length).toBeGreaterThan(0));
    const initial = states[states.length - 1];
    const initialId = initial.conversationId;

    // Act — first send → 409 error path
    await act(async () => {
      await initial.send("hello");
    });

    const afterError = states[states.length - 1];
    const errMsg = afterError.messages[afterError.messages.length - 1];
    expect(errMsg.role).toBe("assistant");
    const artifact = errMsg.content[0];
    expect(artifact.type).toBe("artifact");
    if (artifact.type !== "artifact") throw new Error("expected artifact");
    expect(artifact.artifact.kind).toBe("error");
    if (artifact.artifact.kind !== "error") throw new Error("expected error");
    expect(artifact.artifact.spec.code).toBe("site_id_changed");

    // Act — second send should use a fresh conversationId.
    await act(async () => {
      await afterError.send("retry");
    });

    // Assert — backend's second call received a different conversationId.
    const secondCallReq = backend.mock.calls[1][0];
    expect(secondCallReq.conversationId).not.toBe(initialId);
  });
});
