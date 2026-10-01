/**
 * Guards the demo topology fixture against the measurements the HMI's
 * hooks actually read, so the public demo can't silently go to "—".
 */

import { readFileSync } from "fs";
import { join } from "path";

interface Fixture {
  templates_used: Record<
    string,
    { measurements: Record<string, { bounds: { nominal: number } | null }> }
  >;
}

const VIEW: Fixture = JSON.parse(
  readFileSync(
    join(__dirname, "..", "public", "api", "topology", "view.json"),
    "utf8",
  ),
) as Fixture;

describe("demo topology — power quality", () => {
  it("reads MV bus voltage + unbalance from the relay, not the passive switchgear", () => {
    // Arrange
    const relay = Object.keys(
      VIEW.templates_used.protective_relay?.measurements ?? {},
    );
    const switchgear = Object.keys(
      VIEW.templates_used.switchgear?.measurements ?? {},
    );

    // Act
    const relayHasPq = [
      "phase_voltage_a",
      "phase_voltage_b",
      "phase_voltage_c",
      "voltage_unbalance_pct",
    ].every((name) => relay.includes(name));

    // Assert
    expect({ relayHasPq, switchgear }).toEqual({
      relayHasPq: true,
      switchgear: [],
    });
  });

  it("uses a 12.47 kV system's phase-to-neutral nominal, matching ics-engineer's relay fixture", () => {
    // Arrange + Act
    const nominal =
      VIEW.templates_used.protective_relay?.measurements.phase_voltage_a?.bounds
        ?.nominal;

    // Assert — 12 470 / √3 (ems-industrial-fixtures fc94b6b)
    expect(nominal).toBe(7200);
  });
});
