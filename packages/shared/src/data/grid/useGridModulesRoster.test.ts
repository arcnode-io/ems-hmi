import { ROSTER_SPEC, rosterReading } from "./useGridModulesRoster";

describe("rosterReading", () => {
  it("shows der_dispatch's event state label, never the target_active_power number", () => {
    // Arrange
    const spec = ROSTER_SPEC.der_dispatch!;

    // Act
    const reading = rosterReading(spec, "ACTIVE");

    // Assert
    expect([spec.measurement, reading]).toEqual(["der_event_state", { v: "ACTIVE", l: "event" }]);
  });

  it("formats numeric readings, and dashes a value of the wrong kind", () => {
    // Arrange
    const envelope = ROSTER_SPEC.operating_envelope!;

    // Act
    const readings = [rosterReading(envelope, 0), rosterReading(envelope, "OK"), rosterReading(envelope, undefined)];

    // Assert
    expect(readings).toEqual([
      { v: "0.00 MW", l: "import limit" },
      { v: "—", l: "import_limit" },
      { v: "—", l: "import_limit" },
    ]);
  });
});
