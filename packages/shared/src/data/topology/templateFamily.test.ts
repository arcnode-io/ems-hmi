import { inFamily } from "./templateFamily";

describe("inFamily", () => {
  it("puts a template in a family by its own name or a `<family>_<variant>` name — never by a shared prefix word", () => {
    // Arrange
    const cases: Array<[string, string]> = [
      ["gpu_node", "gpu_node"],
      ["gpu_node_h100", "gpu_node"],
      ["compute_module_h100", "compute_module"],
      ["bess_module_dc", "bess_module"],
      ["grid_mgmt_switch", "grid_module"],
      ["gpu_nodes", "gpu_node"],
    ];

    // Act
    const actual = cases.map(([template, family]) => inFamily(template, family));

    // Assert
    expect(actual).toEqual([true, true, true, true, false, false]);
  });
});
