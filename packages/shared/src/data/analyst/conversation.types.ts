/**
 * Conversation model for the redesigned Analyst — the inline-stream the
 * AnalystConversationProvider holds: settled items (messages + artifacts)
 * plus the transient pending turn that carries the live tool trace.
 *
 * Artifacts are hoisted to top-level stream items (each with its own id) so
 * they can be dismissed individually and, on desktop, pinned to the canvas
 * independently of the chat.
 */

import type { AnalystArtifact, AnalystToolCall } from "./types";

/** One tool-call step in the live trace while a turn streams. */
export interface TraceStep {
  seq: number;
  tool: string;
  label: string;
  status: "running" | "done" | "error";
  /** Wall-clock duration, set once the step ends. */
  ms?: number;
  /** Result headline for external tools (news / market / weather). */
  summary?: string | null;
}

/** A settled chat message in the stream. */
export interface MessageItem {
  kind: "message";
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  /** Completed tool trace, collapsed under the assistant message. */
  trace?: AnalystToolCall[];
}

/** A settled artifact, hoisted to a top-level stream item. */
export interface ArtifactItem {
  kind: "artifact";
  id: string;
  artifact: AnalystArtifact;
  timestamp: string;
  /** The assistant MessageItem this artifact was produced by. */
  sourceMessageId: string;
}

export type ConversationItem = MessageItem | ArtifactItem;

/** The in-flight turn — live trace, not yet settled into items. */
export interface PendingTurn {
  /** Wall-clock ms (performance.now basis) the turn started. */
  startedAt: number;
  /** Live trace steps as they stream in. */
  trace: TraceStep[];
}
