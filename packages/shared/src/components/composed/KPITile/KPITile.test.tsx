/**
 * Tests for KPITile composed component. AAA pattern.
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { KPITile } from "./KPITile";
import { ThemeProvider } from "../../../theme/ThemeProvider";

function withTheme(node: React.ReactElement): React.ReactElement {
  return <ThemeProvider>{node}</ThemeProvider>;
}

describe("KPITile", () => {
  it("renders label + value + unit", () => {
    const { container } = render(
      withTheme(<KPITile label="BESS SoC" value="74" unit="%" />),
    );
    expect(container.textContent).toContain("BESS SoC");
    expect(container.textContent).toContain("74");
    expect(container.textContent).toContain("%");
  });

  it("renders em-dash when value is null (Rule 3.4)", () => {
    const { container } = render(withTheme(<KPITile label="L" value={null} />));
    expect(container.textContent).toContain("—");
  });

  it("renders sublabel when provided", () => {
    const { container } = render(
      withTheme(
        <KPITile label="L" value="1" sublabel="~6.2h runway" />,
      ),
    );
    expect(container.textContent).toContain("6.2h runway");
  });

  it("renders trend arrow + delta when trend provided", () => {
    const { container } = render(
      withTheme(
        <KPITile label="L" value="1.14" trend="down" trendValue="0.03" />,
      ),
    );
    expect(container.textContent).toContain("↓");
    expect(container.textContent).toContain("0.03");
  });

  it("invokes onPress when pressed", () => {
    const onPress = jest.fn();
    const { container } = render(
      withTheme(<KPITile label="L" value="1" onPress={onPress} />),
    );
    const root = container.querySelector('[data-comp="KPITile"]');
    expect(root).not.toBeNull();
    fireEvent.click(root as Element);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("sets data-comp + data-interactive flags", () => {
    const { container } = render(
      withTheme(<KPITile label="L" value="1" onPress={() => {}} />),
    );
    const root = container.querySelector('[data-comp="KPITile"]');
    expect(root?.getAttribute("data-interactive")).toBe("true");
  });
});
