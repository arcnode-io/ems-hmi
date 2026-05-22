/**
 * analystStream — opens a streaming `POST /analyst/chat` (Accept:
 * text/event-stream) and emits typed AnalystStreamEvents as the turn runs:
 * `tool_start` / `tool_end` while the agent works, then `result`, then `done`.
 *
 * The transport is platform-split (web fetch-reader / native XHR-progress)
 * and injectable so tests + the dev mock can drive canned streams.
 */

import type { AnalystChatRequest, AnalystStreamEvent } from "../types";
import { SseParser } from "./parseSse";
import { streamPost } from "./streamPost";
import type { StreamTransport } from "./streamPost.types";

const ENDPOINT = "/analyst/chat";

/** Decode one SSE frame's data payload into a typed event. */
function toEvent(data: string): AnalystStreamEvent | null {
  // The analyst server's JSON shape is trusted, matching analystChat().
  const parsed = JSON.parse(data) as { kind?: string };
  if (typeof parsed.kind !== "string") return null;
  return parsed as AnalystStreamEvent;
}

export interface StreamHandlers {
  onEvent: (event: AnalystStreamEvent) => void;
}

/**
 * @param baseUrl analyst-server origin
 * @param req chat request
 * @param handlers event sink
 * @param transport streaming-POST impl — defaults to the platform transport
 */
export async function analystStream(
  baseUrl: string,
  req: AnalystChatRequest,
  handlers: StreamHandlers,
  transport: StreamTransport = streamPost,
): Promise<void> {
  const parser = new SseParser();
  await transport(
    `${baseUrl}${ENDPOINT}`,
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(req),
    },
    (chunk) => {
      for (const frame of parser.push(chunk)) {
        const event = toEvent(frame.data);
        if (event) handlers.onEvent(event);
      }
    },
  );
}

/** The injectable signature the conversation provider depends on. */
export type AnalystStreamFn = typeof analystStream;
