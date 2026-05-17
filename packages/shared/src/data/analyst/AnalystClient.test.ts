/**
 * Tests for AnalystClient — HTTP transport to the analyst-server.
 */

import { analystChat, SiteIdChangedError } from "./AnalystClient";
import type { AnalystChatRequest, AnalystMessage } from "./types";

const BASE_URL = "https://analyst.example.com";

function mockFetchOnce(init: {
  status: number;
  json: unknown;
}): jest.Mock {
  const fn = jest.fn().mockResolvedValue({
    ok: init.status >= 200 && init.status < 300,
    status: init.status,
    json: async () => init.json,
  });
  (global as unknown as { fetch: jest.Mock }).fetch = fn;
  return fn;
}

describe("analystChat", () => {
  it("POSTs the request as JSON and returns the parsed AnalystMessage", async () => {
    // Arrange
    const reply: AnalystMessage = {
      role: "assistant",
      timestamp: "2026-05-17T12:00:00Z",
      content: [{ type: "text", text: "ok" }],
    };
    const fetchMock = mockFetchOnce({ status: 200, json: reply });
    const req: AnalystChatRequest = {
      conversationId: "abc-123",
      message: "hello",
      context: { siteId: "demo_site" },
    };

    // Act
    const actual = await analystChat(BASE_URL, req);

    // Assert
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/analyst/chat`);
    expect(opts.method).toBe("POST");
    expect(opts.headers).toMatchObject({ "Content-Type": "application/json" });
    expect(JSON.parse(opts.body as string)).toEqual(req);
    expect(actual).toEqual(reply);
  });

  it("throws SiteIdChangedError on HTTP 409 with code site_id_changed", async () => {
    // Arrange
    mockFetchOnce({
      status: 409,
      json: { code: "site_id_changed", message: "site id changed mid-conversation" },
    });
    const req: AnalystChatRequest = {
      conversationId: "abc-123",
      message: "hello",
      context: { siteId: "wrong_site" },
    };

    // Act / Assert
    await expect(analystChat(BASE_URL, req)).rejects.toBeInstanceOf(
      SiteIdChangedError,
    );
  });

  it("throws Error with status text on other non-2xx", async () => {
    // Arrange
    mockFetchOnce({ status: 500, json: { detail: "boom" } });
    const req: AnalystChatRequest = {
      conversationId: "abc-123",
      message: "hello",
    };

    // Act / Assert
    await expect(analystChat(BASE_URL, req)).rejects.toThrow(/500/);
  });
});
