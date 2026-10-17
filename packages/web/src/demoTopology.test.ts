/**
 * Guards the demo topology — public/api/topology/view.json. It is generated,
 * never hand-edited: the made-up demo order's DTM (edp-api f068c5d,
 * 64×H100 · 10 MWh Megapack · ERCOT flex), commissioned against the demo
 * box's simulators, then projected by device-api exactly as product does:
 *
 *   (ems-device-api) npm run -s topology-view -- <commissioned-dtm.json> > view.json
 *
 * These checks pin what the demo needs from that file, so a regen that
 * breaks a screen fails here rather than going quietly blank.
 */

import { readFileSync } from "fs";
import { join } from "path";
import { TopologyView } from "@ems-hmi/shared/data/topology/topology.schema";
import { gpuNodeTopics } from "@ems-hmi/shared/data/compute/useGpuFleet";
import { setpointRangeKw } from "@ems-hmi/shared/data/dispatch/setpointRange";
import { layoutSld } from "@ems-hmi/shared/navigation/screens/Sld/layout/layoutSld";

const VIEW = TopologyView.parse(
  JSON.parse(
    readFileSync(
      join(__dirname, "..", "public", "api", "topology", "view.json"),
      "utf8",
    ),
  ),
);

describe("demo topology", () => {
  it("is a commissioned site — every device provisioned, as a running product site would be", () => {
    // Arrange / Act
    const unprovisioned = Object.values(VIEW.devices).filter(
      (device) => device.provisioned === false,
    );

    // Assert
    expect(unprovisioned).toEqual([]);
  });

  it("draws the full one-line: POI, site bus, switchgear, feeder relay, battery, LV board and every compute module", () => {
    // Arrange / Act
    const templates = layoutSld(VIEW)
      .nodes.map((node) => node.template)
      .sort();

    // Assert
    expect(templates).toEqual(
      [
        "bess_module",
        "bess_rack",
        "bess_rack",
        "bess_rack",
        "compute_module_h100",
        "compute_module_h100",
        "lv_switchboard",
        "protective_relay",
        "poi_meter",
        "switchgear",
      ].sort(),
    );
  });

  it("finds the H100 fleet and gives the battery a dispatch range", () => {
    // Arrange / Act
    const nodes = gpuNodeTopics(VIEW, "s");
    const range = setpointRangeKw(VIEW, "bess_module_1");

    // Assert
    expect([nodes.length, nodes[0]?.throttle.length, range]).toEqual([
      14,
      8,
      { minKw: -5781, maxKw: 5781 },
    ]);
  });
});
