import { capCell, computeAlarms, drawSamples, heroKpis, topNodes } from "./computeView";
import type { GpuFleet, GpuNodeSummary } from "../../../../data/compute/useGpuFleet";
import type { ActiveAlarm } from "../../../../data/alarms/useAlarms";

function node(deviceId: string, over: Partial<GpuNodeSummary> = {}): GpuNodeSummary {
  return { deviceId, throttling: 0, nodePowerW: 10_500, nodeLimitW: 26_400, gpuPowerW: 8_000, gpuCapW: 1000, ...over };
}

function fleetOf(nodes: GpuNodeSummary[]): GpuFleet {
  return { nodes, gpuCount: nodes.length * 8, throttlingCount: 0, totalDrawW: 1_029_000, perGpuW: 1000 };
}

describe("heroKpis", () => {
  it("shows throttle count, fleet draw, and headroom to the design compute capacity", () => {
    // Arrange
    const fleet = fleetOf([node("a")]);

    // Act
    const kpis = heroKpis(fleet, 1120);

    // Assert
    expect(kpis).toEqual({
      throttling: { value: "0 / 8", unit: "GPUs" },
      draw: { value: "1.03", unit: "MW" },
      headroom: { value: "91", unit: "kW" },
    });
  });
});

describe("topNodes", () => {
  it("ranks by node draw, unreported last, with the per-GPU cap", () => {
    // Arrange
    const fleet = fleetOf([
      node("a", { nodePowerW: 10_000, gpuCapW: 200 }),
      node("b", { nodePowerW: null, gpuCapW: null }),
      node("c", { nodePowerW: 11_000 }),
    ]);

    // Act
    const rows = topNodes(fleet, 2);

    // Assert
    expect(rows).toEqual([
      { deviceId: "c", draw: "11.0 kW", cap: "1000 W" },
      { deviceId: "a", draw: "10.0 kW", cap: "200 W" },
    ]);
  });
});

describe("capCell", () => {
  it("labels the per-GPU cap (W), goes warn on throttling, idle until reported", () => {
    // Arrange / Act — b: shed to 200 W/GPU with SW_POWER_CAP on 2 GPUs
    const cells = [capCell(node("a")), capCell(node("b", { throttling: 2, gpuCapW: 200 })), capCell(node("c", { gpuCapW: null }))];

    // Assert
    expect(cells).toEqual([
      { label: "1000", tone: "compute" },
      { label: "200", tone: "warn" },
      { label: "—", tone: "idle" },
    ]);
  });
});

describe("drawSamples", () => {
  it("histograms reported node draw, warning at 90% of the node PSU cap", () => {
    // Arrange
    const fleet = fleetOf([node("a"), node("b", { nodePowerW: null }), node("c", { nodePowerW: 11_000 })]);

    // Act
    const dist = drawSamples(fleet);

    // Assert
    expect(dist).toEqual({ samples: [10_500, 11_000], warnAtW: 26_400 * 0.9 });
  });
});

describe("computeAlarms", () => {
  it("keeps only alarms on gpu_node / compute_module devices", () => {
    // Arrange
    const alarm = (deviceId: string): ActiveAlarm => ({
      deviceId, deviceDisplayName: deviceId, measurementName: "m", measurementLabel: "M",
      severity: "warn", displayValue: "1", ts: "2026-01-01T00:00:00Z",
    });
    const templates = { gpu_node_01: "gpu_node", compute_module_01: "compute_module", bess_rack_01: "bess_rack" };

    // Act
    const kept = computeAlarms(
      [alarm("gpu_node_01"), alarm("bess_rack_01"), alarm("compute_module_01")],
      (id) => templates[id as keyof typeof templates],
    );

    // Assert
    expect(kept.map((row) => row.deviceId)).toEqual(["gpu_node_01", "compute_module_01"]);
  });
});
