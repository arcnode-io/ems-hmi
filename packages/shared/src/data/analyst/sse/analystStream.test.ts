/**
 * Tests for analystStream — drives canned SSE through an injected transport,
 * using the real server wire format (kind on the `event:` line).
 */

import { analystStream } from "./analystStream";
import type { StreamTransport } from "./streamPost.types";
import type { AnalystStreamEvent } from "../types";

const REQ = { conversationId: "c-1", message: "show me prices" };

describe("analystStream", () => {
  it("maps server SSE frames to typed events (message → result)", async () => {
    // Arrange
    const events: AnalystStreamEvent[] = [];
    const transport: StreamTransport = async (_url, _init, onChunk) => {
      onChunk(
        'event: tool_start\ndata: {"seq":1,"tool":"get_topology","label":"Reading topology"}\n\n',
      );
      onChunk(
        'event: tool_end\ndata: {"seq":1,"tool":"get_topology","label":"x","outcome":"ok","ms":1,"summary":null}\n\n',
      );
      onChunk(
        'event: message\ndata: {"role":"assistant","content":[{"type":"text","text":"hi"}]}\n\n',
      );
      onChunk('event: done\ndata: {"status":"ok"}\n\n');
    };

    // Act
    await analystStream("http://x", REQ, { onEvent: (e) => events.push(e) }, transport);

    // Assert — `message` is re-tagged to the internal `result` kind.
    expect(events.map((e) => e.kind)).toEqual([
      "tool_start",
      "tool_end",
      "result",
      "done",
    ]);
    const result = events[2];
    if (result.kind !== "result") throw new Error("expected result event");
    expect(result.message.content[0]).toEqual({ type: "text", text: "hi" });
  });

  it("reassembles a frame split across chunk boundaries", async () => {
    // Arrange
    const events: AnalystStreamEvent[] = [];
    const transport: StreamTransport = async (_url, _init, onChunk) => {
      onChunk('event: tool_start\ndata: {"seq":2,"tool":"q"');
      onChunk(',"label":"Q"}\n\n');
    };

    // Act
    await analystStream("http://x", REQ, { onEvent: (e) => events.push(e) }, transport);

    // Assert
    expect(events).toEqual([
      { kind: "tool_start", seq: 2, tool: "q", label: "Q" },
    ]);
  });

  it("posts the request as JSON with an SSE Accept header", async () => {
    // Arrange
    let seenInit: { headers: Record<string, string>; body: string } | null = null;
    const transport: StreamTransport = async (_url, init) => {
      seenInit = init;
    };

    // Act
    await analystStream("http://x", REQ, { onEvent: () => undefined }, transport);

    // Assert
    expect(seenInit!.headers.Accept).toBe("text/event-stream");
    expect(JSON.parse(seenInit!.body)).toEqual(REQ);
  });
});
