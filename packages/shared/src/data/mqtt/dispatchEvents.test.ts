import { parseDispatchEvent, applyDispatchEvent } from "./dispatchEvents";

describe("parseDispatchEvent", () => {
  it("accepts a well-formed event", () => {
    const actual = parseDispatchEvent({
      ts: "2026-06-05T12:00:00Z",
      command_id: "abc",
      phase: "failed",
      reason: "SoC out of range",
    });
    expect(actual).toEqual({
      ts: "2026-06-05T12:00:00Z",
      command_id: "abc",
      phase: "failed",
      reason: "SoC out of range",
    });
  });

  it("rejects unknown phases and malformed bodies", () => {
    expect(parseDispatchEvent({ ts: "t", command_id: "a", phase: "executing" })).toBeNull();
    expect(parseDispatchEvent({ command_id: "a", phase: "done" })).toBeNull();
    expect(parseDispatchEvent(null)).toBeNull();
  });
});

describe("applyDispatchEvent", () => {
  const evt = (phase: "received" | "done" | "failed", reason?: string) => ({
    ts: "t",
    command_id: "cmd-1",
    phase,
    reason,
  });

  it("maps gateway phases to HMI lifecycle phases", () => {
    expect(applyDispatchEvent(evt("received"), "cmd-1")).toEqual({ phase: "pending", reason: null });
    expect(applyDispatchEvent(evt("done"), "cmd-1")).toEqual({ phase: "settled", reason: null });
    expect(applyDispatchEvent(evt("failed", "breaker open"), "cmd-1")).toEqual({
      phase: "failed",
      reason: "breaker open",
    });
  });

  it("ignores events for a different command_id", () => {
    expect(applyDispatchEvent(evt("done"), "cmd-2")).toBeNull();
  });

  it("accepts any command when none is active yet", () => {
    expect(applyDispatchEvent(evt("received"), null)).toEqual({ phase: "pending", reason: null });
  });
});
