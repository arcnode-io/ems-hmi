/**
 * Tests for StatusBadge composed component. AAA pattern.
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { StatusBadge } from "./StatusBadge";
import { ThemeProvider } from "../../../theme/ThemeProvider";

function withTheme(node: React.ReactElement): React.ReactElement {
  return <ThemeProvider>{node}</ThemeProvider>;
}

describe("StatusBadge", () => {
  it("renders the label when provided", () => {
    const { container } = render(
      withTheme(<StatusBadge variant="ok" label="OK" />),
    );
    expect(container.textContent).toContain("OK");
  });

  it("renders no label region when omitted (icon/dot only)", () => {
    const { container } = render(withTheme(<StatusBadge variant="warn" />));
    expect(container.querySelector('[data-comp="StatusBadge"]')).not.toBeNull();
  });

  it("sets data-variant + data-acknowledged on root", () => {
    const { container } = render(
      withTheme(
        <StatusBadge variant="alarm" label="ALARM" acknowledged={false} />,
      ),
    );
    const root = container.querySelector('[data-comp="StatusBadge"]');
    expect(root?.getAttribute("data-variant")).toBe("alarm");
    expect(root?.getAttribute("data-acknowledged")).toBe("false");
  });

  it("invokes onPress when interactive", () => {
    const onPress = jest.fn();
    const { container } = render(
      withTheme(
        <StatusBadge
          variant="warn"
          label="WARN"
          interactive
          onPress={onPress}
          targetLabel="warning detail"
        />,
      ),
    );
    const root = container.querySelector('[data-comp="StatusBadge"]');
    expect(root).not.toBeNull();
    fireEvent.click(root as Element);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders the chevron only when interactive", () => {
    const { container: a } = render(
      withTheme(<StatusBadge variant="ok" label="OK" />),
    );
    const { container: b } = render(
      withTheme(
        <StatusBadge variant="ok" label="OK" interactive onPress={() => {}} />,
      ),
    );
    expect(a.textContent).not.toContain("›");
    expect(b.textContent).toContain("›");
  });
});
