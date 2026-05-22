/**
 * Minimal `text/event-stream` frame parser. Feed it response chunks; it
 * yields complete SSE frames as they terminate (blank-line delimited).
 *
 * Covers what the analyst stream uses — `event:` + `data:` fields, multi-line
 * `data`, comments, `\r\n` or `\n` line endings. `id:`/`retry:` are ignored.
 */

export interface SseFrame {
  /** The `event:` field, if present. */
  event?: string;
  /** Joined `data:` lines. */
  data: string;
}

/** Parse one frame's raw text (no trailing blank line) into an SseFrame. */
function parseFrame(raw: string): SseFrame | null {
  let event: string | undefined;
  const dataLines: string[] = [];
  for (const line of raw.split("\n")) {
    if (line === "" || line.startsWith(":")) continue; // blank / comment
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    // SSE strips a single leading space after the colon.
    let value = colon === -1 ? "" : line.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    if (field === "event") event = value;
    else if (field === "data") dataLines.push(value);
  }
  if (dataLines.length === 0) return null;
  return { event, data: dataLines.join("\n") };
}

/** Stateful chunk accumulator — emits frames as `\n\n` boundaries arrive. */
export class SseParser {
  private buffer = "";

  /** Feed a chunk of stream text; returns any frames it completed. */
  push(chunk: string): SseFrame[] {
    this.buffer += chunk.replace(/\r\n/g, "\n");
    const frames: SseFrame[] = [];
    let idx = this.buffer.indexOf("\n\n");
    while (idx !== -1) {
      const raw = this.buffer.slice(0, idx);
      this.buffer = this.buffer.slice(idx + 2);
      const frame = parseFrame(raw);
      if (frame) frames.push(frame);
      idx = this.buffer.indexOf("\n\n");
    }
    return frames;
  }
}
