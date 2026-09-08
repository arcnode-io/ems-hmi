/** Tests for DecisionRecordView — the pure "why this action" presenter. AAA. */

import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { DecisionRecordView } from "./DecisionRecord";
import { ThemeProvider } from "../../../theme/ThemeProvider";
import { buildDecisionRecord } from "../../../data/dispatch/decisionRecord";
import type { DispatchProposal } from "../../../data/dispatch/dispatch.types";

function withTheme(node: React.ReactElement): React.ReactElement {
  return <ThemeProvider>{node}</ThemeProvider>;
}

const DISCHARGE: DispatchProposal = {
  deviceId: "bess_module_01",
  setpointKw: 1620,
  priceUsdPerMwh: 78,
  reason: "Peak-price arbitrage",
};

describe("DecisionRecordView", () => {
  it("renders the rationale and every cited driver", () => {
    // Arrange
    const record = buildDecisionRecord(DISCHARGE, 57);

    // Act
    const { getByText } = render(withTheme(<DecisionRecordView record={record} />));

    // Assert
    expect(getByText(record.rationale)).toBeTruthy();
    for (const driver of record.drivers) {
      expect(getByText(driver)).toBeTruthy();
    }
  });

  it("shows the Ask the Analyst button only when a handler is given", () => {
    // Arrange
    const record = buildDecisionRecord(DISCHARGE, 57);
    const onAsk = jest.fn();

    // Act + Assert — no handler → no button
    const withoutHandler = render(
      withTheme(<DecisionRecordView record={record} />),
    );
    expect(withoutHandler.queryByText("Ask the Analyst →")).toBeNull();

    // Act + Assert — handler → button fires it
    const withHandler = render(
      withTheme(<DecisionRecordView record={record} onAskAnalyst={onAsk} />),
    );
    fireEvent.click(withHandler.getByText("Ask the Analyst →"));
    expect(onAsk).toHaveBeenCalledTimes(1);
  });
});
