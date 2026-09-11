/** Tests for DER format helpers. AAA. */

import { formatDerTarget, formatExportCap, isTrackingCommand } from "./format";

describe("formatDerTarget", () => {
  it("labels a negative target as absorb", () => {
    expect(formatDerTarget(-1_200_000)).toBe("1.2 MW absorb");
  });

  it("labels a positive target as export", () => {
    expect(formatDerTarget(820_000)).toBe("820 kW export");
  });

  it("renders zero plainly", () => {
    expect(formatDerTarget(0)).toBe("0 kW");
  });
});

describe("formatExportCap", () => {
  it("renders a magnitude with no sign or direction word", () => {
    expect(formatExportCap(300_000)).toBe("300 kW");
  });
});

describe("isTrackingCommand", () => {
  it("is false with no actual reading yet", () => {
    expect(isTrackingCommand(-1_200_000, null)).toBe(false);
  });

  it("is true when actual is within tolerance of commanded", () => {
    expect(isTrackingCommand(-1_200_000, -1_150_000)).toBe(true);
  });

  it("is false when actual drifts past tolerance", () => {
    expect(isTrackingCommand(-1_200_000, -600_000)).toBe(false);
  });
});
