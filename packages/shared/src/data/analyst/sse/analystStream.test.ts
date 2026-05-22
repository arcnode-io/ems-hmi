/** Tests for analystStream — drives canned SSE through an injected transport. */

import { analystStream } from "./analystStream";
import type { StreamTransport } from "./streamPost.types";
import type { AnalystStreamEvent } from "../types";

const REQ = { conversationId: "c-1", message: "show me prices" };

describe("analystStream", () => {
  it("emits typed events from a streamed SSE response", async () => {
    // Arrange
    const events: AnalystStreamEvent[] = [];
    const transport: StreamTransport = async (_url, _init, onChunk) => {
      onChunk(
        'data: {"kind":"tool_start","seq":1,"tool":"query_timeseries","label":"Querying historian"}\n\n',
      );
      onChunk(
        'data: {"kind":"tool_end","seq":1,"tool":"query_timeseries","outcome":"ok","ms":820}\n\n',
      );
      onChunk('data: {"kind":"done"}\n\n');
    };

    // Act
    await analystStream("http://x", REQ, { onEvent: (e) => events.push(e) }, transport);

    // Assert
    expect(events.map((e) => e.kind)).toEqual(["tool_start", "tool_end", "done"]);
  });

  it("reassembles an event split across chunk boundaries", async () => {
    // Arrange
    const events: AnalystStreamEvent[] = [];
    const transport: StreamTransport = async (_url, _init, onChunk) => {
      onChunk('data: {"kind":"too');
      onChunk('l_end","seq":2,"tool":"x","outcome":"ok","ms":5}\n\n');
    };

    // Act
    await analystStream("http://x", REQ, { onEvent: (e) => events.push(e) }, transport);

    // Assert
    expect(events).toEqual([
      { kind: "tool_end", seq: 2, tool: "x", outcome: "ok", ms: 5 },
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
