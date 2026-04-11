import { screen } from "@testing-library/react";
import * as assert from "assert";
import { ThemePicker } from "./ThemePicker";
import { renderWithTheme } from "../../../test-utils";

describe("ThemePicker", () => {
  /**
   * Tests that ThemePicker displays the current theme name in trigger.
   */
  it("displays current theme name in trigger", () => {
    // Arrange & Act
    renderWithTheme(<ThemePicker />);

    // Assert - trigger should display current theme value
    const trigger = screen.queryByTestId("theme-select-trigger");
    assert.notStrictEqual(trigger, null);
    const themeText = screen.queryByText("neobrutalism");
    assert.notStrictEqual(themeText, null);
  });
});
