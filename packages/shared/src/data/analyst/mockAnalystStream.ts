/**
 * mockAnalystStream — a canned SSE stream for dev + tests before the backend
 * ships real streaming. Emits a short tool trace, then a `result` built from
 * the existing fixture backend, then `done`.
 *
 * Wire the real `analystStream` into AnalystConversationProvider once the
 * server's `text/event-stream` endpoint lands.
 */

import type { AnalystStreamFn } from "./sse/analystStream";
import { fixtureChat } from "./fixtureBackend";

const STEP_DELAY_MS = 600;

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const mockAnalystStream: AnalystStreamFn = async (
  _baseUrl,
  req,
  handlers,
) => {
  handlers.onEvent({
    kind: "tool_start",
    seq: 1,
    tool: "describe_site",
    label: "Inventorying site series",
  });
  await delay(STEP_DELAY_MS);
  handlers.onEvent({
    kind: "tool_end",
    seq: 1,
    tool: "describe_site",
    outcome: "ok",
    ms: 480,
  });

  handlers.onEvent({
    kind: "tool_start",
    seq: 2,
    tool: "query_timeseries",
    label: "Querying site historian",
  });
  await delay(STEP_DELAY_MS);
  handlers.onEvent({
    kind: "tool_end",
    seq: 2,
    tool: "query_timeseries",
    outcome: "ok",
    ms: 1200,
  });

  await delay(STEP_DELAY_MS);
  const message = await fixtureChat(req);
  handlers.onEvent({ kind: "result", message });
  handlers.onEvent({ kind: "done" });
};
