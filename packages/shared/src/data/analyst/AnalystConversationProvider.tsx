/**
 * AnalystConversationProvider — owns the analyst conversation. Dispatches
 * user sends, drives the SSE stream, settles streamed events into the inline
 * stream. Mounted above the navigator so it survives screen navigation.
 *
 * `stream` is injectable — tests + the dev mock pass a canned stream.
 */

import React, { useCallback, useMemo, useReducer } from "react";
import {
  conversationReducer,
  initialConversation,
} from "./AnalystConversation.reducer";
import {
  AnalystConversationContext,
  type AnalystConversation,
} from "./AnalystConversationContext";
import { analystStream, type AnalystStreamFn } from "./sse/analystStream";
import { StreamHttpError } from "./sse/streamPost.types";
import { useDeploymentIdentity } from "../deployment/useDeploymentIdentity";

/** Mint a conversation id — UUID where available, else a local fallback. */
function freshConversationId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

interface AnalystConversationProviderProps {
  /** Streaming impl — defaults to the real SSE stream. */
  stream?: AnalystStreamFn;
  children: React.ReactNode;
}

export function AnalystConversationProvider({
  stream = analystStream,
  children,
}: AnalystConversationProviderProps): React.ReactElement {
  const identity = useDeploymentIdentity();
  const [state, dispatch] = useReducer(conversationReducer, "", () =>
    initialConversation(freshConversationId()),
  );

  const send = useCallback(
    async (text: string): Promise<void> => {
      const trimmed = text.trim();
      if (trimmed === "" || state.status === "streaming") return;
      dispatch({
        type: "user_sent",
        text: trimmed,
        timestamp: new Date().toISOString(),
        startedAt: performance.now(),
      });
      try {
        await stream(
          identity.chatApiUri,
          {
            conversationId: state.conversationId,
            message: trimmed,
            context: { siteId: identity.siteId },
          },
          {
            onEvent: (event) =>
              dispatch({
                type: "stream_event",
                event,
                timestamp: new Date().toISOString(),
              }),
          },
        );
      } catch (e) {
        // 409 → the site id changed under us; mint a fresh conversation.
        if (e instanceof StreamHttpError && e.status === 409) {
          dispatch({ type: "reset", conversationId: freshConversationId() });
          return;
        }
        dispatch({
          type: "stream_error",
          message: e instanceof Error ? e.message : "stream failed",
        });
      }
    },
    [stream, identity.chatApiUri, identity.siteId, state.conversationId, state.status],
  );

  const dismiss = useCallback(
    (id: string): void => dispatch({ type: "dismiss", id }),
    [],
  );

  const value = useMemo<AnalystConversation>(
    () => ({
      conversationId: state.conversationId,
      items: state.items,
      pending: state.pending,
      status: state.status,
      error: state.error,
      send,
      dismiss,
    }),
    [state, send, dismiss],
  );

  return (
    <AnalystConversationContext.Provider value={value}>
      {children}
    </AnalystConversationContext.Provider>
  );
}
