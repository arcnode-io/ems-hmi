/**
 * Tests for Indicator primitive. AAA pattern.
 */

import React from "react";
import { render } from "@testing-library/react";
import { Indicator } from "./Indicator";
import { ThemeProvider } from "../../../theme/ThemeProvider";

function withTheme(node: React.ReactElement): React.ReactElement {
  return <ThemeProvider>{node}</ThemeProvider>;
}

describe("Indicator", () => {
  it("renders an ok dot when state=true", () => {
    // Arrange + Act
    const { container } = render(withTheme(<Indicator state={true} />));
    const root = container.querySelector('[data-comp="Indicator"]');

    // Assert
    expect(root?.getAttribute("data-state")).toBe("ok");
  });

  it("renders a fault dot when state=false", () => {
    // Arrange + Act
    const { container } = render(withTheme(<Indicator state={false} />));
    const root = container.querySelector('[data-comp="Indicator"]');

    // Assert
    expect(root?.getAttribute("data-state")).toBe("fault");
  });

  it("renders a no-data dot when state=null", () => {
    // Arrange + Act
    const { container } = render(withTheme(<Indicator state={null} />));
    const root = container.querySelector('[data-comp="Indicator"]');

    // Assert
    expect(root?.getAttribute("data-state")).toBe("no-data");
  });

  it("size=md is the default 10px diameter", () => {
    // Arrange + Act
    const { container } = render(withTheme(<Indicator state={true} />));
    const root = container.querySelector(
      '[data-comp="Indicator"]',
    ) as HTMLElement | null;

    // Assert
    expect(root?.style.width).toBe("10px");
    expect(root?.style.height).toBe("10px");
  });

  it("size=sm yields 8px; size=lg yields 14px", () => {
    // Arrange + Act
    const { container: smContainer } = render(
      withTheme(<Indicator state={true} size="sm" />),
    );
    const { container: lgContainer } = render(
      withTheme(<Indicator state={true} size="lg" />),
    );
    const smRoot = smContainer.querySelector(
      '[data-comp="Indicator"]',
    ) as HTMLElement | null;
    const lgRoot = lgContainer.querySelector(
      '[data-comp="Indicator"]',
    ) as HTMLElement | null;

    // Assert
    expect(smRoot?.style.width).toBe("8px");
    expect(lgRoot?.style.width).toBe("14px");
  });
});
