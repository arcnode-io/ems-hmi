import { test, expect } from "@playwright/test";

test("chat round-trip: sends message and receives assistant response", async ({
  page,
}) => {
  // Arrange: mock the /chat endpoint with an OpenAI-compatible response
  // Reason: match only the API endpoint, not the /chat page navigation
  await page.route("**/localhost:3000/chat", async (route) => {
    const mockResponse = {
      id: "chatcmpl-test123",
      object: "chat.completion",
      created: 1700000000,
      model: "gpt-4o",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "The current load forecast is 450MW.",
          },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 10, completion_tokens: 8, total_tokens: 18 },
    };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockResponse),
    });
  });

  // Act: navigate to chat, type message, send
  await page.goto("/chat");
  await page.getByTestId("chat-input").fill("What is the current load?");
  await page.getByTestId("chat-send-button").click();

  // Assert: both user message and assistant response are visible
  await expect(
    page.getByText("What is the current load?"),
  ).toBeVisible();
  await expect(
    page.getByText("The current load forecast is 450MW."),
  ).toBeVisible();
});
