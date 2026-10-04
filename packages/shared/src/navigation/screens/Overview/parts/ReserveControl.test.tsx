/** ReserveControl — operator battery reserve: shown in MWh, sent in Wh, only after confirm. AAA. */

import React from "react";
import { fireEvent } from "@testing-library/react";
import { ReserveControl } from "./ReserveControl";
import { BASE_VIEW, renderWithScreen, SITE_ID, type Published } from "../../screenTestHarness";
import type { TopologyViewType } from "../../../../data/topology/topology.schema";

// Reason: RN-web reports a 0-width window under jsdom (always "phone"); drive the layout explicitly.
let layout: "desktop" | "phone" = "desktop";
jest.mock("../../../../hooks/useBreakpoint", () => ({ useBreakpoint: () => ({ layout }) }));

const STATE = `sites/${SITE_ID}/devices/der_dispatch/measurements/operator_reserve/watt_hours`;
const EVENT_ACTIVE = `sites/${SITE_ID}/devices/der_dispatch/measurements/event_active/none`;
const NOTE = "GPU caps hold until this curtailment ends — set the reserve before one starts.";
const COMMAND = `sites/${SITE_ID}/devices/der_dispatch/commands/set/operator_reserve/watt_hours`;

const VIEW: TopologyViewType = {
  ...BASE_VIEW,
  bess: { pack_mwh: 8, reserve_floor_mwh: 2.36, reserve_floor_pct: 29.5 },
  templates_used: {
    der_dispatch: {
      template: "der_dispatch", kind: "leaf", equipment_id: null, vendor: null, model: null, description: "", commands: {},
      measurements: {
        operator_reserve: { unit: "watt_hours", type: "float", poll_rate_hz: null, display_name_default: null, iec_61850_ref: null, bounds: null, thresholds: null, values: null },
        event_active: { unit: "none", type: "bool", poll_rate_hz: null, display_name_default: null, iec_61850_ref: null, bounds: null, thresholds: null, values: null },
      },
    },
  },
};

beforeEach(() => {
  layout = "desktop";
});

describe("ReserveControl", () => {
  it("shows the retained reserve and publishes the stepped value in Wh only after confirm", () => {
    // Arrange
    const published: Published = [];
    const { getByText, getByTestId } = renderWithScreen(<ReserveControl gpusCapped={false} />, published, { [STATE]: 2_000_000 }, VIEW);
    const shown = getByTestId("reserve-value").textContent;

    // Act
    fireEvent.click(getByTestId("reserve-up"));
    fireEvent.click(getByText("Set"));
    const beforeConfirm = published.length;
    fireEvent.click(getByText("Send"));

    // Assert
    expect({ shown, beforeConfirm, sent: published[0] }).toEqual({
      shown: "2.0 MWh",
      beforeConfirm: 0,
      sent: [COMMAND, expect.objectContaining({ value: 2_500_000 })],
    });
  });

  it("is read-only on phones and absent where the template has no operator_reserve", () => {
    // Arrange
    layout = "phone";
    const phone = renderWithScreen(<ReserveControl gpusCapped={false} />, [], { [STATE]: 0 }, VIEW);
    const phoneButtons = phone.queryByTestId("reserve-up");
    phone.unmount();
    layout = "desktop";

    // Act
    const unsupported = renderWithScreen(<ReserveControl gpusCapped={false} />, []);

    // Assert
    expect([phoneButtons, unsupported.container.textContent]).toEqual([null, ""]);
  });

  it("warns only while a curtailment has GPUs capped — never in Demo A where nothing is", () => {
    // Arrange / Act
    const shown = (capped: boolean, active: boolean): boolean => {
      const view = renderWithScreen(<ReserveControl gpusCapped={capped} />, [], { [STATE]: 6_000_000, [EVENT_ACTIVE]: active }, VIEW);
      const hit = view.queryByText(NOTE) !== null;
      view.unmount();
      return hit;
    };

    // Assert — [capped+active, uncapped+active (Demo A), capped+idle]
    expect([shown(true, true), shown(false, true), shown(true, false)]).toEqual([true, false, false]);
  });
});
