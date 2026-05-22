/**
 * AnalystConversationContext — the analyst conversation, lifted above the
 * navigator so the stream + artifact canvas survive screen navigation.
 */

import { createContext } from "react";
import type { ConversationItem, PendingTurn } from "./conversation.types";

export interface AnalystConversation {
  conversationId: string;
  items: ConversationItem[];
  /** The in-flight turn, or null when idle. */
  pending: PendingTurn | null;
  status: "idle" | "streaming" | "error";
  error: string | null;
  /** Send a user message and stream the turn. No-op while already streaming. */
  send: (text: string) => void;
  /** Remove a stream item (message or artifact) by id. */
  dismiss: (id: string) => void;
}

export const AnalystConversationContext =
  createContext<AnalystConversation | null>(null);
