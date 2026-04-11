import type { ReactElement } from "react";
import { loadConfig } from "../../../config";
import { useChat } from "../../../hooks/useChat";
import { Chat } from "./Chat";

const { chatApiUri } = loadConfig();

/**
 * Container that wires useChat hook to Chat presenter.
 * Filters system messages before passing to UI.
 * @returns Chat component connected to the analyst_api /chat endpoint
 */
export function ChatContainer(): ReactElement {
  const { messages, sendMessage, loading, error } = useChat(chatApiUri);

  // Reason: system messages are internal to the API conversation, not shown in UI
  const visibleMessages = messages.filter((msg) => msg.role !== "system");

  const handleSendMessage = (content: string): void => {
    void sendMessage(content);
  };

  return (
    <Chat
      messages={visibleMessages}
      onSendMessage={handleSendMessage}
      loading={loading}
      error={error}
    />
  );
}
