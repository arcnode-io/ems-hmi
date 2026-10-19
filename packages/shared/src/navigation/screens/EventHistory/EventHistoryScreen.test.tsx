import React from "react";
import { renderWithScreen } from "../screenTestHarness";
import { EventHistoryScreen } from "./EventHistoryScreen";

describe("EventHistoryScreen", () => {
  it("titles the page, offers the filters, and waits for a session before loading", () => {
    // Arrange / Act — the harness has no login, so nothing is fetched yet
    const view = renderWithScreen(<EventHistoryScreen />, []);
    const text = view.container.textContent ?? "";

    // Assert
    expect([
      text.includes("Event history"),
      text.includes("Curtailment"),
      text.includes("Last 24 h"),
      text.includes("Loading event history…"),
    ]).toEqual([true, true, true, true]);
  });
});
