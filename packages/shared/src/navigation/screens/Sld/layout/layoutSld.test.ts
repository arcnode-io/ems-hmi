/**
 * Tests for layoutSld — pure layout function. The topology mirrors a real
 * edp-api dc_ext order (a4dd812): POI on ac_main_1, a site MV bus holding
 * each grid container's switchgear + the battery pad, and one LV bus per
 * grid container feeding its compute modules. Asserts placement invariants,
 * not pixels.
 */

import { layoutSld } from "./layoutSld";
import type { TopologyViewType } from "../../../../data/topology/topology.schema";

type Devices = TopologyViewType["devices"];

function template(name: string, kind: "leaf" | "module"): TopologyViewType["templates_used"][string] {
  return { template: name, kind, equipment_id: null, vendor: null, model: null, description: "", measurements: {}, commands: {} };
}

const TEMPLATES: TopologyViewType["templates_used"] = {
  grid_module: template("grid_module", "module"),
  switchgear: template("switchgear", "leaf"),
  protective_relay: template("protective_relay", "leaf"),
  transformer: template("transformer", "leaf"),
  lv_switchboard: template("lv_switchboard", "leaf"),
  poi_meter: template("poi_meter", "leaf"),
  compute_module: template("compute_module", "module"),
  cdu: template("cdu", "leaf"),
  bess_module_dc: template("bess_module_dc", "module"),
  bess_catl: template("bess_catl", "leaf"),
  pcs: template("pcs", "leaf"),
};

function device(id: string, tmpl: string, parent: string | null, name: string): Devices[string] {
  return { device_id: id, template: tmpl, parent, display_name: name, extra_measurements: null };
}

function gridContainer(n: number): Devices {
  const g = `grid_module_${n}`;
  return {
    [g]: device(g, "grid_module", null, `G${n}`),
    [`switchgear_${n}`]: device(`switchgear_${n}`, "switchgear", g, `G${n}-SWG-1`),
    [`protective_relay_${n}`]: device(`protective_relay_${n}`, "protective_relay", g, `G${n}-RLY-1`),
    [`transformer_${n}`]: device(`transformer_${n}`, "transformer", g, `G${n}-T1`),
    [`lv_switchboard_${n}`]: device(`lv_switchboard_${n}`, "lv_switchboard", g, `G${n}-SWBD-1`),
  };
}

function compute(n: number): Devices {
  const c = `compute_module_${n}`;
  return {
    [c]: device(c, "compute_module", null, `C${n}`),
    [`cdu_${n}`]: device(`cdu_${n}`, "cdu", c, `C${n}-CDU-1`),
  };
}

const member = (id: string, port: string): { device_id: string; port: string } => ({ device_id: id, port });

/** G1 feeds C1+C2, G2 feeds C3; one dc_ext battery pad. */
function makeTopology(): TopologyViewType {
  return {
    deployment_uuid: "00000000-0000-0000-0000-000000000001",
    ems_mode: "sim",
    sizing_ref: null,
    sizing_params: { P_compute_total_kW: 0, E_BESS_total_kWh: 0, T_coolant_setpoint_C: 0, ride_through_hours: 0, bess_reserve_floor_mwh: 0 },
    devices: {
      ...gridContainer(1),
      ...gridContainer(2),
      poi_meter_1: device("poi_meter_1", "poi_meter", "grid_module_1", "G1-MTR-POI"),
      ...compute(1),
      ...compute(2),
      ...compute(3),
      bess_module_dc_1: device("bess_module_dc_1", "bess_module_dc", null, "BESS"),
      bess_catl_1: device("bess_catl_1", "bess_catl", "bess_module_dc_1", "BESS-1"),
      pcs_1: device("pcs_1", "pcs", "bess_module_dc_1", "PCS-1"),
      pcs_2: device("pcs_2", "pcs", "bess_module_dc_1", "PCS-2"),
    },
    buses: [
      { bus_id: "ac_main_1", type: "ac", members: [member("switchgear_1", "line_out"), member("poi_meter_1", "voltage_in"), member("protective_relay_1", "line_in")] },
      { bus_id: "ac_main_2", type: "ac", members: [member("switchgear_2", "line_out"), member("protective_relay_2", "line_in")] },
      { bus_id: "site_mv_1", type: "ac", members: [member("switchgear_1", "line_in"), member("switchgear_2", "line_in"), member("bess_module_dc_1", "ac_out")] },
      { bus_id: "lv_main_1", type: "ac", members: [member("lv_switchboard_1", "feeder_out"), member("compute_module_1", "ac_in"), member("compute_module_2", "ac_in")] },
      { bus_id: "lv_main_2", type: "ac", members: [member("lv_switchboard_2", "feeder_out"), member("compute_module_3", "ac_in")] },
    ],
    templates_used: TEMPLATES,
    bess: null,
  };
}

