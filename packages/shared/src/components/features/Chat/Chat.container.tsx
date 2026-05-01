import type { ReactElement } from "react";
import { useChat } from "../../../hooks/useChat";
import { Chat } from "./Chat";

interface ChatContainerProps {
  apiUrl: string;
}

/**
 * Container that wires useChat hook to Chat presenter.
 * Filters system messages before passing to UI.
 * @param props Component props
 * @param props.apiUrl Base URL for the chat API (platform-specific config supplies this)
 * @returns Chat component connected to the analyst_api /chat endpoint
 */
export function ChatContainer({ apiUrl }: ChatContainerProps): ReactElement {
  const { messages, sendMessage, loading, error } = useChat(apiUrl);

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
