/** Tests for dispatch display formatters. AAA pattern. */

import { formatSetpoint } from "./format";

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
