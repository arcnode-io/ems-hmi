import { screen } from "@testing-library/react";
import * as assert from "assert";
import { IpAddress } from "./IpAddress";
import { renderWithTheme } from "../../../test-utils";

/**
 * Tests for IpAddress component rendering IP octets and states.
 */
describe("IpAddress", () => {
  /**
   * Tests that the component renders IP octets correctly for a valid IP.
   */
  it("renders IP octets for valid IP address", () => {
    // Arrange & Act
    renderWithTheme(<IpAddress ip="192.168.100.200" />);

    // Assert
    assert.notStrictEqual(screen.queryByText("Your IP Address:"), null);
    assert.notStrictEqual(screen.queryByText("192"), null);
    assert.notStrictEqual(screen.queryByText("168"), null);
    assert.notStrictEqual(screen.queryByText("100"), null);
    assert.notStrictEqual(screen.queryByText("200"), null);
  });

  /**
   * Tests that the component shows loading state correctly.
   */
  it("shows loading state", () => {
    // Arrange & Act
    renderWithTheme(<IpAddress loading={true} />);

    // Assert
    assert.notStrictEqual(screen.queryByText("Your IP Address:"), null);
    assert.notStrictEqual(screen.queryByText("..."), null);
  });

  /**
   * Tests that the component shows error state correctly.
   */
  it("shows error state", () => {
    // Arrange & Act
    renderWithTheme(<IpAddress error="Network error" />);

    // Assert
    assert.notStrictEqual(screen.queryByText("Your IP Address:"), null);
    assert.notStrictEqual(screen.queryByText("Error: Network error"), null);
  });
});
