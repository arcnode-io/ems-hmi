/**
 * Tests for canonical Histogram. AAA pattern.
 */

import React from "react";
import { render } from "@testing-library/react";
import { Histogram } from "./Histogram";
import { ThemeProvider } from "../../../theme/ThemeProvider";

function withTheme(node: React.ReactElement): React.ReactElement {
  return <ThemeProvider>{node}</ThemeProvider>;
}

describe("Histogram", () => {
  it("renders bins for a non-empty sample set", () => {
    const samples = Array.from({ length: 50 }, (_, i) => 3.2 + i * 0.005);
    const { container } = render(
      withTheme(
        <Histogram samples={samples} unit="V" domainColor="colorBess" />,
      ),
    );
    const bins = container.querySelectorAll(
      '[data-comp="Histogram"] [data-region="bin"]',
    );
    expect(bins.length).toBeGreaterThan(0);
  });

  it("shows no-data state when samples is empty", () => {
    const { container } = render(
      withTheme(<Histogram samples={[]} unit="V" domainColor="colorBess" />),
    );
    expect(
      container.querySelector('[data-comp="Histogram"]')?.getAttribute("data-state"),
    ).toBe("no-data");
  });

  it("renders threshold lines when provided", () => {
    const { container } = render(
      withTheme(
        <Histogram
          samples={[1, 2, 3, 4, 5]}
          unit="V"
          domainColor="colorBess"
          thresholds={{ min: 1.5, max: 4.5 }}
        />,
      ),
    );
    const lines = container.querySelectorAll(
      '[data-comp="Histogram"] [data-region="threshold"]',
    );
    expect(lines.length).toBe(2);
  });

  it("paints outlier bins in alarm color via data-outlier flag", () => {
    const { container } = render(
      withTheme(
        <Histogram
          samples={[1, 2, 3, 4, 5, 6, 7]}
          unit="V"
          domainColor="colorBess"
          thresholds={{ min: 2.5, max: 5.5 }}
        />,
      ),
    );
    const outliers = container.querySelectorAll(
      '[data-comp="Histogram"] [data-region="bin"][data-outlier="true"]',
    );
    expect(outliers.length).toBeGreaterThan(0);
  });
});
