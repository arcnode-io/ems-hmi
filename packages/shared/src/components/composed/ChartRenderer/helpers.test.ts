import { detectPlaceholder, seriesColor, formatTableCell } from "./helpers";
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

describe("formatTableCell", () => {
  it("collapses an ISO timestamp to YYYY-MM-DD HH:MM", () => {
    // 2026-05-21T13:05:00Z → local time; assert the date + a HH:MM shape.
    const out = formatTableCell("2026-05-21T13:05:00Z");
    expect(out).toMatch(/^2026-05-2[01] \d{2}:\d{2}$/);
    expect(out).not.toContain("T");
  });

  it("leaves plain strings and numbers untouched", () => {
    expect(formatTableCell("BESS-02")).toBe("BESS-02");
    expect(formatTableCell(712)).toBe("712");
  });

  it("renders an em dash for null / undefined", () => {
    expect(formatTableCell(null)).toBe("—");
    expect(formatTableCell(undefined)).toBe("—");
  });
});
