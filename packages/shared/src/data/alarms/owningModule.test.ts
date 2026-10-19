import { owningModule, type ModuleTree } from "./owningModule";
import type { TopologyViewType } from "../topology/topology.schema";

function device(deviceId: string, template: string, parent: string | null): TopologyViewType["devices"][string] {
  return { device_id: deviceId, template, parent, display_name: null, extra_measurements: null, bounds: null };
}

function template(name: string, kind: "module" | "leaf"): TopologyViewType["templates_used"][string] {
  return { template: name, kind, equipment_id: null, vendor: null, model: null, description: "", commands: {}, measurements: {} };
}

const VIEW: ModuleTree = {
  devices: {
    compute_module_h100_1: device("compute_module_h100_1", "compute_module_h100", null),
    pdu_1: device("pdu_1", "pdu", "compute_module_h100_1"),
    sensor_1: device("sensor_1", "sensor", "pdu_1"),
    poi_meter: device("poi_meter", "poi_meter", null),
  },
  templates_used: {
    compute_module_h100: template("compute_module_h100", "module"),
    pdu: template("pdu", "leaf"),
    sensor: template("sensor", "leaf"),
    poi_meter: template("poi_meter", "leaf"),
  },
};

describe("owningModule", () => {
  it("is the nearest module up a device's parent chain", () => {
    // Arrange / Act
    const actual = ["pdu_1", "sensor_1"].map((id) => owningModule(VIEW, id));

    // Assert
    expect(actual).toEqual(["compute_module_h100_1", "compute_module_h100_1"]);
  });

  it("is the device itself when it is a module", () => {
    // Arrange / Act
    const actual = owningModule(VIEW, "compute_module_h100_1");

    // Assert
    expect(actual).toBe("compute_module_h100_1");
  });

  it("is null for a device no module owns, or one the view doesn't know", () => {
    // Arrange / Act
    const actual = ["poi_meter", "ghost"].map((id) => owningModule(VIEW, id));

    // Assert
    expect(actual).toEqual([null, null]);
  });
});
