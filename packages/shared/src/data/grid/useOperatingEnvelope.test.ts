import { envelopeFrom } from "./useOperatingEnvelope";

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

  it("clamps used fraction to [0,1] and nulls it on a zero limit", () => {
    // Arrange
    const over = { importLimitW: 100, exportLimitW: 0, importHeadroomW: -50, exportHeadroomW: 0, status: "OK" };
    const zero = { ...over, importLimitW: 0 };

    // Act
    const fractions = [envelopeFrom(over).usedFraction, envelopeFrom(zero).usedFraction];

    // Assert
    expect(fractions).toEqual([1, null]);
  });
});
