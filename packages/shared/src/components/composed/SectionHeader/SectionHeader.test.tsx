/**
 * Tests for SectionHeader composed component. AAA pattern.
 */

import React from "react";
import { render } from "@testing-library/react";
import { Text } from "react-native";
import { SectionHeader } from "./SectionHeader";
import { ThemeProvider } from "../../../theme/ThemeProvider";

function withTheme(node: React.ReactElement): React.ReactElement {
  return <ThemeProvider>{node}</ThemeProvider>;
}

describe("SectionHeader", () => {
  it("renders label chip + heading", () => {
    const { container } = render(
      withTheme(<SectionHeader label="ENERGY" heading="Power balance" />),
    );
    expect(container.textContent).toContain("ENERGY");
    expect(container.textContent).toContain("Power balance");
  });

  it("renders sub text when provided", () => {
    const { container } = render(
      withTheme(
        <SectionHeader
          label="OPERATIONS"
          heading="Active alarms"
          sub="2 unacknowledged · sorted by severity"
        />,
      ),
    );
    expect(container.textContent).toContain("2 unacknowledged");
  });

  it("omits sub when not provided", () => {
    const { container } = render(
      withTheme(<SectionHeader label="L" heading="H" />),
    );
    const root = container.querySelector('[data-comp="SectionHeader"]');
    expect(root?.getAttribute("data-has-sub")).toBe("false");
  });

  it("renders action slot when provided", () => {
    const { container } = render(
      withTheme(
        <SectionHeader
          label="L"
          heading="H"
          action={<Text>History →</Text>}
        />,
      ),
    );
    expect(container.textContent).toContain("History →");
  });

  it("sets data-comp='SectionHeader' on root", () => {
    const { container } = render(
      withTheme(<SectionHeader label="L" heading="H" />),
    );
    expect(container.querySelector('[data-comp="SectionHeader"]')).not.toBeNull();
  });
});
