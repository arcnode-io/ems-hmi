import { componentRows, componentTopics } from "./bessComponents";
import type { TopologyViewType } from "../topology/topology.schema";

type Measurement = TopologyViewType["templates_used"][string]["measurements"][string];

function m(unit: string, type: Measurement["type"] = "float"): Measurement {
  return { unit, type, poll_rate_hz: 1, display_name_default: null, iec_61850_ref: null, bounds: null, thresholds: null, values: null };
}

function device(id: string, template: string, parent: string | null): TopologyViewType["devices"][string] {
  return { device_id: id, template, parent, display_name: id.toUpperCase(), provisioned: true, extra_measurements: null, bounds: null };
}

// Reason: only devices + templates_used are read; the rest of the view is noise here.
const VIEW = {
  devices: {
    bess_module_dc_1: device("bess_module_dc_1", "bess_module_dc", null),
    pcs_1: device("pcs_1", "pcs", "bess_module_dc_1"),
    bess_catl_1: device("bess_catl_1", "bess_catl", "bess_module_dc_1"),
    pcs_9: device("pcs_9", "pcs", "bess_module_dc_9"),
  },
  templates_used: {
    pcs: { measurements: { active_power: m("watts"), ac_voltage_ab: m("volts"), grid_frequency: m("hertz"), operating_state: m("none", "enum") } },
    bess_catl: { measurements: { state_of_charge: m("percent"), dc_voltage: m("volts"), bms_status: m("none", "enum") } },
  },
} as unknown as TopologyViewType;

const at = (value: number | string) => ({ ts: "2026-10-18T00:00:00Z", value });

describe("componentRows", () => {
  it("lists the module's own children with just the readings their templates carry", () => {
    // Arrange
    const messages = {
      "sites/s/devices/pcs_1/measurements/active_power/watts": at(-250_000),
      "sites/s/devices/pcs_1/measurements/operating_state/none": at("STANDBY"),
      "sites/s/devices/bess_catl_1/measurements/state_of_charge/percent": at(61),
    };

    // Act
    const rows = componentRows(VIEW, "s", "bess_module_dc_1", messages);

    // Assert
    expect(rows).toEqual([
      {
        id: "pcs_1",
        displayName: "PCS_1",
        template: "pcs",
        provisioned: true,
        state: "STANDBY",
        metrics: [
          { key: "power", value: -250_000 },
          { key: "acVoltage", value: null },
          { key: "frequency", value: null },
        ],
      },
      {
        id: "bess_catl_1",
        displayName: "BESS_CATL_1",
        template: "bess_catl",
        provisioned: true,
        state: null,
        metrics: [
          { key: "soc", value: 61 },
          { key: "dcVoltage", value: null },
        ],
      },
    ]);
  });

  it("subscribes only to the readings it shows", () => {
    // Act
    const topics = componentTopics(VIEW, "s", "bess_module_dc_1");

    // Assert
    expect(topics).toHaveLength(7);
  });
});
