import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { ThemeProvider } from "../../../../theme/ThemeProvider";
import { DEFAULT_FILTER, type EventFilter } from "../../../../data/events/eventFilter";
import { EventFilters } from "./EventFilters";

describe("EventFilters", () => {
  it("each chip narrows one axis; program chips appear only for curtailments", () => {
    // Arrange
    const changes: EventFilter[] = [];
    const view = render(
      <ThemeProvider>
        <EventFilters filter={DEFAULT_FILTER} onChange={(f) => changes.push(f)} />
      </ThemeProvider>,
    );
    const programBefore = view.queryByText("ERCOT flex call") !== null;

    // Act
    fireEvent.click(view.getByText("Curtailment"));
    fireEvent.click(view.getByText("Last 7 days"));
    view.rerender(
      <ThemeProvider>
        <EventFilters filter={{ ...DEFAULT_FILTER, kind: "curtailment" }} onChange={(f) => changes.push(f)} />
      </ThemeProvider>,
    );
    fireEvent.click(view.getByText("ERCOT flex call"));

    // Assert
    expect({ programBefore, changes }).toEqual({
      programBefore: false,
      changes: [
        { kind: "curtailment", program: "all", range: "24h" },
        { kind: "all", program: "all", range: "7d" },
        { kind: "curtailment", program: "ERCOT_FLEX", range: "24h" },
      ],
    });
  });
});
