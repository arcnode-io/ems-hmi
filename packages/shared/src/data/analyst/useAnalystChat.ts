/**
 * useAnalystChat — minimal chat hook. Maintains an in-memory scrollback
 * of messages + a `send(message)` callback that POSTs to the analyst
 * backend and appends the reply.
 *
 * v1: JSON-only request/reply (no SSE — backend deferred per
 * [[project-analyst-architecture]]). Swap the `backend` function for
 * `fetch("/analyst/chat", ...)` when the agent is live; the shape is
 * identical.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import type { AnalystChatRequest, AnalystMessage } from "./types";
import { fixtureChat } from "./fixtureBackend";

export type AnalystSendStatus = "idle" | "sending" | "error";

export interface AnalystChatState {
  conversationId: string;
  messages: AnalystMessage[];
  status: AnalystSendStatus;
  error: string | null;
  send: (text: string) => Promise<void>;
  reset: () => void;
}

type ChatBackend = (req: AnalystChatRequest) => Promise<AnalystMessage>;

interface UseAnalystChatOptions {
  /** Backend dispatcher. Default = local fixture. */
  backend?: ChatBackend;
  /** Optional context attached to every request. */
  context?: AnalystChatRequest["context"];
}

/**
 * Generate a fresh UUID for a chat session. Per the contract: opaque to
 * backend; new ChatPanel mount = new conversation.
 */
function freshConversationId(): string {
  // Reason: prefer the platform crypto API; fall back to a coarse
  // timestamp-random for environments lacking it (jsdom may).
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Chat hook. One instance = one conversation; remount = new conversation.
 * @param options optional backend override + context
 * @returns chat state + send/reset actions
 */
export function useAnalystChat(
  options: UseAnalystChatOptions = {},
): AnalystChatState {
  const backend = options.backend ?? fixtureChat;
  const context = options.context;
  const conversationIdRef = useRef<string>(freshConversationId());
  const [messages, setMessages] = useState<AnalystMessage[]>([]);
  const [status, setStatus] = useState<AnalystSendStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (text: string): Promise<void> => {
      const trimmed = text.trim();
      if (trimmed === "") return;
      const userMsg: AnalystMessage = {
        role: "user",
        timestamp: new Date().toISOString(),
        content: [{ type: "text", text: trimmed }],
      };
      setMessages((prev) => [...prev, userMsg]);
      setStatus("sending");
      setError(null);
      try {
        const reply = await backend({
          conversationId: conversationIdRef.current,
          message: trimmed,
          context,
        });
        setMessages((prev) => [...prev, reply]);
        setStatus("idle");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "unknown error");
        setStatus("error");
      }
    },
    [backend, context],
  );

  const reset = useCallback((): void => {
    conversationIdRef.current = freshConversationId();
    setMessages([]);
    setStatus("idle");
    setError(null);
  }, []);

  return useMemo(
    () => ({
      conversationId: conversationIdRef.current,
      messages,
      status,
      error,
      send,
      reset,
    }),
    [messages, status, error, send, reset],
  );
}
