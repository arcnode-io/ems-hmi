import { avgIfComplete, sumIfComplete } from "./useFleetKpis";
import { familyTopics } from "../topology/templateFamily";
import type { TopologyViewType } from "../topology/topology.schema";

describe("fleet aggregates", () => {
  it("are unknown until every device has reported — a partial sum or average is a wrong number", () => {
    // Arrange
    const partial = [40, null, 60];
    const complete = [40, 50, 60];

    // Act
    const actual = [sumIfComplete(partial), avgIfComplete(partial), sumIfComplete(complete), avgIfComplete(complete), sumIfComplete([])];

    // Assert
    expect(actual).toEqual([null, null, 150, 50, null]);
  });
});

describe("familyTopics", () => {
  it("reads every device in the family, variants included — H100 compute modules count toward compute power", () => {
    // Arrange
    const total = { unit: "watts", type: "float" };
    const view = {
      devices: {
        c1: { device_id: "c1", template: "compute_module_h100" },
        c2: { device_id: "c2", template: "compute_module" },
        g1: { device_id: "g1", template: "grid_module" },
      },
      templates_used: {
        compute_module_h100: { measurements: { total_power: total } },
        compute_module: { measurements: { total_power: total } },
        grid_module: { measurements: {} },
      },
    } as unknown as TopologyViewType;

    // Act
    const topics = familyTopics(view, "s", "compute_module", ["total_power"]);

    // Assert
    expect(topics).toEqual([
      "sites/s/devices/c1/measurements/total_power/watts",
      "sites/s/devices/c2/measurements/total_power/watts",
    ]);
  });
});
