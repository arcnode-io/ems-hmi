import React from "react";
import { render } from "@testing-library/react";
import { ThemeProvider } from "../../../../theme/ThemeProvider";
import type { EventRow } from "../../../../data/events/eventsApi";
import type { EventHistory } from "../../../../data/events/useEventHistory";
import { EventHistoryPanel } from "./EventHistoryPanel";

const row = (patch: Partial<EventRow>): EventRow => ({
  id: 1, occurredAt: new Date().toISOString(), type: "DER_EVENT_STATE", subject: null, actor: null,
  program: "DLR_LINE_CONSTRAINT", status: null, state: "ACTIVE", value: null, detail: null, ...patch,
});

const textOf = (history: EventHistory): string =>
  render(
    <ThemeProvider>
      <EventHistoryPanel history={history} floorMwh={2.36} />
    </ThemeProvider>,
  ).container.textContent ?? "";

describe("EventHistoryPanel", () => {
  it("lists events newest first, read-only — events are never acknowledged", () => {
    // Arrange
    const history: EventHistory = {
      status: "ready",
      rows: [
        row({ id: 3, state: "IDLE" }),
        row({ id: 2, type: "DER_EVENT_RECEIVED", state: null, status: "ACTIVE" }),
        row({ id: 1, state: "ACTIVE" }),
      ],
    };

    // Act
    const text = textOf(history);

    // Assert — RECEIVED is hidden (its STATE row says it); no Ack anywhere
    expect({
      order: text.indexOf("Curtailment ended") < text.indexOf("Curtailment active"),
      received: text.split("Curtailment").length - 1,
      ack: /\bAck/.test(text),
      heading: text.includes("Event history"),
    }).toEqual({ order: true, received: 2, ack: false, heading: true });
  });

  it("says why it's empty — none yet, no backend, or the request failed", () => {
    // Arrange / Act
    const texts = [
      textOf({ status: "ready", rows: [] }),
      textOf({ status: "unavailable" }),
      textOf({ status: "error" }),
    ];

    // Assert
    expect([
      texts[0]?.includes("No events in the last 24 h"),
      texts[1]?.includes("Event history is available on a live site"),
      texts[2]?.includes("Couldn't load event history"),
    ]).toEqual([true, true, true]);
  });
});
