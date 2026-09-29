import { TopologyView } from "./topology.schema";

const DEVICE = {
  device_id: "bess_module_01",
  template: "bess_module",
  parent: null,
  display_name: "BESS-01",
  extra_measurements: null,
};

function viewWith(device: Record<string, unknown>): Record<string, unknown> {
  return {
    deployment_uuid: "00000000-0000-0000-0000-000000000000",
    ems_mode: "sim",
    sizing_ref: null,
    sizing_params: {
      P_compute_total_kW: 0,
      E_BESS_total_kWh: 0,
      T_coolant_setpoint_C: 0,
      ride_through_hours: 0,
      bess_reserve_floor_mwh: 0,
    },
    devices: { bess_module_01: device },
    buses: [],
    templates_used: {},
    bess: null,
  };
}

describe("TopologyView device blocking", () => {
  it("parses a device-api that no longer sends blocking", () => {
    // Arrange + Act
    const result = TopologyView.safeParse(viewWith(DEVICE));

    // Assert
    expect(result.success).toBe(true);
  });

  it("still parses an older device-api that does send it", () => {
    // Arrange + Act
    const result = TopologyView.safeParse(viewWith({ ...DEVICE, blocking: ["live_mode"] }));

    // Assert
    expect(result.success).toBe(true);
  });
});
