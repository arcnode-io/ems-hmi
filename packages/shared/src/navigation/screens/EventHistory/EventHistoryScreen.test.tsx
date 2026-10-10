import React from "react";
import { renderWithScreen } from "../screenTestHarness";
import { EventHistoryScreen } from "./EventHistoryScreen";

describe("EventHistoryScreen", () => {
  it("titles the page, offers the filters, and says why there's no log without a backend", () => {
    // Arrange / Act — the harness has no login, so there's no der-control-api to ask
    const view = renderWithScreen(<EventHistoryScreen />, []);
    const text = view.container.textContent ?? "";

    // Assert
    expect([
      text.includes("Event history"),
      text.includes("Curtailment"),
      text.includes("Last 24 h"),
      text.includes("Event history is available on a live site."),
    ]).toEqual([true, true, true, true]);
  });
});
