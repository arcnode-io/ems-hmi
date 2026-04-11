/**
 * @format
 */

import { screen } from "@testing-library/react-native";
import * as assert from "assert";
import { renderWithTheme } from "./test-utils";
import App from "./App";

/**
 * Simple happy path test for App component.
 * Verifies the component renders without crashing and shows expected content.
 */
describe("App", () => {
  /**
   * Tests that the App component renders the home screen content.
   */
  it("renders home screen with dialog button", () => {
    // Arrange & Act
    renderWithTheme(<App />);

    // Assert - "Open Dialog" button is always visible on home screen
    const dialogButton = screen.queryByText("Open Dialog");
    assert.notStrictEqual(dialogButton, null);
  });
});
