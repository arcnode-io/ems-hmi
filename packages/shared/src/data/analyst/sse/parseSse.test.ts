/** Tests for the SSE frame parser. AAA pattern. */

import { SseParser } from "./parseSse";

describe("SseParser", () => {
  it("parses a single event+data frame", () => {
    // Arrange
    const p = new SseParser();

    // Act
    const frames = p.push('event: tool_start\ndata: {"seq":1}\n\n');

    // Assert
    expect(frames).toEqual([{ event: "tool_start", data: '{"seq":1}' }]);
  });

  it("buffers a frame split across two chunks", () => {
    // Arrange
    const p = new SseParser();

    // Act — first chunk has no frame boundary yet
    const first = p.push("data: hel");
    const second = p.push("lo\n\n");

    // Assert
    expect(first).toEqual([]);
    expect(second).toEqual([{ data: "hello" }]);
  });

  it("joins multi-line data and tolerates CRLF", () => {
    // Arrange
    const p = new SseParser();

    // Act
    const frames = p.push("data: line1\r\ndata: line2\r\n\r\n");

    // Assert
    expect(frames).toEqual([{ data: "line1\nline2" }]);
  });

  it("emits multiple frames from one chunk and ignores comments", () => {
    // Arrange
    const p = new SseParser();

    // Act
    const frames = p.push(": keep-alive\ndata: a\n\ndata: b\n\n");

    // Assert
    expect(frames).toEqual([{ data: "a" }, { data: "b" }]);
  });
});
