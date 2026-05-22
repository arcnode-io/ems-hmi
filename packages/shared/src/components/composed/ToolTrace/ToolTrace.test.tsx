/** Tests for ToolTrace — live + completed forms. AAA pattern. */

import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { LiveToolTrace, CompletedToolTrace } from "./ToolTrace";
import { ThemeProvider } from "../../../theme/ThemeProvider";
import type { TraceStep } from "../../../data/analyst/conversation.types";
import type { AnalystToolCall } from "../../../data/analyst/types";

function withTheme(node: React.ReactElement): React.ReactElement {
  return <ThemeProvider>{node}</ThemeProvider>;
}

const STEPS: TraceStep[] = [
  { seq: 1, tool: "describe_site", label: "Inventorying site", status: "done", ms: 480 },
  { seq: 2, tool: "query_timeseries", label: "Querying historian", status: "running" },
];

const TRACE: AnalystToolCall[] = [
  { tool: "describe_site", args: {}, outcome: "ok", ms: 480, label: "Inventorying site" },
  { tool: "query_timeseries", args: {}, outcome: "ok", ms: 1200, label: "Querying historian" },
];

describe("LiveToolTrace", () => {
  it("renders a row per step with tool + label", () => {
    const { container } = render(withTheme(<LiveToolTrace steps={STEPS} />));
    expect(container.textContent).toContain("describe_site");
    expect(container.textContent).toContain("Inventorying site");
    expect(container.textContent).toContain("Querying historian");
  });
});

describe("CompletedToolTrace", () => {
  it("collapses to a step-count summary, hiding the rows", () => {
    const { getByText, queryByText } = render(
      withTheme(<CompletedToolTrace trace={TRACE} />),
    );
    expect(getByText(/agent · 2 steps · 1\.7s/)).toBeTruthy();
    expect(queryByText("Inventorying site")).toBeNull();
  });

  it("expands to the full step list on press", () => {
    const { getByText, queryByText } = render(
      withTheme(<CompletedToolTrace trace={TRACE} />),
    );
    fireEvent.click(getByText(/agent · 2 steps/));
    expect(queryByText("Inventorying site")).toBeTruthy();
  });

  it("renders nothing for an empty trace", () => {
    const { container } = render(withTheme(<CompletedToolTrace trace={[]} />));
    expect(
      container.querySelector('[data-comp="CompletedToolTrace"]'),
    ).toBeNull();
  });
});
