/**
 * Guards the demo topology fixture against the measurements the HMI's
 * hooks actually read, so the public demo can't silently go to "—".
 */

import { readFileSync } from "fs";
import { join } from "path";
import { TopologyView } from "@ems-hmi/shared/data/topology/topology.schema";
import { gpuNodeTopics } from "@ems-hmi/shared/data/compute/useGpuFleet";

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

  it("carries the PCC breaker on the relay and net power on the POI meter", () => {
    // Arrange
    const relay = Object.keys(
      VIEW.templates_used.protective_relay?.measurements ?? {},
    );
    const meter = Object.keys(
      VIEW.templates_used.poi_meter?.measurements ?? {},
    );

    // Act
    const present = {
      breaker: ["breaker_closed", "trip_status"].every((name) =>
        relay.includes(name),
      ),
      netPower: meter.includes("active_power"),
    };

    // Assert
    expect(present).toEqual({ breaker: true, netPower: true });
  });
});

describe("demo topology — GPU fleet", () => {
  it("parses with GPU nodes carrying per-GPU caps, whose throttle enum can only read NA", () => {
    // Arrange — mock enums cycle through `values`; anything but NA would fake throttling
    const view = TopologyView.parse(VIEW);

    // Act
    const nodes = gpuNodeTopics(view, "local_site");
    const throttleLabels = Object.entries(
      view.templates_used.gpu_node?.measurements ?? {},
    )
      .filter(([name]) => name.endsWith("_throttle_reason"))
      .flatMap(([, meas]) => Object.values(meas.values ?? {}));

    // Assert
    expect({
      nodes: nodes.length,
      gpusPerNode: nodes[0]?.throttle.length,
      capsPerNode: nodes[0]?.gpuLimits.length,
      labels: [...new Set(throttleLabels)],
    }).toEqual({ nodes: 32, gpusPerNode: 8, capsPerNode: 8, labels: ["NA"] });
  });
});
