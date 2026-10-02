import { gpuStripMetrics } from "./gpuStripMetrics";

describe("gpuStripMetrics", () => {
  it("formats throttling as n / total, fleet draw in MW past 1 MW, per-GPU in W", () => {
    // Arrange — live demo shape: 98 nodes × 8 GPUs at ~10.5 kW/node
    const fleet = { nodes: [], gpuCount: 784, throttlingCount: 0, totalDrawW: 1_029_000, perGpuW: 1_000.4 };

    // Act
    const metrics = gpuStripMetrics(fleet);

    // Assert
    expect(metrics).toEqual({
      throttling: { value: "0 / 784", unit: "GPUs" },
      totalDraw: { value: "1.03", unit: "MW" },
      perGpu: { value: "1000", unit: "W" },
    });
  });

  it("shows a dash until values arrive, and kW below 1 MW", () => {
    // Arrange
    const cold = { nodes: [], gpuCount: 16, throttlingCount: 0, totalDrawW: null, perGpuW: null };
    const small = { ...cold, totalDrawW: 21_000 };

    // Act
    const [coldMetrics, smallMetrics] = [gpuStripMetrics(cold), gpuStripMetrics(small)];

    // Assert
    expect([coldMetrics.totalDraw, coldMetrics.perGpu, smallMetrics.totalDraw]).toEqual([
      { value: "—", unit: "kW" },
      { value: "—", unit: "W" },
      { value: "21.0", unit: "kW" },
    ]);
  });
});
