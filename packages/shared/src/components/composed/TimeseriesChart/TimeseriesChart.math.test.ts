/** Tests for TimeseriesChart geometry. AAA pattern. */

import {
  numericX,
  computeScale,
  pxToDataX,
  nearestPointIndex,
  PAD_L,
} from "./TimeseriesChart.math";
import type { TimeseriesSeries } from "./TimeseriesChart.types";

describe("numericX", () => {
  it("passes a number through", () => {
    expect(numericX(42)).toBe(42);
  });

  it("parses an ISO timestamp to epoch ms", () => {
    expect(numericX("2026-05-21T00:00:00Z")).toBe(Date.parse("2026-05-21T00:00:00Z"));
  });
});

describe("computeScale", () => {
  it("derives the data range across a series", () => {
    const series: TimeseriesSeries[] = [
      { label: "s", points: [{ x: 0, y: 10 }, { x: 5, y: 30 }] },
    ];
    const scale = computeScale(series, []);
    expect(scale?.xMin).toBe(0);
    expect(scale?.xMax).toBe(5);
    // y is padded 5% each side.
    expect(scale!.yMin).toBeLessThan(10);
    expect(scale!.yMax).toBeGreaterThan(30);
  });

  it("returns null when every series is empty", () => {
    expect(computeScale([{ label: "s", points: [] }], [])).toBeNull();
  });
});

describe("pxToDataX", () => {
  it("maps a plot-x pixel back to a data-x value", () => {
    const scale = { xMin: 0, xMax: 100, yMin: 0, yMax: 1 };
    // Half-way across a 200px plot → mid of the x-range.
    expect(pxToDataX(scale, 200, PAD_L + 100)).toBe(50);
  });
});

describe("nearestPointIndex", () => {
  const points = [{ x: 0, y: 1 }, { x: 10, y: 2 }, { x: 20, y: 3 }];

  it("finds the index of the closest point", () => {
    expect(nearestPointIndex(points, 12)).toBe(1);
    expect(nearestPointIndex(points, 18)).toBe(2);
  });

  it("returns -1 for an empty series", () => {
    expect(nearestPointIndex([], 5)).toBe(-1);
  });
});
