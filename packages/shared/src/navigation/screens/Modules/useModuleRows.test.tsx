import React from "react";
import { renderHook } from "@testing-library/react";
import { DeploymentIdentityProvider } from "../../../data/deployment/DeploymentIdentityProvider";
import { MqttProvider } from "../../../data/mqtt/MqttProvider";
import { MockMqttClientImpl } from "../../../data/mqtt/MockMqttProvider";
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

function wrapper({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <DeploymentIdentityProvider
      base={{ name: "T", host: "h", siteId: "s", mode: "local", chatApiUri: "", deviceApiUri: "", derControlUri: "" }}
    >
      <TopologyContext.Provider value={{ status: "ready", view: VIEW, error: null, refetch: () => undefined }}>
        <MqttProvider client={new MockMqttClientImpl()}>{children}</MqttProvider>
      </TopologyContext.Provider>
    </DeploymentIdentityProvider>
  );
}

describe("useModuleRows", () => {
  it("lists the dc_ext battery pad as a BESS module with its POI headroom", () => {
    // Arrange / Act
    const { result } = renderHook(() => useModuleRows(), { wrapper });

    // Assert
    expect(
      result.current.map((r) => ({ id: r.id, type: r.moduleType, labels: r.measurements.map((m) => m.label) })),
    ).toEqual([{ id: "bess_module_dc_1", type: "bess", labels: ["Import headroom", "Export headroom"] }]);
  });
});
