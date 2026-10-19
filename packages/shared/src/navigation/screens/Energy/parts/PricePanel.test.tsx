import React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "../../../../theme/ThemeProvider";
import { PricePanel } from "./PricePanel";
import type { PriceState } from "../../../../data/forecast/useForecast";

function renderPanel(state: PriceState): HTMLElement {
  return render(
    <ThemeProvider>
      <PricePanel state={state} />
    </ThemeProvider>,
  ).container;
}

describe("PricePanel", () => {
  it("charts the day-ahead price for the site's settlement point in $/MWh", () => {
    // Arrange
    const state: PriceState = {
      kind: "prices",
      settlementPoint: "HB_NORTH",
      unit: "usd_per_mwh",
      points: [
        { x: 0, y: 31.5 },
        { x: 3_600_000, y: 28.25 },
      ],
    };

    // Act
    const container = renderPanel(state);

    // Assert
    expect(screen.getByText("Day-ahead price · HB_NORTH")).toBeTruthy();
    expect(container.textContent).toContain("$/MWh");
    expect(container.querySelectorAll('[data-comp="TimeseriesChart"]')).toHaveLength(1);
  });

  it("says no market is connected when the site isn't enrolled", () => {
    // Arrange / Act
    const container = renderPanel({ kind: "not-enrolled" });

    // Assert
    expect(screen.getByText("No market connected")).toBeTruthy();
    expect(container.querySelectorAll('[data-comp="TimeseriesChart"]')).toHaveLength(0);
  });

  it("says prices are unavailable when the forecast can't be read — not that there's no market", () => {
    // Arrange / Act
    renderPanel({ kind: "unavailable" });

    // Assert
    expect([screen.queryByText("No market connected"), screen.getByText("Prices unavailable")]).toEqual([
      null,
      expect.anything(),
    ]);
  });

  it("shows no prices and no verdict while loading", () => {
    // Arrange / Act
    const container = renderPanel({ kind: "loading" });

    // Assert
    expect([/\$/.test(container.textContent ?? ""), screen.queryByText("No market connected")]).toEqual([false, null]);
  });
});
