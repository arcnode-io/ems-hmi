import { envelopeFrom, isAtLimit, isOverLimit } from "./useOperatingEnvelope";

describe("envelopeFrom", () => {
  it("passes limits + headroom through and derives used fraction from them", () => {
    // Arrange — 600 kW limit, 150 kW headroom left → 450 kW used = 75%
    const raw = {
      importLimitW: 600_000,
      exportLimitW: 0,
      importHeadroomW: 150_000,
      exportHeadroomW: 450_000,
      status: "OK",
    };

    // Act
    const env = envelopeFrom(raw);

    // Assert
    expect(env).toEqual({
      status: "ok",
      importLimitW: 600_000,
      exportLimitW: 0,
      importHeadroomW: 150_000,
      exportHeadroomW: 450_000,
      usedFraction: 0.75,
    });
  });

  it("maps STALE and reads a missing status as null, not stale", () => {
    // Arrange
    const base = { importLimitW: null, exportLimitW: null, importHeadroomW: null, exportHeadroomW: null };

    // Act
    const stale = envelopeFrom({ ...base, status: "STALE" }).status;
    const nothingYet = envelopeFrom({ ...base, status: undefined }).status;

    // Assert
    expect([stale, nothingYet]).toEqual(["stale", null]);
  });

  it("clamps used fraction to [0,1] and nulls it on a zero limit with nothing flowing", () => {
    // Arrange
    const over = { importLimitW: 100, exportLimitW: 0, importHeadroomW: -50, exportHeadroomW: 0, status: "OK" };
    const zero = { ...over, importLimitW: 0, importHeadroomW: 0 };

    // Act
    const fractions = [envelopeFrom(over).usedFraction, envelopeFrom(zero).usedFraction];

    // Assert
    expect(fractions).toEqual([1, null]);
  });

  it("reads negative headroom as the limit fully used, even at a zero limit", () => {
    // Arrange — live stack: envelope closed to 0 W, site importing 1.12 MW
    const over = { importLimitW: 0, exportLimitW: 0, importHeadroomW: -1_120_000, exportHeadroomW: 1_120_000, status: "OK" };

    // Act
    const used = envelopeFrom(over).usedFraction;

    // Assert
    expect(used).toBe(1);
  });
});

describe("isOverLimit", () => {
  it("ignores control-loop jitter under 2 kW past the limit (measured −930 W)", () => {
    // Arrange / Act
    const verdicts = [-57, -930, -1_999, -2_000, -492_800, 0, 150_000].map(isOverLimit);

    // Assert
    expect(verdicts).toEqual([false, false, false, true, true, false, false]);
  });
});

describe("isAtLimit", () => {
  it("reads within 2 kW of the limit, or over it, as at the limit (measured shed: −23 kW … −492.8 kW)", () => {
    // Arrange / Act
    const verdicts = [4_096_800, 2_000, 1_999, 0, -23_000, -492_800].map(isAtLimit);

    // Assert
    expect(verdicts).toEqual([false, false, true, true, true, true]);
  });
});
