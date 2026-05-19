import { detectPlaceholder, seriesColor } from "./helpers";
import { SOLARPUNK } from "../../../theme/tokens";

describe("detectPlaceholder", () => {
  it("returns true when title contains PLACEHOLDER (case-insensitive)", () => {
    expect(detectPlaceholder("PLACEHOLDER: today's markets")).toBe(true);
    expect(detectPlaceholder("Energy breakdown (placeholder)")).toBe(true);
  });

  it("returns false for normal titles", () => {
    expect(detectPlaceholder("BESS-01 State of Charge — last 24h")).toBe(false);
    expect(detectPlaceholder("")).toBe(false);
  });
});

describe("seriesColor", () => {
  it("returns a hex color for any non-negative index, cycling through the palette", () => {
    const c0 = seriesColor(SOLARPUNK, 0);
    const c4 = seriesColor(SOLARPUNK, 4);
    expect(c0).toBe(c4);
    expect(c0).toMatch(/^#/);
  });

  it("returns distinct colors for the first four indices", () => {
    const colors = [0, 1, 2, 3].map((i) => seriesColor(SOLARPUNK, i));
    const unique = new Set(colors);
    expect(unique.size).toBe(4);
  });
});
