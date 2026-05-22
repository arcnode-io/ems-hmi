/** Shared shape for the platform-split streaming-POST transport. */

/** Thrown by a transport on a non-2xx response — carries the status code. */
export class StreamHttpError extends Error {
  constructor(public readonly status: number) {
    super(`analyst stream — HTTP ${status}`);
    this.name = "StreamHttpError";
  }
}

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