describe("layoutSld", () => {
  it("draws the POI, each switchgear + LV board, every compute module and the battery pad with its contents", () => {
    // Arrange
    const view = makeTopology();

    // Act
    const ids = layoutSld(view).nodes.map((n) => n.id).sort();

    // Assert — relays, grid containers and compute internals stay off the one-line
    expect(ids).toEqual(
      [
        "poi_meter_1",
        "switchgear_1", "lv_switchboard_1", "compute_module_1", "compute_module_2",
        "switchgear_2", "lv_switchboard_2", "compute_module_3",
        "bess_module_dc_1", "bess_catl_1", "pcs_1", "pcs_2",
      ].sort(),
    );
  });

  it("stacks POI → site bus → switchgear → transformer → LV board → LV bus → compute", () => {
    // Arrange
    const layout = layoutSld(makeTopology());
    const y = (id: string): number => layout.nodes.find((n) => n.id === id)!.y;
    const siteBus = layout.conductors.find((c) => c.id === "site_mv_1")!;
    const lvBus = layout.conductors.find((c) => c.id === "lv_main_1")!;
    const xfmr = layout.decorations.find((d) => d.id === "transformer_1")!;

    // Act
    const ys = [y("poi_meter_1"), siteBus.y1, y("switchgear_1"), xfmr.y, y("lv_switchboard_1"), lvBus.y1, y("compute_module_1")];

    // Assert
    expect(ys).toEqual([...ys].sort((a, b) => a - b));
    expect(new Set(ys).size).toBe(ys.length);
  });

  it("centres each switchgear, transformer and LV board over the compute modules its LV bus feeds", () => {
    // Arrange
    const layout = layoutSld(makeTopology());
    const x = (id: string): number => layout.nodes.find((n) => n.id === id)!.x;

    // Act
    const g1 = [x("switchgear_1"), layout.decorations.find((d) => d.id === "transformer_1")!.x, x("lv_switchboard_1")];
    const g2 = [x("switchgear_2"), x("lv_switchboard_2")];

    // Assert
    expect(g1).toEqual(Array(3).fill((x("compute_module_1") + x("compute_module_2")) / 2));
    expect(g2).toEqual(Array(2).fill(x("compute_module_3")));
    expect(x("compute_module_2")).toBeLessThan(x("compute_module_3"));
  });

  it("hangs the battery pad off the site bus with its battery and PCS below it, linked by parentage not conductors", () => {
    // Arrange
    const layout = layoutSld(makeTopology());
    const pad = layout.nodes.find((n) => n.id === "bess_module_dc_1")!;
    const sg2 = layout.nodes.find((n) => n.id === "switchgear_2")!;

    // Act
    const children = ["bess_catl_1", "pcs_1", "pcs_2"].map((id) => layout.nodes.find((n) => n.id === id)!);
    const links = layout.conductors.filter((c) => c.id.startsWith("child_drop_")).map((c) => [c.id, c.kind, c.dashed]);

    // Assert
    expect(pad.y).toBe(sg2.y);
    expect(pad.x).toBeGreaterThan(sg2.x);
    expect(children.every((c) => c.y > pad.y)).toBe(true);
    expect(links).toEqual([
      ["child_drop_bess_catl_1", "info", true],
      ["child_drop_pcs_1", "info", true],
      ["child_drop_pcs_2", "info", true],
    ]);
  });

  it("flips the POI drops with grid direction, animates compute feeds as load, and leaves the battery drop still", () => {
    // Arrange
    const layout = layoutSld(makeTopology());
    const byId = (id: string): (typeof layout.conductors)[number] => layout.conductors.find((c) => c.id === id)!;

    // Act
    const poiDrops = layout.conductors.filter((c) => c.id.startsWith("poi_drop_")).map((c) => c.flowSource);
    const computeDrop = byId("lv_drop_compute_module_1");
    const batteryDrop = byId("site_drop_bess_module_dc_1");

    // Assert
    expect(poiDrops).toEqual([{ kind: "poi" }, { kind: "poi" }]);
    expect([computeDrop.flowSource, computeDrop.particles.length > 0]).toEqual([null, true]);
    expect(batteryDrop.particles).toEqual([]);
  });

  it("widens the viewBox as grid containers feed more compute modules", () => {
    // Arrange
    const big = makeTopology();
    for (let n = 4; n <= 12; n++) {
      Object.assign(big.devices, compute(n));
      big.buses[4]!.members.push(member(`compute_module_${n}`, "ac_in"));
    }

    // Act
    const widths = [layoutSld(makeTopology()).width, layoutSld(big).width];

    // Assert
    expect(widths[1]).toBeGreaterThan(widths[0]!);
  });

  it("feeds a GPU-specific compute template the same as the default one", () => {
    // Arrange — AC H100 orders use compute_module_h100
    const view = makeTopology();
    view.devices.compute_module_3 = device("compute_module_3", "compute_module_h100", null, "C3");
    view.templates_used.compute_module_h100 = template("compute_module_h100", "module");

    // Act
    const c3 = layoutSld(view).nodes.find((n) => n.id === "compute_module_3")!;

    // Assert
    expect([c3.kind, c3.width]).toEqual(["module", layoutSld(makeTopology()).nodes.find((n) => n.id === "compute_module_3")!.width]);
  });
});
