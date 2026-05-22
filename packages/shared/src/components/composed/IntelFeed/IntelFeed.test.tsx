/** Tests for the intel feed UI. AAA pattern. */

import React from "react";
import { render } from "@testing-library/react";
import { HeadlineStrip, AgentToolCardRow } from "./IntelFeed";
import { ThemeProvider } from "../../../theme/ThemeProvider";
import type { IntelHeadline } from "../../../data/analyst/intelFeed";

function withTheme(node: React.ReactElement): React.ReactElement {
  return <ThemeProvider>{node}</ThemeProvider>;
}

const FEED: IntelHeadline[] = [
  { source: "market", label: "gridstatus.io", category: "Markets", headline: "ERCOT LMP $312" },
  { source: "news", label: "Energy News", category: "Energy news", headline: "EIA gas draw widens" },
];

describe("HeadlineStrip", () => {
  it("renders the first headline", () => {
    const { container } = render(withTheme(<HeadlineStrip headlines={FEED} />));
    expect(container.textContent).toContain("gridstatus.io");
    expect(container.textContent).toContain("ERCOT LMP $312");
  });

  it("renders nothing when the feed is empty", () => {
    const { container } = render(withTheme(<HeadlineStrip headlines={[]} />));
    expect(container.querySelector('[data-comp="HeadlineStrip"]')).toBeNull();
  });
});

describe("AgentToolCardRow", () => {
  it("renders a card per headline", () => {
    const { container } = render(withTheme(<AgentToolCardRow headlines={FEED} />));
    expect(container.textContent).toContain("ERCOT LMP $312");
    expect(container.textContent).toContain("EIA gas draw widens");
  });

  it("renders nothing when the feed is empty", () => {
    const { container } = render(withTheme(<AgentToolCardRow headlines={[]} />));
    expect(container.querySelector('[data-comp="AgentToolCardRow"]')).toBeNull();
  });
});
