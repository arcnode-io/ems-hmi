/**
 * Tests for Gauge primitive. AAA pattern.
 */

import React from "react";
import { render } from "@testing-library/react";
import { Gauge } from "./Gauge";
import { ThemeProvider } from "../../../theme/ThemeProvider";

function withTheme(node: React.ReactElement): React.ReactElement {
  return <ThemeProvider>{node}</ThemeProvider>;
}

describe("Gauge", () => {
  it("renders value + unit when value is finite", () => {
    // Arrange + Act
    const { container } = render(
      withTheme(<Gauge value={74} min={0} max={100} unit="%" />),
    );

    // Assert
    expect(container.textContent).toContain("74");
    expect(container.textContent).toContain("%");
  });

  it("renders '—' when value is null", () => {
    // Arrange + Act
    const { container } = render(
      withTheme(<Gauge value={null} min={0} max={100} unit="%" />),
    );
    const root = container.querySelector('[data-comp="Gauge"]');

    // Assert
    expect(container.textContent).toContain("—");
    expect(root?.getAttribute("data-state")).toBe("no-data");
  });

  it("exposes ARIA meter role with valuemin / max / now when populated", () => {
    // Arrange + Act
    const { container } = render(
      withTheme(<Gauge value={50} min={0} max={100} unit="%" />),
    );
    const root = container.querySelector('[data-comp="Gauge"]');

    // Assert
    expect(root?.getAttribute("role")).toBe("meter");
    expect(root?.getAttribute("aria-valuenow")).toBe("50");
    expect(root?.getAttribute("aria-valuemin")).toBe("0");
    expect(root?.getAttribute("aria-valuemax")).toBe("100");
  });

  it("renders optional sublabel below the value", () => {
    // Arrange + Act
    const { container } = render(
      withTheme(<Gauge value={50} min={0} max={100} unit="%" label="6h runway" />),
    );

    // Assert
    expect(container.textContent).toContain("6h runway");
  });

  it("size=sm yields 80px diameter; lg yields 180px", () => {
    // Arrange + Act
    const { container: smContainer } = render(
      withTheme(<Gauge value={50} min={0} max={100} unit="%" size="sm" />),
    );
    const { container: lgContainer } = render(
      withTheme(<Gauge value={50} min={0} max={100} unit="%" size="lg" />),
    );
    const smRoot = smContainer.querySelector(
      '[data-comp="Gauge"]',
    ) as HTMLElement | null;
    const lgRoot = lgContainer.querySelector(
      '[data-comp="Gauge"]',
    ) as HTMLElement | null;

    // Assert
    expect(smRoot?.style.width).toBe("80px");
    expect(lgRoot?.style.width).toBe("180px");
  });
});
