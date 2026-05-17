/**
 * Tests for AlarmRow composed component. AAA pattern.
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { AlarmRow } from "./AlarmRow";
import { ThemeProvider } from "../../../theme/ThemeProvider";

function withTheme(node: React.ReactElement): React.ReactElement {
  return <ThemeProvider>{node}</ThemeProvider>;
}

const BASE_PROPS = {
  severity: "alarm" as const,
  acknowledged: false,
  device: "BESS-01",
  name: "Cell voltage out of range",
  value: "4.21 V",
  age: "4m ago",
};

describe("AlarmRow", () => {
  it("renders device + name + value + age", () => {
    const { container } = render(withTheme(<AlarmRow {...BASE_PROPS} />));
    expect(container.textContent).toContain("BESS-01");
    expect(container.textContent).toContain("Cell voltage out of range");
    expect(container.textContent).toContain("4.21 V");
    expect(container.textContent).toContain("4m ago");
  });

  it("renders Ack button when unacknowledged", () => {
    const { container } = render(withTheme(<AlarmRow {...BASE_PROPS} />));
    expect(container.textContent).toContain("Ack");
  });

  it("renders Ack'd label (no button) when acknowledged", () => {
    const { container } = render(
      withTheme(<AlarmRow {...BASE_PROPS} acknowledged={true} />),
    );
    expect(container.textContent).toContain("Ack'd");
    expect(container.querySelector('[data-comp="AlarmRow"]')?.getAttribute(
      "data-acknowledged",
    )).toBe("true");
  });

  it("invokes onAcknowledge when Ack button pressed", () => {
    const onAck = jest.fn();
    const { getByText } = render(
      withTheme(<AlarmRow {...BASE_PROPS} onAcknowledge={onAck} />),
    );
    fireEvent.click(getByText("Ack"));
    expect(onAck).toHaveBeenCalledTimes(1);
  });

  it("sets data-severity on root", () => {
    const { container } = render(
      withTheme(<AlarmRow {...BASE_PROPS} severity="fire" />),
    );
    expect(
      container.querySelector('[data-comp="AlarmRow"]')?.getAttribute("data-severity"),
    ).toBe("fire");
  });
});
