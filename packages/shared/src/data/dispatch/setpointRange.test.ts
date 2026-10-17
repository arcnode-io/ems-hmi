import { setpointRangeKw } from "./setpointRange";
import { TopologyView, type TopologyViewType } from "../topology/topology.schema";

const RATED = { min: -3_854_000, max: 3_854_000, nominal: 0 };

function view(bounds: { active_power: typeof RATED } | null | undefined): TopologyViewType {
  return {
    devices: {
      bess_module_1: { device_id: "bess_module_1", template: "bess_module", parent: null, display_name: null, extra_measurements: null, bounds },
    },
    // Reason: a template-level rating must not count — the range is per device (rack sum).
    templates_used: { bess_module: { measurements: { active_power: { unit: "watts", type: "float", bounds: RATED } } } },
  } as unknown as TopologyViewType;
}

describe("setpointRangeKw", () => {
  it("takes the range device-api derives for this module, and offers none when it derives nothing", () => {
    // Arrange / Act
    const ranges = [
      setpointRangeKw(view({ active_power: RATED }), "bess_module_1"),
      setpointRangeKw(view(null), "bess_module_1"),
      setpointRangeKw(view(undefined), "bess_module_1"),
      setpointRangeKw(view({ active_power: RATED }), "nope"),
    ];

    // Assert
    expect(ranges).toEqual([{ minKw: -3854, maxKw: 3854 }, null, null, null]);
  });
});

describe("TopologyView device bounds", () => {
  it("parses device-api's per-device bounds, and reads an older device-api without them as none", () => {
    // Arrange
    const base = { device_id: "m", template: "t", parent: null, display_name: null, extra_measurements: null };
    const parse = (device: object): unknown =>
      TopologyView.parse({
        deployment_uuid: "u", ems_mode: "sim", sizing_ref: null,
        sizing_params: { P_compute_total_kW: 0, E_BESS_total_kWh: 0, T_coolant_setpoint_C: 0, ride_through_hours: 0, bess_reserve_floor_mwh: 0 },
        devices: { m: device }, buses: [], templates_used: {},
      }).devices.m?.bounds;

    // Act
    const parsed = [parse({ ...base, bounds: { active_power: RATED } }), parse(base)];

    // Assert
    expect(parsed).toEqual([{ active_power: RATED }, null]);
  });
});
