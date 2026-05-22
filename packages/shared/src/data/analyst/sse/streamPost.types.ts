/** Shared shape for the platform-split streaming-POST transport. */

export interface StreamPostInit {
  headers: Record<string, string>;
  /** JSON request body. */
  body: string;
}

/**
 * A streaming POST: sends `init`, invokes `onChunk` with each decoded text
 * chunk as it arrives, resolves when the response completes.
 */
export type StreamTransport = (
  url: string,
  init: StreamPostInit,
  onChunk: (text: string) => void,
) => Promise<void>;
