import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { ThemeProvider } from "../../../../theme/ThemeProvider";
import type { EventRow } from "../../../../data/events/eventsApi";
import type { EventHistory } from "../../../../data/events/useEventHistory";
import { EventHistoryPanel } from "./EventHistoryPanel";

const row = (patch: Partial<EventRow>): EventRow => ({
  id: 1, occurredAt: new Date().toISOString(), type: "DER_EVENT_STATE", subject: null, actor: null,
  program: "DLR_LINE_CONSTRAINT", status: null, state: "ACTIVE", value: null, detail: null, ...patch,
});

const renderPanel = (history: EventHistory, onOpenHistory = (): void => undefined): ReturnType<typeof render> =>
  render(
    <ThemeProvider>
      <EventHistoryPanel history={history} floorMwh={2.36} onOpenHistory={onOpenHistory} />
    </ThemeProvider>,
  );
const textOf = (history: EventHistory): string => renderPanel(history).container.textContent ?? "";

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
      heading: text.includes("Recent events"),
    }).toEqual({ order: true, received: 2, ack: false, heading: true });
  });

  it("names who caused each event, like the alarm rows name the device", () => {
    // Arrange
    const history: EventHistory = {
      status: "ready",
      rows: [
        row({ id: 2, type: "OPERATOR_RESERVE_SET", actor: "operator", state: null, value: 2_360_000 }),
        row({ id: 1, state: "ACTIVE" }),
      ],
    };

    // Act
    const sources = [...renderPanel(history).container.querySelectorAll('[data-comp="EventRow"]')].map(
      (el) => el.querySelector('[data-region="source"]')?.textContent,
    );

    // Assert
    expect(sources).toEqual(["Operator", "Utility"]);
  });

  it("shows only the latest 5 — the full log lives behind History", () => {
    // Arrange
    let opened = 0;
    const rows = Array.from({ length: 8 }, (_, i) => row({ id: i + 1 }));
    const view = renderPanel({ status: "ready", rows }, () => (opened += 1));

    // Act
    fireEvent.click(view.getByLabelText("View event history"));

    // Assert
    expect({ shown: view.container.querySelectorAll('[data-comp="EventRow"]').length, opened }).toEqual({
      shown: 5,
      opened: 1,
    });
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
