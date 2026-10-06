/** ReserveControl — operator battery reserve: shown in MWh, sent in Wh, only after confirm. AAA. */

import React from "react";
import { act, fireEvent } from "@testing-library/react";
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
  it("Edit → nudge with + → Review → Send publishes the value in Wh, and nothing before Send", () => {
    // Arrange
    const published: Published = [];
    const { getByText, getByTestId } = renderWithScreen(<ReserveControl gpusCapped={false} />, published, { [STATE]: 2_000_000 }, VIEW);
    const shown = getByTestId("reserve-value").textContent;

    // Act
    fireEvent.click(getByTestId("reserve-edit"));
    fireEvent.click(getByTestId("reserve-up"));
    fireEvent.click(getByText("Review"));
    const beforeConfirm = published.length;
    fireEvent.click(getByText("Send"));

    // Assert
    expect({ shown, beforeConfirm, sent: published[0] }).toEqual({
      shown: "2.0 MWh",
      beforeConfirm: 0,
      sent: [COMMAND, expect.objectContaining({ value: 2_500_000 })],
    });
  });

  it("accepts a typed value, clamped to the pack", () => {
    // Arrange
    const published: Published = [];
    const { getByText, getByTestId } = renderWithScreen(<ReserveControl gpusCapped={false} />, published, { [STATE]: 0 }, VIEW);
    fireEvent.click(getByTestId("reserve-edit"));

    // Act
    fireEvent.change(getByTestId("reserve-input"), { target: { value: "6" } });
    fireEvent.click(getByText("Review"));
    fireEvent.click(getByText("Send"));
    fireEvent.click(getByTestId("reserve-edit"));
    fireEvent.change(getByTestId("reserve-input"), { target: { value: "99" } });
    fireEvent.click(getByText("Review"));
    fireEvent.click(getByText("Send"));

    // Assert — 8 MWh pack
    expect(published.map(([, msg]) => msg.value)).toEqual([6_000_000, 8_000_000]);
  });

  it("is read-only on phones and absent where the template has no operator_reserve", () => {
    // Arrange
    layout = "phone";
    const phone = renderWithScreen(<ReserveControl gpusCapped={false} />, [], { [STATE]: 0 }, VIEW);
    const phoneButtons = phone.queryByTestId("reserve-edit");
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

  it("shows waiting until the controller echoes the value, then clears", () => {
    // Arrange — live controller: the set command echoes onto the state topic
    const { getByTestId, getByText, queryByText } = renderWithScreen(<ReserveControl gpusCapped={false} />, [], { [STATE]: 0 }, VIEW, { [COMMAND]: STATE });
    fireEvent.click(getByTestId("reserve-edit"));
    fireEvent.click(getByTestId("reserve-up"));

    // Act
    fireEvent.click(getByText("Review"));
    fireEvent.click(getByText("Send"));

    // Assert — the echo landed synchronously, so no waiting text remains
    expect([getByTestId("reserve-value").textContent, queryByText(/Waiting for controller/), queryByText(/Not confirmed/)]).toEqual(["0.5 MWh", null, null]);
  });

  it("flags a command the controller never confirms after 10 s", () => {
    // Arrange — dead controller: no echo
    jest.useFakeTimers();
    const { getByTestId, getByText, queryByText } = renderWithScreen(<ReserveControl gpusCapped={false} />, [], { [STATE]: 0 }, VIEW);
    fireEvent.click(getByTestId("reserve-edit"));
    fireEvent.click(getByTestId("reserve-up"));
    fireEvent.click(getByText("Review"));
    fireEvent.click(getByText("Send"));
    const waiting = queryByText(/Waiting for controller/) !== null;

    // Act
    act(() => { jest.advanceTimersByTime(10_000); });

    // Assert
    expect([waiting, queryByText(/Not confirmed by controller · sent 0.5 MWh/) !== null, getByTestId("reserve-value").textContent]).toEqual([true, true, "0.0 MWh"]);
    jest.useRealTimers();
  });

  it("always states minimum SoC under the input, and explains it on request", () => {
    // Arrange
    const { getByTestId, queryByText } = renderWithScreen(<ReserveControl gpusCapped={false} />, [], { [STATE]: 0 }, VIEW);
    fireEvent.click(getByTestId("reserve-edit"));
    const stated = queryByText("Minimum SoC: 2.4 MWh") !== null;
    const hiddenAtFirst = queryByText(/lowest state of charge/) === null;

    // Act
    fireEvent.click(getByTestId("min-soc-info"));

    // Assert — VIEW: supplier floor 2.36 MWh = 29.5 %
    expect([stated, hiddenAtFirst, queryByText(/lowest state of charge the battery supplier's warranty allows — 2\.4 MWh \(30%\) here/) !== null]).toEqual([true, true, true]);
  });

  it("the second confirmation states the action and the GPU impact", () => {
    // Arrange
    const { getByTestId, getByText, queryByText } = renderWithScreen(<ReserveControl gpusCapped={false} />, [], { [STATE]: 2_000_000 }, VIEW);
    fireEvent.click(getByTestId("reserve-edit"));
    fireEvent.click(getByTestId("reserve-up"));

    // Act
    fireEvent.click(getByText("Review"));

    // Assert
    expect([
      queryByText("Set battery reserve to 2.5 MWh") !== null,
      queryByText("During curtailment at this reserve, GPU performance will be affected") !== null,
    ]).toEqual([true, true]);
  });

  it("states the range with the pack size rounded like every other MWh value", () => {
    // Arrange — ems.arcnode.io's pack is 7.708 MWh; raw it read "0–7.708"
    const odd: TopologyViewType = { ...VIEW, bess: { pack_mwh: 7.708, reserve_floor_mwh: 2.36, reserve_floor_pct: 30.6 } };
    const { getByTestId, queryByText } = renderWithScreen(<ReserveControl gpusCapped={false} />, [], { [STATE]: 0 }, odd);

    // Act
    fireEvent.click(getByTestId("reserve-edit"));

    // Assert
    expect(queryByText("MWh (0–7.7)") !== null).toBe(true);
  });
});
