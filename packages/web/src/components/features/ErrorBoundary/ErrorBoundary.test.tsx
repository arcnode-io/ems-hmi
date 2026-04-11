import { screen } from "@testing-library/react";
import * as assert from "assert";
import type { ReactElement } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import { renderWithTheme } from "../../../test-utils";

const ThrowError = ({
  shouldThrow,
}: {
  shouldThrow: boolean;
}): ReactElement => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>No error</div>;
};

/**
 * Tests for ErrorBoundary component error handling.
 */
describe("ErrorBoundary", () => {
  /**
   * Tests that children render normally when no error occurs.
   */
  it("renders children when no error occurs", () => {
    // Arrange & Act
    renderWithTheme(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>,
    );

    // Assert
    assert.notStrictEqual(screen.queryByText("No error"), null);
  });

  /**
   * Tests that error UI is displayed when child component throws.
   */
  it("displays error UI when child component throws", () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    // Arrange & Act
    renderWithTheme(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    // Assert
    assert.notStrictEqual(screen.queryByText("Something went wrong"), null);
    assert.notStrictEqual(
      screen.queryByText(/An unexpected error occurred/),
      null,
    );
    assert.notStrictEqual(screen.queryByText("Error details"), null);

    // Cleanup
    consoleSpy.mockRestore();
  });
});
