/**
 * AnalystClient — HTTP client for the ems-analyst-server `/analyst/chat`
 * endpoint. v1 contract: JSON request, JSON response (SSE deferred to v1.1).
 *
 * Throws SiteIdChangedError on HTTP 409 `code: "site_id_changed"` so the
 * caller can mint a fresh conversationId per the [[project-analyst-architecture]]
 * recovery rule. All other non-2xx → generic Error with the status code.
 */

import type { AnalystChatRequest, AnalystMessage } from "./types";

const ENDPOINT = "/analyst/chat";

/**
 * Distinct error type so the UI can branch into the hard-error recovery
 * path (fresh conversationId + dedicated card) without string-matching
 * a generic Error message.
 */
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
 * POST a chat turn to the analyst-server and return the assistant reply.
 * @param baseUrl Analyst-server base URL (no trailing slash; endpoint appended)
 * @param req Chat request — conversationId, message, optional context
 * @returns The assistant's AnalystMessage
 * @throws SiteIdChangedError on 409 site_id_changed
 * @throws Error on any other non-2xx
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
