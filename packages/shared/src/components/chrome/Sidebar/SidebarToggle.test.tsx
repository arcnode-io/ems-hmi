import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { SidebarToggle } from "./SidebarToggle";
import { ThemeProvider } from "../../../theme/ThemeProvider";

describe("SidebarToggle", () => {
  it("labels the action it will take and calls onToggle", () => {
    // Arrange
    const onToggle = jest.fn();
    const { getByLabelText, rerender } = render(<ThemeProvider><SidebarToggle collapsed={false} onToggle={onToggle} /></ThemeProvider>);

    // Act
    fireEvent.click(getByLabelText("Collapse sidebar"));
    rerender(<ThemeProvider><SidebarToggle collapsed onToggle={onToggle} /></ThemeProvider>);
    const expandLabel = getByLabelText("Expand sidebar") !== null;

    // Assert
    expect([onToggle.mock.calls.length, expandLabel]).toEqual([1, true]);
  });
});
