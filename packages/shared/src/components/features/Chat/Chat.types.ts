/** OpenAI-compatible message role. */
export type ChatRole = "system" | "user" | "assistant";

/** Single message in the chat conversation. */
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/** Props for the Chat presenter component. */
export interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  loading: boolean;
  error?: string;
}
