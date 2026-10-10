import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { ThemeProvider } from "../../../../theme/ThemeProvider";
import type { EventRow } from "../../../../data/events/eventsApi";
import { EventLogTable } from "./EventLogTable";

const row = (id: number, patch: Partial<EventRow> = {}): EventRow => ({
  id, occurredAt: "2026-10-10T18:39:02Z", type: "DER_EVENT_STATE", subject: null, actor: null,
  program: "DLR_LINE_CONSTRAINT", status: null, state: "ACTIVE", value: null, detail: null, ...patch,
});

const renderTable = (rows: EventRow[], end: boolean, onOlder = (): void => undefined): ReturnType<typeof render> =>
  render(
    <ThemeProvider>
      <EventLogTable rows={rows} floorMwh={2.36} end={end} loadingOlder={false} onOlder={onOlder} />
    </ThemeProvider>,
  );

describe("EventLogTable", () => {
  it("one row per event: time, who, what — no Ack", () => {
    // Arrange / Act
    const view = renderTable(
      [row(2, { type: "DISPATCH_MODE_SET", actor: "operator", state: null, program: null, detail: "MANUAL" }), row(1)],
      false,
    );
    const rows = [...view.container.querySelectorAll('[data-comp="EventLogRow"]')].map((el) =>
      [...el.querySelectorAll('[data-region]')].map((cell) => cell.textContent),
    );

    // Assert — time cell checked loosely: it's in the viewer's zone
    expect({
      cells: rows.map(([, who, what]) => [who, what]),
      timed: rows.every(([time]) => /\d\d:\d\d:\d\d$/.test(time ?? "")),
      ack: /\bAck/.test(view.container.textContent ?? ""),
    }).toEqual({
      cells: [
        ["Operator", "Dispatch mode set to Manual"],
        ["Utility", "Curtailment active · Line constraint"],
      ],
      timed: true,
      ack: false,
    });
  });

  it("loads older on demand, and says so when it reaches the start of the log", () => {
    // Arrange
    let older = 0;
    const more = renderTable([row(1)], false, () => (older += 1));
    fireEvent.click(more.getByText("Load older events"));
    more.unmount();

    // Act
    const done = renderTable([row(1)], true);

    // Assert
    expect({ older, endNote: done.queryByText("Start of the log for these filters.") !== null }).toEqual({
      older: 1,
      endNote: true,
    });
  });
});
