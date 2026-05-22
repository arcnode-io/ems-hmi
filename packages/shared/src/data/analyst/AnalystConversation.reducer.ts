/**
 * Pure reducer for the analyst conversation. The provider dispatches user
 * sends + streamed events; the reducer settles them into the inline stream.
 *
 * Item ids are minted from a monotonic `seq` counter so the reducer stays
 * pure — no id generator threaded through actions.
 */

import { match } from "ts-pattern";
import type { AnalystStreamEvent } from "./types";
import type {
  ArtifactItem,
  ConversationItem,
  MessageItem,
  TraceStep,
} from "./conversation.types";

export interface ConversationState {
  conversationId: string;
  items: ConversationItem[];
  /** The in-flight turn, or null when idle. */
  pending: { startedAt: number; trace: TraceStep[] } | null;
  status: "idle" | "streaming" | "error";
  error: string | null;
  /** Monotonic id source for stream items. */
  seq: number;
}

export type ConversationAction =
  | { type: "user_sent"; text: string; timestamp: string; startedAt: number }
  | { type: "stream_event"; event: AnalystStreamEvent; timestamp: string }
  | { type: "stream_error"; message: string }
  | { type: "dismiss"; id: string }
  | { type: "reset"; conversationId: string };

export function initialConversation(conversationId: string): ConversationState {
  return {
    conversationId,
    items: [],
    pending: null,
    status: "idle",
    error: null,
    seq: 0,
  };
}

/** Settle a completed turn's AnalystMessage into a message + artifact items. */
function settleResult(
  state: ConversationState,
  event: Extract<AnalystStreamEvent, { kind: "result" }>,
  timestamp: string,
): ConversationState {
  const msg = event.message;
  const prose = msg.content
    .filter((c): c is { type: "text"; text: string } => c.type === "text")
    .map((c) => c.text)
    .join("\n");
  const artifacts = msg.content.filter(
    (c): c is { type: "artifact"; artifact: ArtifactItem["artifact"] } =>
      c.type === "artifact",
  );

  let seq = state.seq;
  const messageId = `item-${seq++}`;
  const messageItem: MessageItem = {
    kind: "message",
    id: messageId,
    role: "assistant",
    text: prose,
    timestamp,
    trace: msg.toolTrace ?? undefined,
  };
  const artifactItems: ArtifactItem[] = artifacts.map((a) => ({
    kind: "artifact",
    id: `item-${seq++}`,
    artifact: a.artifact,
    timestamp,
    sourceMessageId: messageId,
  }));

  return {
    ...state,
    items: [...state.items, messageItem, ...artifactItems],
    pending: null,
    seq,
  };
}

/** Apply one streamed event to the in-flight turn. */
function applyStreamEvent(
  state: ConversationState,
  event: AnalystStreamEvent,
  timestamp: string,
): ConversationState {
  const pending = state.pending;
  return match(event)
    .with({ kind: "tool_start" }, (e) =>
      pending
        ? {
            ...state,
            pending: {
              ...pending,
              trace: [
                ...pending.trace,
                { seq: e.seq, tool: e.tool, label: e.label, status: "running" as const },
              ],
            },
          }
        : state,
    )
    .with({ kind: "tool_end" }, (e) =>
      pending
        ? {
            ...state,
            pending: {
              ...pending,
              trace: pending.trace.map((s) =>
                s.seq === e.seq
                  ? {
                      ...s,
                      status: e.outcome === "error" ? ("error" as const) : ("done" as const),
                      ms: e.ms,
                      summary: e.summary ?? null,
                    }
                  : s,
              ),
            },
          }
        : state,
    )
    .with({ kind: "result" }, (e) => settleResult(state, e, timestamp))
    .with({ kind: "done" }, () => ({
      ...state,
      pending: null,
      status: "idle" as const,
    }))
    .exhaustive();
}

export function conversationReducer(
  state: ConversationState,
  action: ConversationAction,
): ConversationState {
  return match(action)
    .with({ type: "user_sent" }, (a) => ({
      ...state,
      items: [
        ...state.items,
        {
          kind: "message" as const,
          id: `item-${state.seq}`,
          role: "user" as const,
          text: a.text,
          timestamp: a.timestamp,
        },
      ],
      seq: state.seq + 1,
      pending: { startedAt: a.startedAt, trace: [] },
      status: "streaming" as const,
      error: null,
    }))
    .with({ type: "stream_event" }, (a) =>
      applyStreamEvent(state, a.event, a.timestamp),
    )
    .with({ type: "stream_error" }, (a) => ({
      ...state,
      pending: null,
      status: "error" as const,
      error: a.message,
    }))
    .with({ type: "dismiss" }, (a) => ({
      ...state,
      items: state.items.filter((it) => it.id !== a.id),
    }))
    .with({ type: "reset" }, (a) => initialConversation(a.conversationId))
    .exhaustive();
}
