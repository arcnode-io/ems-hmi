import React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "../../../theme/ThemeProvider";
import { DeploymentIdentityProvider, type DeploymentIdentityBase } from "../../../data/deployment/DeploymentIdentityProvider";
import type { FetchFn } from "../../../data/history/measurementsApi";
import { EnergyScreen } from "./EnergyScreen";

const BASE: DeploymentIdentityBase = {
  name: "T", host: "h", siteId: "s", mode: "deployed", chatApiUri: "/api", deviceApiUri: "/api", derControlUri: "/der-control",
};

function renderScreen(body: object): HTMLElement {
  const fetchFn: FetchFn = async () => ({ ok: true, status: 200, json: async () => body });
  return render(
    <ThemeProvider>
      <DeploymentIdentityProvider base={BASE}>
        <EnergyScreen fetchFn={fetchFn} />
      </DeploymentIdentityProvider>
    </ThemeProvider>,
  ).container;
}

describe("EnergyScreen", () => {
  it("charts the site's day-ahead prices", async () => {
    // Arrange / Act
    renderScreen({
      settlement_point: "HB_NORTH",
      unit: "usd_per_mwh",
      points: [{ forecast_for: "2026-10-19T01:00:00Z", value: 31.5 }],
    });

    // Assert
    expect(await screen.findByText("Day-ahead price · HB_NORTH")).toBeTruthy();
  });

  it("says no market is connected, with no canned revenue or live badge, when the site isn't enrolled", async () => {
    // Arrange / Act
    const container = renderScreen({ settlement_point: null, unit: "", points: [] });

    // Assert
    expect(await screen.findByText("No market connected")).toBeTruthy();
    expect([/\$/.test(container.textContent ?? ""), /Live/.test(container.textContent ?? "")]).toEqual([false, false]);
  });
});
