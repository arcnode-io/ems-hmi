import { useCallback, useState } from "react";
import { z } from "zod";
import type { ChatMessage } from "../components/features/Chat/Chat.types";

/** Zod schema for an OpenAI-compatible chat message. */
export const ChatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

/** Zod schema for the OpenAI-compatible chat completion response. */
export const ChatResponseSchema = z.object({
  id: z.string(),
  object: z.literal("chat.completion"),
  created: z.number().int(),
  model: z.string(),
  choices: z
    .array(
      z.object({
        index: z.number().int(),
        message: z.object({
          role: z.literal("assistant"),
          content: z.string().nullable(),
        }),
        finish_reason: z.string(),
      }),
    )
    .min(1),
  usage: z.object({
    prompt_tokens: z.number().int(),
    completion_tokens: z.number().int(),
    total_tokens: z.number().int(),
  }),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;

const DEFAULT_MODEL = "gpt-4o";

interface UseChatResult {
  messages: ChatMessage[];
  sendMessage: (content: string) => Promise<void>;
  loading: boolean;
  error?: string;
}

/**
 * Chat hook that manages conversation state and communicates with an OpenAI-compatible /chat endpoint.
 * @param chatApiUri Base URL of the chat API server
 * @returns Messages array, sendMessage function, loading state, and error state
 * @example const { messages, sendMessage, loading, error } = useChat("http://localhost:3000");
 */
export function useChat(chatApiUri: string): UseChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const sendMessage = useCallback(
    async (content: string): Promise<void> => {
      const userMessage: ChatMessage = { role: "user", content };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setLoading(true);
      setError(undefined);

      try {
        const response = await fetch(`${chatApiUri}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: DEFAULT_MODEL,
            messages: updatedMessages,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const rawData: unknown = await response.json();
        const parsed = ChatResponseSchema.parse(rawData);
        const assistantContent = parsed.choices[0]?.message.content ?? "";
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: assistantContent,
        };

        setMessages([...updatedMessages, assistantMessage]);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [chatApiUri, messages],
  );

  return { messages, sendMessage, loading, error };
}
