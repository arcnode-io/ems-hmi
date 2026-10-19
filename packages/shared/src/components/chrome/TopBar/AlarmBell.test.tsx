import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "../../../theme/ThemeProvider";
import { AlarmBell } from "./AlarmBell";

describe("AlarmBell", () => {
  it("opens the alarms list when pressed, and says how many are active", () => {
    // Arrange
    const onPress = jest.fn();
    render(
      <ThemeProvider>
        <AlarmBell alarmCount={36} onPress={onPress} />
      </ThemeProvider>,
    );

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Alarms, 36 active" }));

    // Assert
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
