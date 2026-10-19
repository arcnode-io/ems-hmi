import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "../../../theme/ThemeProvider";
import { StatusStrip } from "./StatusStrip";

describe("StatusStrip", () => {
  it("makes a segment with a press handler a link, and leaves the rest plain", () => {
    // Arrange
    const onPress = jest.fn();
    render(
      <ThemeProvider>
        <StatusStrip
          items={[
            { label: "SITE", value: "Alarm", dot: true, onPress, pressLabel: "Site Alarm — open alarms" },
            { label: "FLEET SoC", value: "92%" },
          ]}
        />
      </ThemeProvider>,
    );

    // Act
    fireEvent.click(screen.getByRole("link", { name: "Site Alarm — open alarms" }));

    // Assert
    expect([onPress.mock.calls.length, screen.queryAllByRole("link").length]).toEqual([1, 1]);
  });
});
