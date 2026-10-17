import React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "../../../theme/ThemeProvider";
import { EnergyScreen } from "./EnergyScreen";

describe("EnergyScreen", () => {
  it("says no market is connected instead of showing canned markets, revenue or a live badge", () => {
    // Arrange / Act
    const { container } = render(
      <ThemeProvider>
        <EnergyScreen />
      </ThemeProvider>,
    );

    // Assert
    expect(screen.getByText("No market connected")).toBeTruthy();
    expect([/\$/.test(container.textContent ?? ""), /Live/.test(container.textContent ?? "")]).toEqual([false, false]);
  });
});
