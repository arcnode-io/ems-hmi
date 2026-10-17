import { setpointRangeKw } from "./setpointRange";
import type { TopologyViewType } from "../topology/topology.schema";

function view(bounds: { min: number; max: number; nominal: number } | null): TopologyViewType {
  return {
    devices: { bess_module_1: { device_id: "bess_module_1", template: "bess_module", parent: null, display_name: null, extra_measurements: null } },
    templates_used: { bess_module: { measurements: { active_power: { unit: "watts", type: "float", bounds } } } },
  } as unknown as TopologyViewType;
}

describe("setpointRangeKw", () => {
  it("takes the setpoint range from the BESS's rated active power, and has none when the catalog doesn't rate it", () => {
    // Arrange / Act
    const ranges = [
      setpointRangeKw(view({ min: -1_900_000, max: 1_900_000, nominal: 0 }), "bess_module_1"),
      setpointRangeKw(view(null), "bess_module_1"),
      setpointRangeKw(view(null), "nope"),
    ];

    // Assert
    expect(ranges).toEqual([{ minKw: -1900, maxKw: 1900 }, null, null]);
  });
});
