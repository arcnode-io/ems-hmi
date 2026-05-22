/**
 * useAnalystConversation — read the analyst conversation + send/dismiss.
 * Must be used within AnalystConversationProvider.
 */

import { useContext } from "react";
import {
  AnalystConversationContext,
  type AnalystConversation,
} from "./AnalystConversationContext";

/**
 * @returns Conversation stream + send/dismiss controls
 * @throws Error if used outside AnalystConversationProvider
 */
export function useAnalystConversation(): AnalystConversation {
  const ctx = useContext(AnalystConversationContext);
  if (ctx === null) {
    throw new Error(
      "useAnalystConversation must be used within AnalystConversationProvider",
    );
  }
  return ctx;
}
