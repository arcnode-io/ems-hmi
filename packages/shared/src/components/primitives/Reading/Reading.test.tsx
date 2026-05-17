/**
 * Tests for Reading primitive. AAA pattern.
 */

import React from "react";
import { render } from "@testing-library/react";
import { Reading } from "./Reading";
import { ThemeProvider } from "../../../theme/ThemeProvider";

function withTheme(node: React.ReactElement): React.ReactElement {
  return <ThemeProvider>{node}</ThemeProvider>;
}

describe("Reading", () => {
  it("renders value + unit when value is finite", () => {
    // Arrange + Act
    const { container } = render(withTheme(<Reading value={74.2} unit="%" />));

    // Assert
    expect(container.textContent).toContain("74.2");
    expect(container.textContent).toContain("%");
  });

  it("renders em-dash when value is null — never '0' (Rule 3.4)", () => {
    // Arrange + Act
    const { container } = render(withTheme(<Reading value={null} unit="%" />));

    // Assert
    expect(container.textContent).toContain("—");
    expect(container.textContent).not.toMatch(/\b0\b/);
  });

  it("sets data-state='no-data' when value is null", () => {
    // Arrange + Act
    const { container } = render(withTheme(<Reading value={null} unit="kW" />));

    // Assert
    const root = container.querySelector('[data-comp="Reading"]');
    expect(root?.getAttribute("data-state")).toBe("no-data");
  });

  it("sets data-state='normal' when value is finite", () => {
    // Arrange + Act
    const { container } = render(withTheme(<Reading value={42} unit="kW" />));

    // Assert
    const root = container.querySelector('[data-comp="Reading"]');
    expect(root?.getAttribute("data-state")).toBe("normal");
  });

  it("formats large numbers with locale grouping", () => {
    // Arrange + Act
    const { container } = render(withTheme(<Reading value={1234567} unit="W" />));

    // Assert — exact locale separator varies, but 4-digit chunks should NOT appear
    expect(container.textContent).not.toContain("1234567");
    expect(container.textContent).toContain("W");
  });

  it("renders zero as '0', not em-dash (zero is a valid measurement)", () => {
    // Arrange + Act
    const { container } = render(withTheme(<Reading value={0} unit="kW" />));

    // Assert
    expect(container.textContent).toMatch(/\b0\b/);
    expect(container.textContent).not.toContain("—");
  });
});
