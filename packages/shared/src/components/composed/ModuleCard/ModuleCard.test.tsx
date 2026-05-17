/**
 * Tests for ModuleCard composed component. AAA pattern.
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { ModuleCard } from "./ModuleCard";
import { ThemeProvider } from "../../../theme/ThemeProvider";

function withTheme(node: React.ReactElement): React.ReactElement {
  return <ThemeProvider>{node}</ThemeProvider>;
}

const BASE = {
  moduleType: "bess" as const,
  displayName: "BESS-02",
  status: "alarm" as const,
  acknowledged: false,
  alarmCount: 1,
  measurements: [
    { label: "SoC", value: "67", unit: "%" },
    { label: "Power", value: "−42", unit: "kW" },
    { label: "Spread", value: "142", unit: "mV" },
  ],
  onPress: (): void => {},
};

describe("ModuleCard", () => {
  it("renders display name + measurements", () => {
    const { container } = render(withTheme(<ModuleCard {...BASE} />));
    expect(container.textContent).toContain("BESS-02");
    expect(container.textContent).toContain("SoC");
    expect(container.textContent).toContain("67");
  });

  it("renders alarmCount badge when > 0", () => {
    const { container } = render(withTheme(<ModuleCard {...BASE} />));
    const root = container.querySelector('[data-comp="ModuleCard"]');
    expect(root?.getAttribute("data-alarm-count")).toBe("1");
  });

  it("invokes onPress when tapped", () => {
    const onPress = jest.fn();
    const { container } = render(
      withTheme(<ModuleCard {...BASE} onPress={onPress} />),
    );
    const root = container.querySelector('[data-comp="ModuleCard"]');
    fireEvent.click(root as Element);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("dims when offline", () => {
    const { container } = render(
      withTheme(
        <ModuleCard
          {...BASE}
          status="offline"
          alarmCount={0}
          measurements={[]}
        />,
      ),
    );
    expect(
      container.querySelector('[data-comp="ModuleCard"]')?.getAttribute("data-status"),
    ).toBe("offline");
  });
});
