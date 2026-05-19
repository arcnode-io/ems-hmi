/**
 * useAnalystChat — chat scrollback + `send(message)` against an injected
 * backend. On `SiteIdChangedError`, the next send mints a fresh
 * conversationId after surfacing an error artifact in the scrollback.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import type { AnalystChatRequest, AnalystMessage } from "./types";
import { fixtureChat } from "./fixtureBackend";
import { SiteIdChangedError } from "./AnalystClient";

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
  backend?: ChatBackend;
  context?: AnalystChatRequest["context"];
}

function freshConversationId(): string {
  // crypto.randomUUID is unavailable in some jsdom runs; fall back.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useAnalystChat(
  options: UseAnalystChatOptions = {},
): AnalystChatState {
  const backend = options.backend ?? fixtureChat;
  const context = options.context;
  const conversationIdRef = useRef<string>(freshConversationId());
  const needsFreshIdRef = useRef<boolean>(false);
  const [messages, setMessages] = useState<AnalystMessage[]>([]);
  const [status, setStatus] = useState<AnalystSendStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (text: string): Promise<void> => {
      const trimmed = text.trim();
      if (trimmed === "") return;
      if (needsFreshIdRef.current) {
        conversationIdRef.current = freshConversationId();
        needsFreshIdRef.current = false;
      }
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
        if (e instanceof SiteIdChangedError) {
          const nowIso = new Date().toISOString();
          const errMsg: AnalystMessage = {
            role: "assistant",
            timestamp: nowIso,
            content: [
              {
                type: "artifact",
                artifact: {
                  kind: "error",
                  code: "site_id_changed",
                  message:
                    "Conversation invalidated — site identifier changed. Starting a fresh conversation.",
                  dataAsOf: nowIso,
                },
              },
            ],
          };
          setMessages((prev) => [...prev, errMsg]);
          needsFreshIdRef.current = true;
          setStatus("idle");
          return;
        }
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
