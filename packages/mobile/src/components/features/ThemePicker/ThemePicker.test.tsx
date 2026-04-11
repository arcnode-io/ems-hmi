import React from "react";
import { render, screen } from "@testing-library/react-native";
import { ThemePicker } from "./ThemePicker";
import { TamaguiThemeProvider } from "../../../theme/TamaguiThemeProvider";

/**
 * Wrapper with theme provider for testing.
 * @param props Component props
 * @param props.children Child components
 * @returns Wrapped component
 */
function TestWrapper({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <TamaguiThemeProvider>{children}</TamaguiThemeProvider>;
}

describe("ThemePicker", () => {
  it("displays current theme name in trigger", () => {
    // Arrange & Act
    render(
      <TestWrapper>
        <ThemePicker />
      </TestWrapper>,
    );

    // Assert - trigger should display current theme value
    const trigger = screen.getByTestId("theme-select-trigger");
    expect(trigger).toBeTruthy();
    expect(screen.getByText("neobrutalism")).toBeTruthy();
  });
});
