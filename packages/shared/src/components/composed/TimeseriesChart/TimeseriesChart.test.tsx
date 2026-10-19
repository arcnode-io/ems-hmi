/**
 * Tests for canonical TimeseriesChart. AAA pattern.
 */

import React from "react";
import { render } from "@testing-library/react";
import { TimeseriesChart, type TimeseriesSeries } from "./TimeseriesChart";
import { ThemeProvider } from "../../../theme/ThemeProvider";

function withTheme(node: React.ReactElement): React.ReactElement {
  return <ThemeProvider>{node}</ThemeProvider>;
}

const HIST: TimeseriesSeries = {
  label: "BESS-01 SoC",
  points: [
    { x: 0, y: 74 },
    { x: 1, y: 72 },
    { x: 2, y: 70 },
  ],
};

describe("TimeseriesChart", () => {
  it("renders the title + axis labels", () => {
    const { container } = render(
      withTheme(
        <TimeseriesChart
          title="State of Charge — 3h"
          xAxis={{ label: "time", kind: "numeric" }}
          yAxis={{ label: "SoC", unit: "%" }}
          series={[HIST]}
        />,
      ),
    );
    expect(container.textContent).toContain("State of Charge — 3h");
    expect(container.textContent).toContain("SoC");
    expect(container.textContent).toContain("%");
  });

  it("renders one polyline per series via its data-comp marker", () => {
    const { container } = render(
      withTheme(
        <TimeseriesChart
          title="Two series"
          xAxis={{ label: "t", kind: "numeric" }}
          yAxis={{ label: "v", unit: "" }}
          series={[
            HIST,
            { label: "Forecast", points: HIST.points, style: "dashed" },
          ]}
        />,
      ),
    );
    const lines = container.querySelectorAll(
      '[data-comp="TimeseriesChart"] [data-region="series"]',
    );
    expect(lines.length).toBe(2);
  });

  it("renders threshold lines when provided", () => {
    const { container } = render(
      withTheme(
        <TimeseriesChart
          title="With thresholds"
          xAxis={{ label: "t", kind: "numeric" }}
          yAxis={{ label: "v", unit: "" }}
          series={[HIST]}
          thresholds={[
            { label: "MIN", y: 10, severity: "alarm" },
            { label: "MAX", y: 95, severity: "alarm" },
          ]}
        />,
      ),
    );
    const lines = container.querySelectorAll(
      '[data-comp="TimeseriesChart"] [data-region="threshold"]',
    );
    expect(lines.length).toBe(2);
  });

  it("tolerates null thresholds + gaps (server sends explicit null)", () => {
    // Arrange + Act — analyst LineSpec serializes absent optionals as null.
    const { container } = render(
      withTheme(
        <TimeseriesChart
          title="Null optionals"
          xAxis={{ label: "t", kind: "time" }}
          yAxis={{ label: "v", unit: "" }}
          series={[HIST]}
          thresholds={null}
          gaps={null}
        />,
      ),
    );

    // Assert — renders, does not throw on `for...of null`.
    const root = container.querySelector('[data-comp="TimeseriesChart"]');
    expect(root?.getAttribute("data-state")).toBe("ready");
  });

  it("plots a series whose x values are ISO timestamp strings", () => {
    // Arrange + Act — analyst time-axis charts carry ISO-string x values.
    const { container } = render(
      withTheme(
        <TimeseriesChart
          title="Time series"
          xAxis={{ label: "Time", kind: "time" }}
          yAxis={{ label: "price", unit: "usd" }}
          series={[
            {
              label: "market_01",
              points: [
                { x: "2026-05-21T13:00:00Z", y: null },
                { x: "2026-05-21T14:00:00Z", y: 21.24 },
                { x: "2026-05-21T15:00:00Z", y: 21.97 },
              ],
            },
          ]}
        />,
      ),
    );

    // Assert — scale resolves (not "no-data") and a polyline is drawn.
    const root = container.querySelector('[data-comp="TimeseriesChart"]');
    expect(root?.getAttribute("data-state")).toBe("ready");
    expect(
      container.querySelectorAll(
        '[data-comp="TimeseriesChart"] [data-region="series"]',
      ).length,
    ).toBe(1);
  });

  it("shows no-data state when every series is empty", () => {
    const { container } = render(
      withTheme(
        <TimeseriesChart
          title="Empty"
          xAxis={{ label: "t", kind: "numeric" }}
          yAxis={{ label: "v", unit: "" }}
          series={[{ label: "x", points: [] }]}
        />,
      ),
    );
    const root = container.querySelector('[data-comp="TimeseriesChart"]');
    expect(root?.getAttribute("data-state")).toBe("no-data");
  });

  it("labels a time axis with clock times from the first point to the last", () => {
    // Arrange — 4 h of hourly points
    const start = Date.UTC(2026, 9, 19, 12, 0);
    const hourly = [0, 1, 2, 3, 4].map((h) => ({ x: start + h * 3_600_000, y: 20 + h }));
    const clock = (ms: number): string => {
      const d = new Date(ms);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    };

    // Act
    const { container } = render(
      withTheme(
        <TimeseriesChart
          title="Price"
          xAxis={{ label: "Time", kind: "time" }}
          yAxis={{ label: "Price", unit: "$/MWh" }}
          series={[{ label: "Forecast", points: hourly }]}
        />,
      ),
    );

    // Assert
    const ticks = [...container.querySelectorAll('[data-region="xtick"]')].map((el) => el.textContent);
    expect(ticks).toEqual(hourly.map((p) => clock(p.x)));
  });

  it("leaves a numeric axis unlabelled", () => {
    // Arrange / Act
    const { container } = render(
      withTheme(
        <TimeseriesChart title="n" xAxis={{ label: "t", kind: "numeric" }} yAxis={{ label: "v", unit: "" }} series={[HIST]} />,
      ),
    );

    // Assert
    expect(container.querySelectorAll('[data-region="xtick"]')).toHaveLength(0);
  });
});
