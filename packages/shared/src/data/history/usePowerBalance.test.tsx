import { act, renderHook } from "@testing-library/react";
import { useLiveSamples } from "./usePowerBalance";

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe("useLiveSamples", () => {
  it("samples the latest live values on a fixed cadence, unknowns as gaps", () => {
    // Arrange — values change between ticks; the sampler must read the latest
    let live = { gridW: 1_120_000, bessW: 0, gpuW: 1_029_000 as number | null };
    const { result, rerender } = renderHook(() => useLiveSamples(live));

    // Act
    act(() => { jest.advanceTimersByTime(2000); });
    live = { gridW: 20, bessW: 1_120_000, gpuW: null };
    rerender();
    act(() => { jest.advanceTimersByTime(2000); });

    // Assert
    expect({
      grid: result.current.grid.map((point) => point.y),
      bess: result.current.bess.map((point) => point.y),
      gpu: result.current.gpu.map((point) => point.y),
    }).toEqual({ grid: [1_120_000, 20], bess: [0, 1_120_000], gpu: [1_029_000, null] });
  });
});
