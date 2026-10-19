import React from "react";
import { renderWithScreen } from "../screenTestHarness";
import { AlarmsScreen } from "./AlarmsScreen";

describe("AlarmsScreen", () => {
  it("titles the page and, with no alarm limits configured, says status is unknown — not all clear", () => {
    // Arrange / Act — the harness view carries no thresholds
    const view = renderWithScreen(<AlarmsScreen onOpen={jest.fn()} />, []);
    const text = view.container.textContent ?? "";

    // Assert
    expect([text.includes("Alarms"), text.includes("No alarm limits configured"), text.includes("No active alarms")]).toEqual([
      true,
      true,
      false,
    ]);
  });
});
