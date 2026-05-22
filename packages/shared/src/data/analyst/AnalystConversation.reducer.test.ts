/** Tests for the analyst conversation reducer. AAA pattern. */

import {
  conversationReducer,
  initialConversation,
} from "./AnalystConversation.reducer";
import type { ConversationState } from "./AnalystConversation.reducer";
import type { AnalystMessage } from "./types";

const TS = "2026-05-22T14:00:00Z";

const RESULT_MSG: AnalystMessage = {
  role: "assistant",
  content: [
    { type: "text", text: "Plotted day-ahead prices." },
    {
      type: "artifact",
      artifact: {
        kind: "line",
        spec: {
          title: "DAM price",
          xAxis: { label: "Time", kind: "time" },
          yAxis: { label: "price", unit: "usd" },
          series: [{ label: "market_01", points: [{ x: 0, y: 21 }] }],
          dataAsOf: TS,
        },
      },
    },
  ],
  toolTrace: [{ tool: "query_timeseries", args: {}, outcome: "ok", ms: 800 }],
};

/** Run user_sent → tool_start → tool_end → result → done. */
function runHappyTurn(): ConversationState {
  let s = initialConversation("c-1");
  s = conversationReducer(s, { type: "user_sent", text: "prices?", timestamp: TS, startedAt: 0 });
  s = conversationReducer(s, {
    type: "stream_event",
    event: { kind: "tool_start", seq: 1, tool: "query_timeseries", label: "Querying" },
    timestamp: TS,
  });
  s = conversationReducer(s, {
    type: "stream_event",
    event: { kind: "tool_end", seq: 1, tool: "query_timeseries", outcome: "ok", ms: 800 },
    timestamp: TS,
  });
  s = conversationReducer(s, {
    type: "stream_event",
    event: { kind: "result", message: RESULT_MSG },
    timestamp: TS,
  });
  return conversationReducer(s, {
    type: "stream_event",
    event: { kind: "done" },
    timestamp: TS,
  });
}

describe("conversationReducer — streamed turn", () => {
  it("opens a pending turn and a user item on user_sent", () => {
    const s = conversationReducer(initialConversation("c-1"), {
      type: "user_sent",
      text: "prices?",
      timestamp: TS,
      startedAt: 0,
    });
    expect(s.status).toBe("streaming");
    expect(s.items).toHaveLength(1);
    expect(s.pending).not.toBeNull();
  });

  it("tracks tool_start → tool_end on the pending trace", () => {
    let s = conversationReducer(initialConversation("c-1"), {
      type: "user_sent",
      text: "q",
      timestamp: TS,
      startedAt: 0,
    });
    s = conversationReducer(s, {
      type: "stream_event",
      event: { kind: "tool_start", seq: 1, tool: "x", label: "X" },
      timestamp: TS,
    });
    expect(s.pending?.trace[0].status).toBe("running");
    s = conversationReducer(s, {
      type: "stream_event",
      event: { kind: "tool_end", seq: 1, tool: "x", outcome: "ok", ms: 50 },
      timestamp: TS,
    });
    expect(s.pending?.trace[0].status).toBe("done");
    expect(s.pending?.trace[0].ms).toBe(50);
  });

  it("settles result into a message + artifact item, then idles on done", () => {
    const s = runHappyTurn();
    expect(s.status).toBe("idle");
    expect(s.pending).toBeNull();
    // user message + assistant message + one artifact
    expect(s.items).toHaveLength(3);
    const [, assistant, artifact] = s.items;
    expect(assistant.kind).toBe("message");
    expect(artifact.kind).toBe("artifact");
    if (artifact.kind === "artifact") {
      expect(artifact.sourceMessageId).toBe(assistant.id);
    }
  });

  it("dismiss removes an item by id", () => {
    const s = runHappyTurn();
    const artifactId = s.items[2].id;
    const after = conversationReducer(s, { type: "dismiss", id: artifactId });
    expect(after.items).toHaveLength(2);
    expect(after.items.some((it) => it.id === artifactId)).toBe(false);
  });

  it("stream_error sets error status and clears the pending turn", () => {
    let s = conversationReducer(initialConversation("c-1"), {
      type: "user_sent",
      text: "q",
      timestamp: TS,
      startedAt: 0,
    });
    s = conversationReducer(s, { type: "stream_error", message: "boom" });
    expect(s.status).toBe("error");
    expect(s.error).toBe("boom");
    expect(s.pending).toBeNull();
  });
});
