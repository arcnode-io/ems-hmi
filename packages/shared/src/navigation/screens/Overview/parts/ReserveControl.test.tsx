/**
 * ReserveControl — operator reserve, shown as MWh ABOVE minimum SoC (0 = use the
 * battery down to minimum SoC), sent as the absolute Wh the controller stores,
 * only after Review → Send. AAA.
 */

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

// 8 MWh pack, minimum SoC 2.36 → 0–5.6 MWh above it. 71% charged, 1.12 MW site load.
const LIVE = { socPct: 71, siteLoadW: 1_120_000 };
const control = (gpusCapped = false): React.ReactElement => <ReserveControl gpusCapped={gpusCapped} live={LIVE} />;

beforeEach(() => {
  layout = "desktop";
});

describe("ReserveControl", () => {
  it("shows the stored reserve as MWh above minimum SoC — a stored value at or below it reads 0", () => {
    // Arrange / Act
    const low = renderWithScreen(control(), [], { [STATE]: 0 }, VIEW);
    const lowValue = low.getByTestId("reserve-value").textContent;
    low.unmount();
    const high = renderWithScreen(control(), [], { [STATE]: 5_360_000 }, VIEW);

    // Assert
    expect([lowValue, high.getByTestId("reserve-value").textContent]).toEqual(["0.0 MWh", "3.0 MWh"]);
  });

  it("Edit → + → Review → Send publishes the absolute reserve in Wh, nothing before Send", () => {
    // Arrange
    const published: Published = [];
    const { getByText, getByTestId } = renderWithScreen(control(), published, { [STATE]: 0 }, VIEW);

    // Act
    fireEvent.click(getByTestId("reserve-edit"));
    fireEvent.click(getByTestId("reserve-up"));
    fireEvent.click(getByText("Review"));
    const beforeConfirm = published.length;
    fireEvent.click(getByText("Send"));

    // Assert — 0.5 above a 2.36 floor
    expect({ beforeConfirm, sent: published[0] }).toEqual({
      beforeConfirm: 0,
      sent: [COMMAND, expect.objectContaining({ value: 2_860_000 })],
    });
  });

  it("accepts a typed value above minimum SoC, clamped to the usable range", () => {
    // Arrange
    const published: Published = [];
    const { getByText, getByTestId } = renderWithScreen(control(), published, { [STATE]: 0 }, VIEW);
    const send = (typed: string): void => {
      fireEvent.click(getByTestId("reserve-edit"));
      fireEvent.change(getByTestId("reserve-input"), { target: { value: typed } });
      fireEvent.click(getByText("Review"));
      fireEvent.click(getByText("Send"));
    };

    // Act
    send("3");
    send("99");

    // Assert — 2.36 + 3; and the full pack
    expect(published.map(([, msg]) => msg.value)).toEqual([5_360_000, 8_000_000]);
  });

  it("states the usable range, not the absolute pack", () => {
    // Arrange
    const { getByTestId, queryByText } = renderWithScreen(control(), [], { [STATE]: 0 }, VIEW);

    // Act
    fireEvent.click(getByTestId("reserve-edit"));

    // Assert — 8 − 2.36
    expect(queryByText("MWh (0–5.6)") !== null).toBe(true);
  });

  it("shows, live, how long a full curtailment is covered before GPUs throttle", () => {
    // Arrange
    const { getByTestId, getByText } = renderWithScreen(control(), [], { [STATE]: 0 }, VIEW);
    fireEvent.click(getByTestId("reserve-edit"));
    const atZero = getByTestId("reserve-cover").textContent;

    // Act
    fireEvent.change(getByTestId("reserve-input"), { target: { value: "3" } });
    const atThree = getByTestId("reserve-cover").textContent;
    fireEvent.change(getByTestId("reserve-input"), { target: { value: "5" } });

    // Assert — (5.68−2.36)/1.12 h, (5.68−5.36)/1.12 h, nothing left
    expect([atZero, atThree, getByText(/throttle as soon as/) !== null]).toEqual([
      "Covers ~3.0 h of full curtailment before GPUs throttle",
      "Covers ~17 min of full curtailment before GPUs throttle",
      true,
    ]);
  });

  it("the confirmation states the action and the GPU impact", () => {
    // Arrange
    const { getByTestId, getByText, queryByText } = renderWithScreen(control(), [], { [STATE]: 0 }, VIEW);
    fireEvent.click(getByTestId("reserve-edit"));
    fireEvent.click(getByTestId("reserve-up"));

    // Act
    fireEvent.click(getByText("Review"));

    // Assert
    expect([
      queryByText("Set battery reserve to 0.5 MWh") !== null,
      queryByText("During curtailment at this reserve, GPU performance will be affected") !== null,
    ]).toEqual([true, true]);
  });

  it("is read-only on phones and absent where the template has no operator_reserve", () => {
    // Arrange
    layout = "phone";
    const phone = renderWithScreen(control(), [], { [STATE]: 0 }, VIEW);
    const phoneButtons = phone.queryByTestId("reserve-edit");
    phone.unmount();
    layout = "desktop";

    // Act
    const unsupported = renderWithScreen(control(), []);

    // Assert
    expect([phoneButtons, unsupported.container.textContent]).toEqual([null, ""]);
  });

  it("warns only while a curtailment has GPUs capped — never in Demo A where nothing is", () => {
    // Arrange / Act
    const shown = (capped: boolean, active: boolean): boolean => {
      const view = renderWithScreen(control(capped), [], { [STATE]: 6_000_000, [EVENT_ACTIVE]: active }, VIEW);
      const hit = view.queryByText(NOTE) !== null;
      view.unmount();
      return hit;
    };

    // Assert — [capped+active, uncapped+active (Demo A), capped+idle]
    expect([shown(true, true), shown(false, true), shown(true, false)]).toEqual([true, false, false]);
  });

  it("shows waiting until the controller echoes the value, then clears", () => {
    // Arrange — live controller: the set command echoes onto the state topic
    const { getByTestId, getByText, queryByText } = renderWithScreen(control(), [], { [STATE]: 0 }, VIEW, { [COMMAND]: STATE });
    fireEvent.click(getByTestId("reserve-edit"));
    fireEvent.click(getByTestId("reserve-up"));
    fireEvent.click(getByText("Review"));

    // Act
    fireEvent.click(getByText("Send"));

    // Assert
    expect([getByTestId("reserve-value").textContent, queryByText(/Waiting for controller/), queryByText(/Not confirmed/)]).toEqual(["0.5 MWh", null, null]);
  });

  it("flags a command the controller never confirms after 10 s", () => {
    // Arrange — dead controller: no echo
    jest.useFakeTimers();
    const { getByTestId, getByText, queryByText } = renderWithScreen(control(), [], { [STATE]: 0 }, VIEW);
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
});
