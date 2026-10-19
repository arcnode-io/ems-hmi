import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "../../../../theme/ThemeProvider";
import { HealthBar } from "./HealthBar";

describe("HealthBar", () => {
  it("opens the alarms list when pressed", () => {
    // Arrange
    const onPress = jest.fn();
    render(
      <ThemeProvider>
        <HealthBar headline="36 active alarms" detail="4 modules" accentColor="#c00" level="alarm" onPress={onPress} />
      </ThemeProvider>,
    );

    // Act
    fireEvent.click(screen.getByRole("link", { name: "36 active alarms — open alarms" }));

    // Assert
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
