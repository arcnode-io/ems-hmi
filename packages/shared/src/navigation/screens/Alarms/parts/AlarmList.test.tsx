import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "../../../../theme/ThemeProvider";
import type { ActiveAlarm } from "../../../../data/alarms/useAlarms";
import type { SiteHealth } from "../../../../data/alarms/siteHealth";
import { AlarmList } from "./AlarmList";

const PDU_ALARM: ActiveAlarm = {
  deviceId: "pdu_1",
  deviceDisplayName: "pdu_1",
  measurementName: "input_voltage_l1",
  measurementLabel: "Input Voltage L1-L2",
  severity: "alarm",
  displayValue: "240.00 volts",
  limitLabel: "below 381 volts",
  ts: new Date().toISOString(),
};

const ALARMING: SiteHealth = { level: "alarm", alarmCount: 1, warnCount: 0, reason: null };

function renderList(alarms: ActiveAlarm[], health: SiteHealth, onOpen = jest.fn()): HTMLElement {
  return render(
    <ThemeProvider>
      <AlarmList alarms={alarms} health={health} onOpen={onOpen} />
    </ThemeProvider>,
  ).container;
}

describe("AlarmList", () => {
  it("shows each alarm's device, reading, value and the limit it broke", () => {
    // Arrange / Act
    const container = renderList([PDU_ALARM], ALARMING);

    // Assert
    expect(
      ["pdu_1", "Input Voltage L1-L2", "240.00 volts", "below 381 volts"].map((text) =>
        (container.textContent ?? "").includes(text),
      ),
    ).toEqual([true, true, true, true]);
  });

  it("opens the alarming device when a row is pressed", () => {
    // Arrange
    const onOpen = jest.fn();
    renderList([PDU_ALARM], ALARMING, onOpen);

    // Act
    fireEvent.click(screen.getByRole("link", { name: "pdu_1 · Input Voltage L1-L2" }));

    // Assert
    expect(onOpen.mock.calls).toEqual([["pdu_1"]]);
  });

  it("says nothing is alarming only when every monitored reading has reported", () => {
    // Arrange / Act
    const container = renderList([], { level: "nominal", alarmCount: 0, warnCount: 0, reason: null });

    // Assert
    expect(container.textContent).toContain("No active alarms");
  });

  it("says status is unknown, and why, when readings are missing", () => {
    // Arrange / Act
    const container = renderList([], {
      level: "unknown", alarmCount: 0, warnCount: 0, reason: { kind: "partial", reporting: 3, watched: 40 },
    });

    // Assert
    expect([
      (container.textContent ?? "").includes("No active alarms"),
      (container.textContent ?? "").includes("3 of 40 monitored readings reporting"),
    ]).toEqual([false, true]);
  });
});
