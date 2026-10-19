import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { DeploymentIdentityProvider, type DeploymentIdentityBase } from "../deployment/DeploymentIdentityProvider";
import type { FetchFn } from "../history/measurementsApi";
import { useForecast } from "./useForecast";

const BASE: DeploymentIdentityBase = {
  name: "T", host: "h", siteId: "s", mode: "deployed", chatApiUri: "/api", deviceApiUri: "/api", derControlUri: "/der-control",
};

function wrapper({ children }: { children: React.ReactNode }): React.ReactElement {
  return <DeploymentIdentityProvider base={BASE}>{children}</DeploymentIdentityProvider>;
}

describe("useForecast", () => {
  it("loads the site's prices from the analyst at chatApiUri", async () => {
    // Arrange
    const urls: string[] = [];
    const fetchFn: FetchFn = async (url) => {
      urls.push(url);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          settlement_point: "HB_NORTH",
          unit: "usd_per_mwh",
          points: [{ forecast_for: "2026-10-19T01:00:00Z", value: 31.5 }],
        }),
      };
    };

    // Act
    const { result } = renderHook(() => useForecast(fetchFn), { wrapper });

    // Assert
    expect(result.current).toEqual({ kind: "loading" });
    await waitFor(() => expect(result.current.kind).toBe("prices"));
    expect(urls.map((url) => url.split("?")[0])).toEqual(["/api/analyst/forecast"]);
  });

  it("is unavailable when the analyst can't be read", async () => {
    // Arrange
    const fetchFn: FetchFn = async () => ({ ok: false, status: 502, json: async () => ({}) });

    // Act
    const { result } = renderHook(() => useForecast(fetchFn), { wrapper });

    // Assert
    await waitFor(() => expect(result.current).toEqual({ kind: "unavailable" }));
  });
});
