/** Tests for ConfirmationModal composed component. AAA pattern. */

import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { ConfirmationModal } from "./ConfirmationModal";
import { ThemeProvider } from "../../../theme/ThemeProvider";
import type { ConfirmationModalProps } from "./ConfirmationModal.types";

function withTheme(node: React.ReactElement): React.ReactElement {
  return <ThemeProvider>{node}</ThemeProvider>;
}

const BASE_PROPS: ConfirmationModalProps = {
  visible: true,
  commandSummary: "Discharge 1620 kW",
  targetDevices: [
    { id: "bess_module_01", name: "BESS Module 01", currentState: "SoC 70%" },
  ],
  onConfirm: () => undefined,
  onCancel: () => undefined,
};

describe("ConfirmationModal", () => {
  it("renders the command summary + target device when visible", () => {
    const { getByText } = render(
      withTheme(<ConfirmationModal {...BASE_PROPS} />),
    );
    expect(getByText("Discharge 1620 kW")).toBeTruthy();
    expect(getByText("BESS Module 01")).toBeTruthy();
    expect(getByText("SoC 70%")).toBeTruthy();
  });

  it("shows the SIMULATED band only in sim mode", () => {
    const live = render(
      withTheme(<ConfirmationModal {...BASE_PROPS} simMode={false} />),
    );
    expect(live.queryByText("SIMULATED")).toBeNull();

    const sim = render(
      withTheme(<ConfirmationModal {...BASE_PROPS} simMode={true} />),
    );
    expect(sim.getByText("SIMULATED")).toBeTruthy();
  });

  it("invokes onConfirm when Send is pressed", () => {
    const onConfirm = jest.fn();
    const { getByText } = render(
      withTheme(<ConfirmationModal {...BASE_PROPS} onConfirm={onConfirm} />),
    );
    fireEvent.click(getByText("Send"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("invokes onCancel when Cancel is pressed", () => {
    const onCancel = jest.fn();
    const { getByText } = render(
      withTheme(<ConfirmationModal {...BASE_PROPS} onCancel={onCancel} />),
    );
    fireEvent.click(getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
