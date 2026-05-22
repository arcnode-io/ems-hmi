/**
 * Web streaming-POST transport — reads the response body via a fetch
 * `ReadableStream` reader. The browser's native `EventSource` is GET-only,
 * so the SSE turn rides a POST body and we read the stream ourselves.
 */

import { StreamHttpError, type StreamPostInit } from "./streamPost.types";

export async function streamPost(
  url: string,
  init: StreamPostInit,
  onChunk: (text: string) => void,
): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: init.headers,
    body: init.body,
  });
  if (!res.ok) throw new StreamHttpError(res.status);
  if (!res.body) throw new Error("analyst stream — no response body");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}
