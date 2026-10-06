import { coverHours, operatorReserveTopics, parseReserveWh, reserveConfirmation, stepReserveMwh, toAboveFloorMwh, toAbsoluteMwh } from "./operatorReserve";
import type { MeasurementViewType, TopologyViewType } from "../topology/topology.schema";

const RESERVE: MeasurementViewType = {
  unit: "watt_hours", type: "float", poll_rate_hz: null, display_name_default: null,
  iec_61850_ref: null, bounds: null, thresholds: null, values: null,
};

function viewWith(measurements: Record<string, MeasurementViewType>): Pick<TopologyViewType, "devices" | "templates_used"> {
  return {
    devices: { der_dispatch: { device_id: "der_dispatch", template: "der_dispatch", parent: null, display_name: null, extra_measurements: null } },
    templates_used: {
      der_dispatch: { template: "der_dispatch", kind: "leaf", equipment_id: null, vendor: null, model: null, description: "", commands: {}, measurements },
    },
  };
}

describe("operatorReserveTopics", () => {
  it("resolves state + set command on der_dispatch, only when the template declares operator_reserve", () => {
    // Arrange / Act
    const topics = [operatorReserveTopics(viewWith({ operator_reserve: RESERVE }), "s1"), operatorReserveTopics(viewWith({}), "s1")];

    // Assert
    expect(topics).toEqual([
      {
        state: "sites/s1/devices/der_dispatch/measurements/operator_reserve/watt_hours",
        command: "sites/s1/devices/der_dispatch/commands/set/operator_reserve/watt_hours",
      },
      null,
    ]);
  });
});

describe("parseReserveWh", () => {
  it("reads absent or invalid as 0 and clamps negatives, per the contract", () => {
    // Arrange / Act
    const values = [2_000_000, undefined, null, "2", -5, Number.NaN].map(parseReserveWh);

    // Assert
    expect(values).toEqual([2_000_000, 0, 0, 0, 0, 0]);
  });
});

describe("stepReserveMwh", () => {
  it("steps in 0.5 MWh, clamped to [0, pack]", () => {
    // Arrange / Act
    const steps = [stepReserveMwh(2, 1, 8), stepReserveMwh(0, -1, 8), stepReserveMwh(8, 1, 8), stepReserveMwh(1.2, 1, 8)];

    // Assert
    expect(steps).toEqual([2.5, 0, 8, 1.5]);
  });
});

describe("reserveConfirmation", () => {
  it("waits for the controller's echo, confirms on a match, and flags no echo after 10 s", () => {
    // Arrange — operator sent 0.5 MWh at t = 1000 ms
    const pending = { mwh: 0.5, sentAtMs: 1000 };

    // Act
    const states = [
      reserveConfirmation(null, 6, 5000),
      reserveConfirmation(pending, 6, 3000),
      reserveConfirmation(pending, 0.5, 3000),
      reserveConfirmation(pending, 6, 11_000),
    ];

    // Assert
    expect(states).toEqual(["idle", "waiting", "confirmed", "unconfirmed"]);
  });
});

describe("reserve measured above minimum SoC", () => {
  it("converts between the operator's above-floor value and the absolute reserve the controller stores", () => {
    // Arrange — 7.7 MWh pack, 2.36 MWh minimum SoC → 0–5.34 MWh usable
    // Act
    const above = [toAboveFloorMwh(0, 2.36), toAboveFloorMwh(3, 2.36), toAboveFloorMwh(5.36, 2.36)];
    const absolute = [toAbsoluteMwh(0, 2.36, 7.7), toAbsoluteMwh(3, 2.36, 7.7), toAbsoluteMwh(99, 2.36, 7.7), toAbsoluteMwh(-1, 2.36, 7.7)];

    // Assert — a stored reserve below the floor is just "0 above it"
    expect([above.map((mwh) => +mwh.toFixed(2)), absolute.map((mwh) => +mwh.toFixed(2))]).toEqual([[0, 0.64, 3], [2.36, 5.36, 7.7, 2.36]]);
  });
});

describe("coverHours", () => {
  it("is stored energy above the effective floor ÷ the load the battery must carry at full curtailment", () => {
    // Arrange — 71% of 8 MWh = 5.68 MWh stored; floor 2.36; site load 1.12 MW
    // Act
    const hours = [
      coverHours(71, 8, 2.36, 0, 1_120_000),
      coverHours(71, 8, 2.36, 3, 1_120_000),
      coverHours(71, 8, 2.36, 5, 1_120_000),
      coverHours(null, 8, 2.36, 0, 1_120_000),
      coverHours(71, 8, 2.36, 0, 0),
    ];

    // Assert — (5.68−2.36)/1.12, (5.68−5.36)/1.12, nothing above a 7.36 floor, unknowns → null
    expect(hours.map((h) => (h === null ? null : +h.toFixed(2)))).toEqual([2.96, 0.29, 0, null, null]);
  });
});
