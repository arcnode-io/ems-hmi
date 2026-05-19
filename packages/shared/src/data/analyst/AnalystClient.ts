/**
 * HTTP client for the analyst-server. Throws `SiteIdChangedError` on
 * 409 `site_id_changed` so the UI can mint a fresh conversation.
 */

import type { AnalystChatRequest, AnalystMessage } from "./types";

const ENDPOINT = "/analyst/chat";

export class SiteIdChangedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SiteIdChangedError";
  }
}

interface ConflictBody {
  code?: string;
  message?: string;
}

/**
 * POST a chat turn and return the assistant reply.
 * @throws SiteIdChangedError on 409 site_id_changed; Error on other non-2xx.
 */
export async function analystChat(
  baseUrl: string,
  req: AnalystChatRequest,
): Promise<AnalystMessage> {
  const res = await fetch(`${baseUrl}${ENDPOINT}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (res.status === 409) {
    const body = (await res.json().catch(() => ({}))) as ConflictBody;
    if (body.code === "site_id_changed") {
      throw new SiteIdChangedError(body.message ?? "site identifier changed");
    }
    throw new Error(`HTTP 409 — ${body.message ?? "conflict"}`);
  }
  if (!res.ok) {
    throw new Error(`analyst-server responded HTTP ${res.status}`);
  }
  return (await res.json()) as AnalystMessage;
}
