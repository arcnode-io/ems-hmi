/**
 * Tests for buildDecisionRecord — the deterministic "why this action"
 * explanation derived from an autopilot proposal + live SoC + the demo
 * forecast. AAA pattern. All numbers are pure functions of the inputs.
 */

import { buildDecisionRecord, peakPriceWindow } from "./decisionRecord";
import type { DispatchForecastPoint } from "./dispatchForecast";
import type { DispatchProposal } from "./dispatch.types";

const DISCHARGE: DispatchProposal = {
  deviceId: "bess_module_01",
  setpointKw: 1620,
  priceUsdPerMwh: 78,
  reason: "Peak-price arbitrage",
};

// Small hand-checkable curve: peak of 100 sits at min 20, tapering both sides.
const FORECAST: DispatchForecastPoint[] = [
  { minFromNow: 0, priceUsdPerMwh: 40, plannedBessKw: 0 },
  { minFromNow: 5, priceUsdPerMwh: 55, plannedBessKw: 800 },
  { minFromNow: 10, priceUsdPerMwh: 78, plannedBessKw: 1400 },
  { minFromNow: 15, priceUsdPerMwh: 94, plannedBessKw: 1700 },
  { minFromNow: 20, priceUsdPerMwh: 100, plannedBessKw: 1800 },
  { minFromNow: 25, priceUsdPerMwh: 92, plannedBessKw: 1650 },
  { minFromNow: 30, priceUsdPerMwh: 70, plannedBessKw: 1200 },
  { minFromNow: 35, priceUsdPerMwh: 48, plannedBessKw: 400 },
];

const OPTS = {
  forecast: FORECAST,
  chargeFloorUsdPerMwh: 22,
  socFloorPct: 20,
  powerLimitKw: 1800,
  windowHours: 1.5,
} as const;

describe("peakPriceWindow", () => {
  it("returns the contiguous high-price span around the forecast peak", () => {
    // Act
    const window = peakPriceWindow(FORECAST);

    // Assert — the $92-100 shoulder around min 20, not the $40-55 ramp
    expect(window.startMin).toBe(15);
    expect(window.endMin).toBe(25);
    expect(window.peakPriceUsdPerMwh).toBe(100);
  });
});

describe("buildDecisionRecord — discharge", () => {
  it("explains a discharge as arbitrage against the charge-cost floor", () => {
    // Act
    const record = buildDecisionRecord(DISCHARGE, 57, OPTS);

    // Assert
    expect(record.action).toBe("Discharge");
    expect(record.setpointKw).toBe(1620);
    expect(record.spreadUsdPerMwh).toBe(56); // 78 clearing − 22 floor
    expect(record.socHeadroomPct).toBe(37); // 57 − 20 floor
    expect(record.energyMwh).toBeCloseTo(2.43, 2); // 1.62 MW · 1.5 h
    expect(record.grossRevenueUsd).toBeCloseTo(189.54, 1); // 2.43 · 78
    expect(record.netProfitUsd).toBeCloseTo(136.08, 1); // 2.43 · 56
    expect(record.windowLabel).toBe("T+15–25 min");
    expect(record.rationale).toContain("Discharge");
    expect(record.drivers.length).toBeGreaterThanOrEqual(3);
  });
});

describe("buildDecisionRecord — charge", () => {
  it("frames a charge by the expected round-trip to the forecast peak", () => {
    // Arrange — buying at $30, forecast peak is $100
    const charge: DispatchProposal = {
      ...DISCHARGE,
      setpointKw: -1500,
      priceUsdPerMwh: 30,
    };

    // Act
    const record = buildDecisionRecord(charge, 40, OPTS);

    // Assert
    expect(record.action).toBe("Charge");
    expect(record.rationale.toLowerCase()).toContain("bank");
    expect(record.energyMwh).toBeCloseTo(2.25, 2); // |−1.5 MW| · 1.5 h
    expect(record.spreadUsdPerMwh).toBe(70); // 100 peak − 30 buy
    expect(record.grossRevenueUsd).toBe(0); // a charge earns nothing now
    expect(record.netProfitUsd).toBeCloseTo(157.5, 1); // 2.25 · 70 expected
  });
});

describe("buildDecisionRecord — hold", () => {
  it("returns a minimal record for a zero setpoint", () => {
    // Arrange
    const hold: DispatchProposal = { ...DISCHARGE, setpointKw: 0 };

    // Act
    const record = buildDecisionRecord(hold, 55, OPTS);

    // Assert
    expect(record.action).toBe("Hold");
    expect(record.netProfitUsd).toBe(0);
  });
});
