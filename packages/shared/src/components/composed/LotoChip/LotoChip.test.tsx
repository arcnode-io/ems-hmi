import React from "react";
import { render } from "@testing-library/react";
import { ThemeProvider } from "../../../theme/ThemeProvider";
import { LotoChip } from "./LotoChip";

describe("LotoChip", () => {
  it("reads as a lockout state, with the lock count when more than one", () => {
    // Arrange
    const one = render(<ThemeProvider><LotoChip lockCount={1} /></ThemeProvider>);
    const two = render(<ThemeProvider><LotoChip lockCount={2} /></ThemeProvider>);

    // Act
    const labels = [one, two].map((r) => r.container.querySelector('[data-comp="LotoChip"]')?.getAttribute("aria-label"));

    // Assert
    expect(labels).toEqual(["Locked out", "Locked out, 2 locks"]);
  });
});
