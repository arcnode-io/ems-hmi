import { reserveFloorFromView } from "./useReserveFloor";
import { TopologyView, type TopologyViewType } from "../topology/topology.schema";

// Declared pack (200 kWh) deliberately disagrees with the racks (8 MWh) — the
// industrial-fixtures DTM shape that made the HMI-side derivation wrong.
const BASE: TopologyViewType = {
  deployment_uuid: "00000000-0000-0000-0000-000000000000",
  ems_mode: "sim",
  sizing_ref: null,
  sizing_params: {
    P_compute_total_kW: 100,
    E_BESS_total_kWh: 200,
    T_coolant_setpoint_C: 18,
    ride_through_hours: 4,
    bess_reserve_floor_mwh: 1,
  },
  devices: {},
  buses: [],
  templates_used: {},
  bess: { pack_mwh: 8, reserve_floor_mwh: 1, reserve_floor_pct: 12.5 },
};

describe("reserveFloorFromView", () => {
  it("reads pack + floor from the view's bess block, not sizing_params", () => {
    // Arrange + Act
    const floor = reserveFloorFromView(BASE);

    // Assert
    expect(floor).toEqual({ hours: 4, floorMwh: 1, pct: 12.5, packMwh: 8 });
  });

  it("nulls pack + floor when the site has no rack capacity", () => {
    // Arrange + Act
    const floor = reserveFloorFromView({ ...BASE, bess: null });

    // Assert
    expect(floor).toEqual({ hours: 4, floorMwh: null, pct: null, packMwh: null });
  });

  it("nulls everything while topology is loading", () => {
    // Arrange + Act
    const floor = reserveFloorFromView(null);

    // Assert
    expect(floor).toEqual({ hours: null, floorMwh: null, pct: null, packMwh: null });
  });
});

describe("TopologyView bess", () => {
  it("parses a view from a device-api that predates the bess block as bess: null", () => {
    // Arrange
    const { bess: _dropped, ...legacy } = BASE;

    // Act
    const parsed = TopologyView.parse(legacy);

    // Assert
    expect(parsed.bess).toBeNull();
  });
});
