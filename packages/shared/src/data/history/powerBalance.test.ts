import { appendPoint, stitchHistory, sumSeries } from "./powerBalance";

describe("appendPoint", () => {
  it("appends a sample and drops points older than the window", () => {
    // Arrange — 60 s window, now = 100 s
    const points = [{ x: 30_000, y: 1 }, { x: 50_000, y: 2 }];

    // Act
    const next = appendPoint(points, { x: 100_000, y: 3 }, 60_000);

    // Assert
    expect(next).toEqual([{ x: 50_000, y: 2 }, { x: 100_000, y: 3 }]);
  });
});

describe("stitchHistory", () => {
  it("puts history ahead of live, dropping history that overlaps the live span", () => {
    // Arrange
    const history = [{ x: 10_000, y: 1 }, { x: 20_000, y: null }, { x: 40_000, y: 3 }];
    const live = [{ x: 35_000, y: 9 }, { x: 37_000, y: 9 }];

    // Act
    const merged = stitchHistory(history, live);

    // Assert
    expect(merged).toEqual([{ x: 10_000, y: 1 }, { x: 20_000, y: null }, { x: 35_000, y: 9 }, { x: 37_000, y: 9 }]);
  });

  it("returns history alone before the first live sample", () => {
    // Arrange / Act
    const merged = stitchHistory([{ x: 1, y: 1 }], []);

    // Assert
    expect(merged).toEqual([{ x: 1, y: 1 }]);
  });
});

describe("sumSeries", () => {
  it("sums bucket-aligned series by timestamp; a gap in any input is a gap in the sum", () => {
    // Arrange — two bess_modules over the same buckets
    const modA = [{ x: 0, y: 100 }, { x: 10, y: null }, { x: 20, y: 300 }];
    const modB = [{ x: 0, y: 50 }, { x: 10, y: 60 }, { x: 20, y: 70 }];

    // Act
    const sum = sumSeries([modA, modB]);

    // Assert
    expect(sum).toEqual([{ x: 0, y: 150 }, { x: 10, y: null }, { x: 20, y: 370 }]);
  });
});
