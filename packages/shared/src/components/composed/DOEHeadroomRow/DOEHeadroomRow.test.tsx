/**
 * Tests for canonical DOEHeadroomRow.
 */

import React from "react";
import { render } from "@testing-library/react";
import { DOEHeadroomRow } from "./DOEHeadroomRow";
import { ThemeProvider } from "../../../theme/ThemeProvider";

function withTheme(node: React.ReactElement): React.ReactElement {
  return <ThemeProvider>{node}</ThemeProvider>;
}

describe("DOEHeadroomRow", () => {
  it("strip · ok renders direction + headroom magnitude", () => {
    const { container } = render(
      withTheme(
        <DOEHeadroomRow variant="strip" state="ok" direction="IMP" headroom="3.2 MW" />,
      ),
    );
    expect(container.textContent).toContain("GRID");
    expect(container.textContent).toContain("IMP");
    expect(container.textContent).toContain("3.2 MW");
  });

  it("strip · island shows ISLAND only — no headroom value", () => {
    const { container } = render(
      withTheme(<DOEHeadroomRow variant="strip" state="island" />),
    );
    expect(container.textContent).toContain("ISLAND");
    expect(container.textContent).not.toContain("MW");
  });

  it("stranded · ok renders Grid label + used bar", () => {
    const { container } = render(
      withTheme(
        <DOEHeadroomRow
          variant="stranded"
          state="ok"
          direction="IMP"
          headroom="3.2 MW"
          usedFraction={0.64}
        />,
      ),
    );
    expect(container.textContent).toContain("Grid");
    expect(container.textContent).toContain("3.2 MW IMP free");
  });

  it("stranded · island renders the n/a label, no fill bar", () => {
    const { container } = render(
      withTheme(<DOEHeadroomRow variant="stranded" state="island" />),
    );
    expect(container.textContent).toContain("ISLAND · n/a");
  });

  it("controls · ok shows IMP + EXP both directions always", () => {
    const { container } = render(
      withTheme(
        <DOEHeadroomRow
          variant="controls"
          state="ok"
          headroom="3.2 MW"
          counterHeadroom="0.0 MW"
        />,
      ),
    );
    expect(container.textContent).toContain("DOE HEADROOM");
    expect(container.textContent).toContain("IMP");
    expect(container.textContent).toContain("3.2 MW");
    expect(container.textContent).toContain("EXP");
    expect(container.textContent).toContain("0.0 MW");
  });

  it("controls · island shows the static ISLAND MODE label (not em-dash)", () => {
    const { container } = render(
      withTheme(<DOEHeadroomRow variant="controls" state="island" />),
    );
    expect(container.textContent).toContain("ISLAND MODE");
    expect(container.textContent).toContain("no utility coordination");
    expect(container.textContent).not.toContain("—");
  });

  it("controls · stale shows the UTILITY FEED STALE banner", () => {
    const { container } = render(
      withTheme(<DOEHeadroomRow variant="controls" state="stale" />),
    );
    expect(container.textContent).toContain("UTILITY FEED STALE");
    expect(container.textContent).toContain("Limits unknown");
  });
});
