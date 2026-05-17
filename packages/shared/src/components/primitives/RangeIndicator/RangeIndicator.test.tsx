/**
 * Tests for RangeIndicator primitive. AAA pattern.
 */

import React from "react";
import { render } from "@testing-library/react";
import { RangeIndicator } from "./RangeIndicator";
import { ThemeProvider } from "../../../theme/ThemeProvider";

function withTheme(node: React.ReactElement): React.ReactElement {
  return <ThemeProvider>{node}</ThemeProvider>;
}

describe("RangeIndicator", () => {
  it("renders a fill region when value is provided", () => {
    // Arrange + Act
    const { container } = render(
      withTheme(<RangeIndicator value={50} min={0} max={100} />),
    );

    // Assert
    expect(container.querySelector('[data-region="fill"]')).not.toBeNull();
  });

  it("renders empty track (no fill) when value is null", () => {
    // Arrange + Act
    const { container } = render(
      withTheme(<RangeIndicator value={null} min={0} max={100} />),
    );

    // Assert
    expect(container.querySelector('[data-region="fill"]')).toBeNull();
    const root = container.querySelector('[data-comp="RangeIndicator"]');
    expect(root?.getAttribute("data-state")).toBe("no-data");
  });

  it("clamps fill width to [0%, 100%] for out-of-range values", () => {
    // Arrange + Act
    const { container: lowContainer } = render(
      withTheme(<RangeIndicator value={-50} min={0} max={100} />),
    );
    const { container: highContainer } = render(
      withTheme(<RangeIndicator value={200} min={0} max={100} />),
    );

    // Assert
    const lowFill = lowContainer.querySelector(
      '[data-region="fill"]',
    ) as HTMLElement | null;
    const highFill = highContainer.querySelector(
      '[data-region="fill"]',
    ) as HTMLElement | null;
    expect(lowFill?.style.width).toBe("0%");
    expect(highFill?.style.width).toBe("100%");
  });

  it("renders threshold ticks at correct positions", () => {
    // Arrange + Act
    const { container } = render(
      withTheme(
        <RangeIndicator
          value={50}
          min={0}
          max={100}
          thresholds={[{ value: 75 }]}
        />,
      ),
    );
    const ticks = container.querySelectorAll('[data-region="threshold"]');

    // Assert
    expect(ticks).toHaveLength(1);
    expect((ticks[0] as HTMLElement).style.left).toBe("75%");
  });

  it("exposes ARIA progressbar role with valuenow / min / max", () => {
    // Arrange + Act
    const { container } = render(
      withTheme(<RangeIndicator value={42} min={0} max={100} />),
    );
    const root = container.querySelector('[data-comp="RangeIndicator"]');

    // Assert
    expect(root?.getAttribute("role")).toBe("progressbar");
    expect(root?.getAttribute("aria-valuenow")).toBe("42");
    expect(root?.getAttribute("aria-valuemin")).toBe("0");
    expect(root?.getAttribute("aria-valuemax")).toBe("100");
  });
});
