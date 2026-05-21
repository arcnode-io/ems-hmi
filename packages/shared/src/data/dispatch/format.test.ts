/** Tests for dispatch display formatters. AAA pattern. */

import { formatSetpoint, formatUsd, formatCountdown } from "./format";

describe("formatSetpoint", () => {
  it("labels a positive setpoint as discharge", () => {
    expect(formatSetpoint(1620)).toBe("Discharge 1620 kW");
  });

  it("labels a negative setpoint as charge with a positive magnitude", () => {
    expect(formatSetpoint(-300)).toBe("Charge 300 kW");
  });

  it("labels a zero setpoint as idle", () => {
    expect(formatSetpoint(0)).toBe("Idle");
  });
});

describe("formatUsd", () => {
  it("rounds to whole dollars", () => {
    expect(formatUsd(420.75)).toBe("$421");
  });
});

describe("formatCountdown", () => {
  it("formats seconds as M:SS", () => {
    expect(formatCountdown(95)).toBe("1:35");
  });

  it("floors negative input at 0:00", () => {
    expect(formatCountdown(-5)).toBe("0:00");
  });
});
