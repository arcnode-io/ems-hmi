/**
 * analystStream — opens a streaming `POST /analyst/chat` (Accept:
 * text/event-stream) and emits typed AnalystStreamEvents as the turn runs:
 * `tool_start` / `tool_end` while the agent works, then `result`, then `done`.
 *
 * The transport is platform-split (web fetch-reader / native XHR-progress)
 * and injectable so tests + the dev mock can drive canned streams.
 */

import { match } from "ts-pattern";
import type {
  AnalystChatRequest,
  AnalystMessage,
  AnalystStreamEvent,
} from "../types";
import { SseParser, type SseFrame } from "./parseSse";
import { streamPost } from "./streamPost";
import type { StreamTransport } from "./streamPost.types";

const ENDPOINT = "/analyst/chat";

/**
 * Map a server SSE frame to a typed event. The kind rides the `event:` line;
 * `data:` is the payload JSON. The server's `message` event carries the
 * AnalystMessage directly — re-tagged to the internal `result` kind.
 * The analyst JSON shape is trusted, matching analystChat().
 */
function frameToEvent(frame: SseFrame): AnalystStreamEvent | null {
  if (frame.event === undefined) return null;
  const data = JSON.parse(frame.data) as Record<string, unknown>;
  return match(frame.event)
    .with(
      "tool_start",
      "tool_end",
      "done",
      (kind) => ({ kind, ...data }) as AnalystStreamEvent,
    )
    .with(
      "message",
      () =>
        ({ kind: "result", message: data as unknown as AnalystMessage }) as
          AnalystStreamEvent,
    )
    .otherwise(() => null);
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
        const event = frameToEvent(frame);
        if (event) handlers.onEvent(event);
      }
    },
  );
}

/** The injectable signature the conversation provider depends on. */
export type AnalystStreamFn = typeof analystStream;
