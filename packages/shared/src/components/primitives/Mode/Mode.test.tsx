/**
 * Tests for Mode primitive. AAA pattern.
 */

import React from "react";
import { render } from "@testing-library/react";
import { Mode } from "./Mode";
import { ThemeProvider } from "../../../theme/ThemeProvider";

function withTheme(node: React.ReactElement): React.ReactElement {
  return <ThemeProvider>{node}</ThemeProvider>;
}

describe("Mode", () => {
  it("renders humanized label for a canonical enum value", () => {
    // Arrange + Act
    const { container } = render(
      withTheme(<Mode value="discharging" severity="ok" />),
    );

    // Assert
    expect(container.textContent).toContain("Discharging");
  });

  it("preserves known acronyms (BMS, BESS, GPU, etc.)", () => {
    // Arrange + Act
    const { container } = render(
      withTheme(<Mode value="bms_fault" severity="alarm" />),
    );

    // Assert
    expect(container.textContent).toContain("BMS Fault");
  });

  it("renders '—' and no dot when value is null", () => {
    // Arrange + Act
    const { container } = render(withTheme(<Mode value={null} />));
    const root = container.querySelector('[data-comp="Mode"]');

    // Assert
    expect(container.textContent).toContain("—");
    expect(root?.getAttribute("data-state")).toBe("no-data");
  });

  it("uses 'neutral' state when severity is null but value present", () => {
    // Arrange + Act
    const { container } = render(
      withTheme(<Mode value="standby" severity={null} />),
    );
    const root = container.querySelector('[data-comp="Mode"]');

    // Assert
    expect(root?.getAttribute("data-state")).toBe("neutral");
  });

  it("sets data-state from severity when value is present", () => {
    // Arrange + Act
    const { container } = render(
      withTheme(<Mode value="charging" severity="warn" />),
    );
    const root = container.querySelector('[data-comp="Mode"]');

    // Assert
    expect(root?.getAttribute("data-state")).toBe("warn");
  });
});
