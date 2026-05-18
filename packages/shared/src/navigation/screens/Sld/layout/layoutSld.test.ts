/**
 * Tests for layoutSld — pure layout function. Asserts placement invariants
 * (POI above AC bus, BESS on DC bus, etc.) rather than exact pixel coords
 * so tweaking the layout doesn't break the suite.
 */

import { layoutSld } from "./layoutSld";
import type { TopologyViewType } from "../../../../data/topology/topology.schema";

const TEMPLATES: TopologyViewType["templates_used"] = {
  bess_module: { template: "bess_module", kind: "module", equipment_id: null, vendor: null, model: null, description: "", measurements: {}, commands: {} },
  compute_module: { template: "compute_module", kind: "module", equipment_id: null, vendor: null, model: null, description: "", measurements: {}, commands: {} },
  grid_module: { template: "grid_module", kind: "module", equipment_id: null, vendor: null, model: null, description: "", measurements: {}, commands: {} },
  operating_envelope: { template: "operating_envelope", kind: "leaf", equipment_id: null, vendor: null, model: null, description: "", measurements: {}, commands: {} },
  line_rating: { template: "line_rating", kind: "leaf", equipment_id: null, vendor: null, model: null, description: "", measurements: {}, commands: {} },
  revenue_meter: { template: "revenue_meter", kind: "leaf", equipment_id: null, vendor: null, model: null, description: "", measurements: {}, commands: {} },
  cdu: { template: "cdu", kind: "leaf", equipment_id: null, vendor: null, model: null, description: "", measurements: {}, commands: {} },
};

function makeTopology(): TopologyViewType {
  return {
    deployment_uuid: "00000000-0000-0000-0000-000000000001",
    ems_mode: "sim",
    sizing_ref: null,
    sizing_params: { P_compute_total_kW: 0, E_BESS_total_kWh: 0, T_coolant_setpoint_C: 0 },
    devices: {
      bess_module_01: { device_id: "bess_module_01", template: "bess_module", parent: null, display_name: "BESS-01", blocking: [], extra_measurements: null },
      bess_module_02: { device_id: "bess_module_02", template: "bess_module", parent: null, display_name: "BESS-02", blocking: [], extra_measurements: null },
      compute_module_01: { device_id: "compute_module_01", template: "compute_module", parent: null, display_name: "ARC-COMPUTE-01", blocking: [], extra_measurements: null },
      grid_module_01: { device_id: "grid_module_01", template: "grid_module", parent: null, display_name: "Grid Module", blocking: [], extra_measurements: null },
      operating_envelope_01: { device_id: "operating_envelope_01", template: "operating_envelope", parent: "grid_module_01", display_name: "DOE Feed", blocking: [], extra_measurements: null },
      line_rating_01: { device_id: "line_rating_01", template: "line_rating", parent: "grid_module_01", display_name: "DLR Feed", blocking: [], extra_measurements: null },
      revenue_meter_01: { device_id: "revenue_meter_01", template: "revenue_meter", parent: "grid_module_01", display_name: "GRD-RM-001", blocking: [], extra_measurements: null },
      cdu_01: { device_id: "cdu_01", template: "cdu", parent: "compute_module_01", display_name: "CDU-01", blocking: [], extra_measurements: null },
    },
    buses: [
      { bus_id: "ac_bus_1", type: "ac", members: [{ device_id: "grid_module_01", port: null }, { device_id: "compute_module_01", port: null }] },
      { bus_id: "dc_bus_1", type: "dc", members: [{ device_id: "bess_module_01", port: null }, { device_id: "bess_module_02", port: null }] },
    ],
    templates_used: TEMPLATES,
  };
}

describe("layoutSld", () => {
  it("places POI revenue meter above the AC bus", () => {
    const layout = layoutSld(makeTopology());
    const poi = layout.nodes.find((n) => n.role === "poi");
    const acBusConductor = layout.conductors.find((c) => c.id === "ac_bus_1");
    expect(poi).toBeDefined();
    expect(acBusConductor).toBeDefined();
    expect(poi!.y).toBeLessThan(acBusConductor!.y1);
  });

  it("places utility feed leaves above the POI", () => {
    const layout = layoutSld(makeTopology());
    const poi = layout.nodes.find((n) => n.role === "poi")!;
    const doe = layout.nodes.find((n) => n.id === "operating_envelope_01")!;
    const dlr = layout.nodes.find((n) => n.id === "line_rating_01")!;
    expect(doe.y).toBeLessThan(poi.y);
    expect(dlr.y).toBeLessThan(poi.y);
  });

  it("places BESS modules on the DC bus, below the AC bus", () => {
    const layout = layoutSld(makeTopology());
    const acBus = layout.conductors.find((c) => c.id === "ac_bus_1")!;
    const dcBus = layout.conductors.find((c) => c.id === "dc_bus_1")!;
    expect(dcBus.y1).toBeGreaterThan(acBus.y1);
    const bess01 = layout.nodes.find((n) => n.id === "bess_module_01")!;
    expect(bess01.y).toBeGreaterThan(dcBus.y1);
  });

  it("places a CDU child directly below its compute parent", () => {
    const layout = layoutSld(makeTopology());
    const cdu = layout.nodes.find((n) => n.id === "cdu_01")!;
    const compute = layout.nodes.find((n) => n.id === "compute_module_01")!;
    expect(cdu.x).toBe(compute.x);
    expect(cdu.y).toBeGreaterThan(compute.y);
  });

  it("emits a breaker between POI and AC bus and an inverter between Grid Module and DC bus", () => {
    const layout = layoutSld(makeTopology());
    expect(layout.decorations.some((d) => d.kind === "breaker")).toBe(true);
    expect(layout.decorations.some((d) => d.kind === "inverter")).toBe(true);
  });

  it("tags the POI-drop conductor with envelope flow source", () => {
    const layout = layoutSld(makeTopology());
    const drops = layout.conductors.filter((c) => c.id.startsWith("poi_drop_"));
    expect(drops.length).toBeGreaterThan(0);
    drops.forEach((d) => {
      expect(d.flowSource).toEqual({ kind: "envelope" });
    });
  });

  it("tags the AC drop to ARC-COMPUTE-01 as load-side (no flowSource)", () => {
    const layout = layoutSld(makeTopology());
    const computeDrop = layout.conductors.find(
      (c) => c.id === "ac_drop_compute_module_01",
    );
    expect(computeDrop).toBeDefined();
    expect(computeDrop!.flowSource).toBeNull();
  });

  it("widens the viewBox when many BESS modules are present", () => {
    const baseW = layoutSld(makeTopology()).width;
    const big = makeTopology();
    for (let i = 3; i <= 8; i++) {
      const id = `bess_module_0${i}`;
      big.devices[id] = { device_id: id, template: "bess_module", parent: null, display_name: `BESS-0${i}`, blocking: [], extra_measurements: null };
      big.buses[1].members.push({ device_id: id, port: null });
    }
    const wideW = layoutSld(big).width;
    expect(wideW).toBeGreaterThan(baseW);
  });
});
