import React from "react";
import { act, renderHook } from "@testing-library/react";
import { DeploymentIdentityProvider } from "../../../data/deployment/DeploymentIdentityProvider";
import { MqttProvider } from "../../../data/mqtt/MqttProvider";
import { MemoryMqttClient } from "../../../data/mqtt/memoryMqttClient";
import { DEFAULT_FLUSH_MS } from "../../../data/mqtt/useAggregateMeasurements";
import { TopologyContext } from "../../../data/topology/TopologyProvider";
import type { TopologyViewType } from "../../../data/topology/topology.schema";
import { useModuleRows } from "./useModuleRows";

// dc_ext battery pad (edp-api 9f51e62): DC module holding the CATL battery and PCS.
const HEADROOM = { unit: "watts", type: "float" };
const VIEW = {
  devices: {
    bess_module_dc_1: { device_id: "bess_module_dc_1", template: "bess_module_dc", display_name: "BESS", parent: null },
    bess_catl_1: { device_id: "bess_catl_1", template: "bess_catl", display_name: "BESS-1", parent: "bess_module_dc_1" },
    pcs_1: { device_id: "pcs_1", template: "pcs", display_name: "PCS-1", parent: "bess_module_dc_1" },
  },
  buses: [],
  templates_used: {
    bess_module_dc: { kind: "module", measurements: { import_headroom: HEADROOM, export_headroom: HEADROOM } },
    bess_catl: { kind: "leaf", measurements: {} },
    pcs: { kind: "leaf", measurements: {} },
  },
} as unknown as TopologyViewType;

// 64×H100 demo order: a GPU-variant compute template.
const WATTS = { unit: "watts", type: "float" };
const H100_VIEW = {
  devices: { compute_module_h100_1: { device_id: "compute_module_h100_1", template: "compute_module_h100", display_name: "C1", parent: null } },
  buses: [],
  templates_used: { compute_module_h100: { kind: "module", measurements: { total_power: WATTS, total_thermal_load: WATTS } } },
} as unknown as TopologyViewType;

// A PDU under the compute container, with alarm limits on its input voltage.
const VOLTS = {
  unit: "volts", type: "float", display_name_default: "Input Voltage L1-L2",
  thresholds: { warn_min: 394, warn_max: 436, alarm_min: 381, alarm_max: 439 },
};
const H100_WITH_PDU_VIEW = {
  ...H100_VIEW,
  devices: {
    ...H100_VIEW.devices,
    pdu_1: { device_id: "pdu_1", template: "pdu", display_name: null, parent: "compute_module_h100_1" },
  },
  templates_used: { ...H100_VIEW.templates_used, pdu: { kind: "leaf", measurements: { input_voltage_l1: VOLTS } } },
} as unknown as TopologyViewType;

function wrapperFor(view: TopologyViewType, client = new MemoryMqttClient()) {
  return ({ children }: { children: React.ReactNode }): React.ReactElement => (
    <DeploymentIdentityProvider
      base={{ name: "T", host: "h", siteId: "s", mode: "local", chatApiUri: "", deviceApiUri: "", derControlUri: "" }}
    >
      <TopologyContext.Provider value={{ status: "ready", view, error: null, refetch: () => undefined }}>
        <MqttProvider client={client}>{children}</MqttProvider>
      </TopologyContext.Provider>
    </DeploymentIdentityProvider>
  );
}
const wrapper = wrapperFor(VIEW);

describe("useModuleRows", () => {
  it("lists the dc_ext battery pad as a BESS module with its POI headroom", () => {
    // Arrange / Act
    const { result } = renderHook(() => useModuleRows(), { wrapper });

    // Assert
    expect(
      result.current.map((r) => ({ id: r.id, type: r.moduleType, labels: r.measurements.map((m) => m.label) })),
    ).toEqual([{ id: "bess_module_dc_1", type: "bess", labels: ["Import headroom", "Export headroom"] }]);
  });

  it("lists a GPU-variant compute module as compute, with the draw and heat it reports", () => {
    // Arrange / Act
    const { result } = renderHook(() => useModuleRows(), { wrapper: wrapperFor(H100_VIEW) });

    // Assert
    expect(
      result.current.map((r) => ({ id: r.id, type: r.moduleType, labels: r.measurements.map((m) => m.label) })),
    ).toEqual([{ id: "compute_module_h100_1", type: "compute", labels: ["Draw", "Heat"] }]);
  });

  it("counts an alarm on a child device against the module that owns it", () => {
    // Arrange
    jest.useFakeTimers();
    const client = new MemoryMqttClient();
    const { result } = renderHook(() => useModuleRows(), { wrapper: wrapperFor(H100_WITH_PDU_VIEW, client) });

    // Act — 240 V is under the 381 V alarm limit
    act(() => client.broadcast("sites/s/devices/pdu_1/measurements/input_voltage_l1/volts", { ts: "t", value: 240 }));
    act(() => { jest.advanceTimersByTime(DEFAULT_FLUSH_MS); });
    jest.useRealTimers();

    // Assert
    expect(result.current.map((r) => ({ id: r.id, status: r.status, alarmCount: r.alarmCount }))).toEqual([
      { id: "compute_module_h100_1", status: "alarm", alarmCount: 1 },
    ]);
  });
});
