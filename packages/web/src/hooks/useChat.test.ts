import { renderHook, act } from "@testing-library/react";
import { useChat } from "./useChat";

const API_URL = "http://localhost:3000";

const MOCK_RESPONSE = {
  id: "chatcmpl-test123",
  object: "chat.completion" as const,
  created: 1700000000,
  model: "gpt-4o",
  choices: [
    {
      index: 0,
      message: {
        role: "assistant" as const,
        content: "The load forecast is 450MW.",
      },
      finish_reason: "stop",
    },
  ],
  usage: { prompt_tokens: 10, completion_tokens: 8, total_tokens: 18 },
};

describe("useChat", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("sends message and appends assistant response", async () => {
    // Arrange
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(MOCK_RESPONSE),
    });

    const { result } = renderHook(() => useChat(API_URL));

    // Act
    await act(async () => {
      await result.current.sendMessage("What is the current load forecast?");
    });

    // Assert
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0]).toEqual({
      role: "user",
      content: "What is the current load forecast?",
    });
    expect(result.current.messages[1]).toEqual({
      role: "assistant",
      content: "The load forecast is 450MW.",
    });
    expect(global.fetch).toHaveBeenCalledWith(
      `${API_URL}/chat`,
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("sets error on API failure", async () => {
    // Arrange
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    const { result } = renderHook(() => useChat(API_URL));

    // Act
    await act(async () => {
      await result.current.sendMessage("test");
    });

    // Assert
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(result.current.error).toContain("500");
  });
});
